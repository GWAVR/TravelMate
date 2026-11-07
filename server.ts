import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, UserRecord, HotelReservationRecord } from './server/db.js';
import { MAHARASHTRA_HOTELS } from './src/data/maharashtraHotelsData.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client per guidelines
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Database status & diagnostics endpoint
app.get('/api/database/status', (req, res) => {
  const info = db.getDbInfo();
  res.json({
    status: 'ok',
    ...info,
  });
});

// ==========================================
// Authentication & RBAC Administration
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'travelmate-jwt-secret-session-token-av9824';

interface AuthTokenPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  name: string;
}

// Client IP extractor for rate limiting
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Token authentication middleware
async function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    // Always cross-check against database record to prevent using stale or revoked roles
    const freshUser = await db.findUserById(payload.id);
    if (!freshUser) {
      return res.status(401).json({ error: 'User account not found or has been removed.' });
    }

    (req as any).user = freshUser;
    next();
  } catch (err: any) {
    return res.status(403).json({ error: 'Session token has expired or is invalid. Please log in again.' });
  }
}

// Strict server-side Admin authorization middleware
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  await authenticateToken(req, res, () => {
    const user = (req as any).user as UserRecord;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied: Administrator privileges required to access this resource.',
      });
    }
    next();
  });
}

// User / Admin Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, requestedRole } = req.body;
    const ip = getClientIp(req);

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const rateKey = `${ip}:${cleanEmail}`;
    const rateCheck = db.checkRateLimit(rateKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many failed login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
      });
    }

    const user = await db.findUserByEmail(cleanEmail);
    if (!user) {
      db.recordFailedLogin(rateKey);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      const failStatus = db.recordFailedLogin(rateKey);
      if (failStatus.blocked) {
        return res.status(429).json({
          error: 'Too many consecutive failed attempts. Login is temporarily locked for 15 minutes.',
        });
      }
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if account is suspended
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'This account has been suspended. Please contact platform administration.',
      });
    }

    // Role verification
    if (requestedRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      db.recordFailedLogin(rateKey);
      return res.status(403).json({
        error: 'Access denied: This account does not possess administrator privileges.',
      });
    }

    // Reset rate-limit tracker on successful authentication
    db.resetRateLimit(rateKey);
    await db.recordUserLogin(user.id);

    const tokenPayload: AuthTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      await db.logAudit(user.email, 'ADMIN_LOGIN_SUCCESS', 'users', user.id, 'Administrator logged in successfully.', ip);
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar || '',
        bio: user.bio || '',
        memberSince: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2024',
      },
    });
  } catch (err: any) {
    console.error('[Auth API] Login exception:', err);
    res.status(500).json({ error: 'An unexpected authentication error occurred.' });
  }
});

// Dedicated Admin Login Endpoint with strict role enforcement
app.post('/api/auth/admin-login', async (req, res) => {
  req.body.requestedRole = 'ADMIN';
  // Forward to standard login flow with requestedRole forced to ADMIN
  const { email, password } = req.body;
  const ip = getClientIp(req);

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid administrator email.' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Administrator password is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const rateKey = `admin:${ip}:${cleanEmail}`;
  const rateCheck = db.checkRateLimit(rateKey);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: `Too many failed admin login attempts. Please wait ${rateCheck.waitSeconds} seconds before trying again.`,
    });
  }

  const user = await db.findUserByEmail(cleanEmail);
  if (!user) {
    db.recordFailedLogin(rateKey);
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    const failStatus = db.recordFailedLogin(rateKey);
    if (failStatus.blocked) {
      return res.status(429).json({
        error: 'Too many consecutive failed attempts. Admin portal is locked for 15 minutes.',
      });
    }
    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  }

  // Check if account is suspended
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({
      error: 'This administrator account has been suspended.',
    });
  }

  // Enforce ADMIN role
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    db.recordFailedLogin(rateKey);
    return res.status(403).json({
      error: 'Access denied: This user account does not have administrator privileges.',
    });
  }

  db.resetRateLimit(rateKey);
  await db.recordUserLogin(user.id);

  const tokenPayload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  await db.logAudit(user.email, 'ADMIN_LOGIN', 'users', user.id, 'Administrator authenticated via Admin Portal.', ip);

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      bio: user.bio || '',
      memberSince: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2024',
    },
  });
});

// User Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await db.createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'USER',
    });

    const tokenPayload: AuthTokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: '',
        bio: '',
        memberSince: 'Just now',
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

// Verify token and fetch current profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = (req as any).user as UserRecord;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    avatar: user.avatar || '',
    bio: user.bio || '',
    created_at: user.created_at,
  });
});

// Update current user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user as UserRecord;
    const { name, bio, avatar, phone } = req.body;
    const updated = await db.updateUserProfile(user.id, { name, bio, avatar, phone });
    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone || phone || '',
        avatar: updated.avatar || '',
        bio: updated.bio || '',
        memberSince: updated.created_at ? new Date(updated.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2024',
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update profile.' });
  }
});

// Change current user password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user as UserRecord;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatches) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    await db.resetUserPassword(user.id, newPassword);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change password.' });
  }
});

// Protected Super Admin Dashboard Overview Statistics
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const stats = await db.getSuperAdminStats();
    res.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error('[Admin API] Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin dashboard metrics from database.' });
  }
});

// Protected Admin Users List with search & filters
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const users = await db.listUsers({ search, role, status });
    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      avatar: u.avatar || '',
      bio: u.bio || '',
      last_login_at: u.last_login_at,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
    res.json({ success: true, users: safeUsers });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve users from database.' });
  }
});

// Protected Admin Create User
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const adminUser = (req as any).user as UserRecord;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';

    const created = await db.createUser({
      name,
      email,
      passwordHash,
      role: assignedRole,
      status: 'ACTIVE',
    });

    await db.logAudit(
      adminUser.email,
      'USER_CREATED_BY_ADMIN',
      'users',
      created.id,
      `Admin created account ${created.email} with role ${assignedRole}.`,
      getClientIp(req)
    );

    res.json({
      success: true,
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        status: created.status,
        created_at: created.created_at,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create user.' });
  }
});

// Protected Admin Update User Status (Suspend / Reactivate)
app.patch('/api/admin/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = (req as any).user as UserRecord;

    if (id === adminUser.id) {
      return res.status(400).json({ error: 'Cannot change the status of your own administrator account.' });
    }
    if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
      return res.status(400).json({ error: 'Status must be either ACTIVE or SUSPENDED.' });
    }

    const updated = await db.updateUserStatus(id, status);

    await db.logAudit(
      adminUser.email,
      status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      'users',
      id,
      `Admin updated account status of ${updated.email} to ${status}.`,
      getClientIp(req)
    );

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user status.' });
  }
});

// Protected Admin Reset User Password
app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const adminUser = (req as any).user as UserRecord;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    await db.resetUserPassword(id, password);

    const targetUser = await db.findUserById(id);
    await db.logAudit(
      adminUser.email,
      'USER_PASSWORD_RESET',
      'users',
      id,
      `Admin reset password for user ${targetUser?.email || id}.`,
      getClientIp(req)
    );

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset password.' });
  }
});

// Protected Admin Delete User
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user as UserRecord;

    if (id === adminUser.id) {
      return res.status(400).json({ error: 'Cannot delete your own administrator account.' });
    }

    const targetUser = await db.findUserById(id);
    const deleted = await db.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'User not found in database.' });
    }

    await db.logAudit(
      adminUser.email,
      'USER_DELETED_BY_ADMIN',
      'users',
      id,
      `Admin deleted user ID ${id} (${targetUser?.email || 'unknown'}).`,
      getClientIp(req)
    );

    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Protected Admin Trips List with search & filters
app.get('/api/admin/trips', requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const trips = await db.listTrips({ search, status });
    const users = await db.listUsers();
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedTrips = trips.map((t) => {
      const owner = userMap.get(t.user_id);
      return {
        id: t.id,
        userId: t.user_id,
        ownerName: owner?.name || 'Traveler',
        ownerEmail: owner?.email || '',
        name: t.name,
        location: t.location,
        country: t.country,
        dates: t.dates,
        daysTotal: t.days_total,
        budgetLimitUsd: Number(t.budget_limit_usd) || 0,
        spentUsd: Number(t.spent_usd) || 0,
        status: t.status,
        isArchived: Boolean(t.is_archived),
        createdAt: t.created_at,
      };
    });

    res.json({ success: true, trips: formattedTrips });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve trips.' });
  }
});

// Protected Admin Archive / Restore Trip
app.patch('/api/admin/trips/:id/archive', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    const adminUser = (req as any).user as UserRecord;

    await db.archiveTrip(id, Boolean(isArchived));

    await db.logAudit(
      adminUser.email,
      isArchived ? 'TRIP_ARCHIVED' : 'TRIP_RESTORED',
      'trips',
      id,
      `Admin set trip ${id} archive status to ${Boolean(isArchived)}.`,
      getClientIp(req)
    );

    res.json({ success: true, message: 'Trip archive status updated.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update trip archive state.' });
  }
});

// Protected Admin Delete Trip (ONLY admin can delete trips)
app.delete('/api/admin/trips/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = (req as any).user as UserRecord;

    const deleted = await db.deleteTrip(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    await db.logAudit(
      adminUser.email,
      'TRIP_DELETED_BY_ADMIN',
      'trips',
      id,
      `Admin ${adminUser.email} permanently deleted trip ${id}.`,
      getClientIp(req)
    );

    res.json({ success: true, message: 'Trip successfully deleted by administrator.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete trip.' });
  }
});

// User Trips: Retrieve all saved trips from database
app.get('/api/trips', async (req, res) => {
  try {
    const trips = await db.listTrips();
    const formatted = trips.map((t) => ({
      id: t.id,
      userId: t.user_id,
      name: t.name,
      shortName: t.name.split('•')[0].trim() || t.name,
      location: t.location,
      country: t.country,
      dates: t.dates,
      daysTotal: t.days_total,
      currentDay: 1,
      statusBadge: `${t.status} • Maharashtra`,
      statusColor: t.status === 'Active' ? 'bg-[#d1fae5] text-[#006c49]' : 'bg-[#e0f2fe] text-[#006194]',
      daysLeftText: 'Starts soon',
      weatherTemp: '24°C',
      weatherCondition: 'Clear & Sunny',
      weatherRain: '0% rain',
      weatherIcon: 'wb_sunny',
      backgroundImage: t.location.toLowerCase().includes('ajanta')
        ? 'https://images.unsplash.com/photo-1598977123418-454555aa166b?auto=format&fit=crop&w=1200&q=80'
        : t.location.toLowerCase().includes('tadoba')
        ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
        : t.location.toLowerCase().includes('ganpatipule')
        ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      imageAlt: t.name,
      tagline: `Maharashtra expedition in ${t.location}`,
      totalBudgetUsd: Number(t.budget_limit_usd) || 45000,
      spentUsd: Number(t.spent_usd) || 0,
      todayScheduleTitle: "Day 1 Schedule",
      todayScheduleSub: `Day 1 • Arrival in ${t.location}`,
      paxCount: 4,
    }));

    res.json({ success: true, trips: formatted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch trips from database.' });
  }
});

// User Trips: Create and permanently store new trip in database
app.post('/api/trips', async (req, res) => {
  try {
    const {
      id,
      name,
      shortName,
      location,
      country = 'India, Maharashtra',
      dates,
      daysTotal = 7,
      totalBudgetUsd = 45000,
      userId = 'usr-traveler',
    } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Trip name and location are required.' });
    }

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    let resolvedUserId = userId;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        resolvedUserId = decoded.id || decoded.userId || resolvedUserId;
      } catch {
        // ignore
      }
    }

    const tripId = id || `trip-${Date.now()}`;
    const now = new Date().toISOString();

    await db.createTrip({
      id: tripId,
      user_id: resolvedUserId,
      name: name.trim(),
      location: location.trim(),
      country: country.trim(),
      dates: dates || 'Upcoming',
      days_total: Number(daysTotal) || 7,
      budget_limit_usd: Number(totalBudgetUsd) || 45000,
      spent_usd: 0,
      status: 'Active',
      is_archived: false,
      created_at: now,
      updated_at: now,
    });

    res.json({ success: true, message: 'Trip successfully stored in database.', tripId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create trip in database.' });
  }
});

// User Expenses: Retrieve all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.listExpenses();
    res.json({ success: true, expenses });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch expenses from database.' });
  }
});

// User Expenses: Store new expense in database
app.post('/api/expenses', async (req, res) => {
  try {
    const { id, tripId, userId = 'usr-traveler', title, amountUsd, amountLocal, currency = 'INR', category = 'food', payerName, date } = req.body;
    if (!title || !amountUsd) {
      return res.status(400).json({ error: 'Title and amount are required.' });
    }

    const now = new Date().toISOString();
    const expenseId = id || `exp-${Date.now()}`;

    await db.createExpense({
      id: expenseId,
      trip_id: tripId || 'trip-sahyadri-heritage',
      user_id: userId,
      title: title.trim(),
      amount_usd: Number(amountUsd),
      amount_local: Number(amountLocal || amountUsd),
      currency: currency || 'INR',
      category: category || 'food',
      payer_name: payerName || 'Abhijeet Rao (You)',
      date: date || 'Today',
      created_at: now,
    });

    res.json({ success: true, message: 'Expense stored in database.', expenseId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record expense in database.' });
  }
});

// Protected Admin Expenses List & Analytics
app.get('/api/admin/expenses', requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const currency = typeof req.query.currency === 'string' ? req.query.currency : undefined;

    const expenses = await db.listExpenses({ search, category, currency });
    const analytics = await db.getExpensesAnalytics();

    const formatted = expenses.map((e) => ({
      id: e.id,
      tripId: e.trip_id,
      title: e.title,
      amountUsd: Number(e.amount_usd) || 0,
      currency: e.currency || 'USD',
      category: e.category,
      payerName: e.payer_name || 'Traveler',
      date: e.date || '',
      createdAt: e.created_at,
    }));

    res.json({ success: true, expenses: formatted, analytics });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve expenses.' });
  }
});

// Protected Admin Destinations List
app.get('/api/admin/destinations', requireAdmin, async (req, res) => {
  try {
    const destinations = await db.listDestinations();
    const formatted = destinations.map((d) => ({
      id: d.id,
      name: d.name,
      city: d.city,
      country: d.country,
      continent: d.continent,
      category: d.category,
      rating: Number(d.rating) || 4.8,
      tripsCount: d.trips_count,
      heroImage: d.hero_image,
    }));
    res.json({ success: true, destinations: formatted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve destinations.' });
  }
});

// Protected Admin AI Telemetry & Usage Metrics
app.get('/api/admin/ai-metrics', requireAdmin, async (req, res) => {
  try {
    const aiMetrics = await db.getAiMetrics();
    res.json({ success: true, aiMetrics });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve AI usage telemetry.' });
  }
});

// Protected Admin Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
  try {
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    const auditLogs = await db.getAuditLogs(150, action);
    res.json({ success: true, auditLogs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// Protected Admin CSV Data Export
app.get('/api/admin/export/:type', requireAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const adminUser = (req as any).user as UserRecord;

    if (!['users', 'trips', 'expenses', 'audit', 'ai', 'reservations'].includes(type)) {
      return res.status(400).json({ error: 'Invalid export type. Supported: users, trips, expenses, audit, ai, reservations.' });
    }

    const csvContent = await db.generateCsvExport(type as any);

    await db.logAudit(
      adminUser.email,
      'DATA_EXPORT',
      type,
      '',
      `Admin exported ${type.toUpperCase()} data to CSV.`,
      getClientIp(req)
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="travelmate_${type}_export.csv"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate export file.' });
  }
});

// Protected Admin Settings: Change Password
app.post('/api/admin/settings/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminUser = (req as any).user as UserRecord;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    await db.changeAdminPassword(adminUser.email, currentPassword, newPassword);

    await db.logAudit(
      adminUser.email,
      'ADMIN_PASSWORD_CHANGED',
      'users',
      adminUser.id,
      'Administrator changed password successfully.',
      getClientIp(req)
    );

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update password.' });
  }
});

// Protected Admin Settings: Update Profile
app.patch('/api/admin/settings/profile', requireAdmin, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const adminUser = (req as any).user as UserRecord;

    const updated = await db.updateAdminProfile(adminUser.email, { name, bio });

    await db.logAudit(
      adminUser.email,
      'ADMIN_PROFILE_UPDATED',
      'users',
      adminUser.id,
      `Admin updated profile name to "${updated.name}".`,
      getClientIp(req)
    );

    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        bio: updated.bio,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to update profile.' });
  }
});

// Protected Admin Logout
app.post('/api/admin/logout', requireAdmin, async (req, res) => {
  const adminUser = (req as any).user as UserRecord;
  await db.logAudit(adminUser.email, 'ADMIN_LOGOUT', 'users', adminUser.id, 'Admin signed out of dashboard session.', getClientIp(req));
  res.json({ success: true, message: 'Admin signed out successfully.' });
});

// Protected Admin: Get All Hotel Reservations
app.get('/api/admin/reservations', requireAdmin, async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const district = typeof req.query.district === 'string' ? req.query.district : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const reservations = await db.listReservations({ search, district, status });
    res.json({ success: true, reservations });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve hotel reservations.' });
  }
});

// Protected Admin: Update Reservation Status
app.patch('/api/admin/reservations/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUser = (req as any).user as UserRecord;

    if (!['Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid reservation status. Allowed: Confirmed, Completed, Cancelled' });
    }

    const updated = await db.updateReservationStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    await db.logAudit(
      adminUser.email,
      'RESERVATION_STATUS_UPDATED',
      'hotel_reservations',
      id,
      `Admin updated reservation ${id} status to ${status}.`,
      getClientIp(req)
    );

    res.json({ success: true, message: `Reservation status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update reservation status.' });
  }
});

// Protected Admin: Drilldown Full User Data (all trips, expenses, activities, reservations)
app.get('/api/admin/users/:id/full-data', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const fullData = await db.getUserFullData(id);
    if (!fullData) {
      return res.status(404).json({ error: 'User not found in database.' });
    }

    const adminUser = (req as any).user as UserRecord;
    await db.logAudit(
      adminUser.email,
      'USER_FULL_DATA_INSPECTED',
      'users',
      id,
      `Admin inspected complete dataset for user ${fullData.user.email} (trips: ${fullData.trips.length}, reservations: ${fullData.reservations.length}).`,
      getClientIp(req)
    );

    res.json({ success: true, data: fullData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect user data.' });
  }
});

// ==========================================
// Maharashtra Hotel Lodging & Reservations APIs
// ==========================================

// Public / User Lodging: Get Maharashtra Hotels
app.get('/api/lodging/hotels', (req, res) => {
  try {
    const district = typeof req.query.district === 'string' ? req.query.district : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.toLowerCase().trim() : undefined;

    let hotels = [...MAHARASHTRA_HOTELS];

    if (district && district !== 'ALL') {
      hotels = hotels.filter((h) => h.district.toLowerCase() === district.toLowerCase());
    }
    if (type && type !== 'ALL') {
      hotels = hotels.filter((h) => h.type.toLowerCase().includes(type.toLowerCase()));
    }
    if (search) {
      hotels = hotels.filter(
        (h) =>
          h.name.toLowerCase().includes(search) ||
          h.city.toLowerCase().includes(search) ||
          h.district.toLowerCase().includes(search) ||
          h.tagline.toLowerCase().includes(search) ||
          h.amenities.some((a) => a.toLowerCase().includes(search))
      );
    }

    res.json({ success: true, count: hotels.length, hotels });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list hotels.' });
  }
});

// User Lodging: List User's Reservations
app.get('/api/lodging/reservations', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    let userId: string | undefined = undefined;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.id || decoded.userId;
      } catch {
        // ignore invalid token
      }
    }

    if (!userId && typeof req.query.userId === 'string') {
      userId = req.query.userId;
    }

    // If still no specific userId provided, return the user's or guest's reservations
    const reservations = await db.listReservations(userId ? { user_id: userId } : undefined);
    res.json({ success: true, reservations });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user reservations.' });
  }
});

// User Lodging: Create Hotel Booking Reservation
app.post('/api/lodging/reservations', async (req, res) => {
  try {
    const {
      hotelId,
      hotelName,
      hotelImage,
      district,
      city,
      roomTypeId,
      roomTypeName,
      checkInDate,
      checkOutDate,
      nightsCount = 1,
      guestsCount = 2,
      guestName,
      guestEmail,
      guestPhone,
      specialRequests = '',
      roomRatePerNightInr,
      totalAmountInr,
      totalAmountUsd,
      tripId,
      userId,
      paymentStatus = 'Pay at Hotel',
    } = req.body;

    if (!hotelName || !guestName || !guestEmail || !guestPhone || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: 'Missing required reservation fields (hotelName, guestName, guestEmail, guestPhone, dates).' });
    }

    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    let resolvedUserId = userId || 'usr-guest';
    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        resolvedUserId = decoded.id || decoded.userId || resolvedUserId;
      } catch {
        // ignore
      }
    }

    const bookingRef = `TM-MH-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString();

    const reservationRecord: HotelReservationRecord = {
      id: `res-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      booking_ref: bookingRef,
      user_id: resolvedUserId,
      trip_id: tripId || undefined,
      hotel_id: hotelId || 'hotel-custom',
      hotel_name: hotelName,
      hotel_image: hotelImage || '',
      district: district || 'Maharashtra',
      city: city || 'Maharashtra',
      room_type_id: roomTypeId || 'standard',
      room_type_name: roomTypeName || 'Standard Room',
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      nights_count: Number(nightsCount) || 1,
      guests_count: Number(guestsCount) || 2,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: guestPhone,
      special_requests: specialRequests,
      room_rate_per_night_inr: Number(roomRatePerNightInr) || 4500,
      total_amount_inr: Number(totalAmountInr) || Number(roomRatePerNightInr) || 4500,
      total_amount_usd: Number(totalAmountUsd) || Math.round((Number(totalAmountInr) || 4500) / 84),
      status: 'Confirmed',
      payment_status: paymentStatus === 'Paid' ? 'Paid' : 'Pay at Hotel',
      created_at: now,
    };

    const saved = await db.createReservation(reservationRecord);
    res.status(201).json({ success: true, reservation: saved, bookingRef });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create reservation.' });
  }
});


// TripGenie 360° Analysis Endpoint
app.post('/api/tripgenie/analyze', async (req, res) => {
  try {
    const { trip, itinerary = [], expenses = [], members = [], user = {} } = req.body;

    const totalSpent = expenses.reduce((sum: number, e: any) => sum + (Number(e.amountUsd) || 0), 0);
    const budgetLimit = Number(user.tripBudgetLimit) || (trip?.budgetLimitUsd ? Number(trip.budgetLimitUsd) : 1500);
    const daysTotal = Number(trip?.daysTotal) || 8;
    const daysElapsed = Math.min(3, daysTotal);
    const dailyBurnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    const projectedTotal = dailyBurnRate * daysTotal;
    const overBudgetRisk = totalSpent > budgetLimit ? 'high' : projectedTotal > budgetLimit ? 'moderate' : 'low';

    // Group balance calculation
    const memberPaidMap: Record<string, number> = {};
    members.forEach((m: any) => {
      memberPaidMap[m.name] = 0;
    });
    expenses.forEach((e: any) => {
      const payer = e.payerName || 'Unknown';
      memberPaidMap[payer] = (memberPaidMap[payer] || 0) + (Number(e.amountUsd) || 0);
    });

    // Categories breakdown
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amountUsd) || 0);
    });
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCats[0] ? sortedCats[0][0] : 'Dining & Street Food';

    const ai = getGemini();

    if (ai) {
      const prompt = `You are TripGenie, an expert AI travel planner and trip auditor specializing in Maharashtra, India.
Analyze the following travel trip across Maharashtra's 36 districts and return a comprehensive audit in STRICT JSON format with no markdown fences, no formatting tags, just raw JSON.

Trip Destination: ${trip?.name || 'Sahyadri & Konkan Grand Tour'} (${trip?.location || 'Maharashtra, India'})
Trip Dates: ${trip?.dates || 'Nov 14 - Nov 21'} (${daysTotal} days total)
Weather: ${trip?.weatherTemp || '24°C'}, ${trip?.weatherCondition || 'Pleasant & Sunny'}
User: ${user?.name || 'Abhijeet Rao'}, Pace preference: ${user?.pace || 'Balanced'}
Budget Limit: ₹${budgetLimit} INR
Total Spent So Far: ₹${totalSpent} INR
Projected Total: ₹${projectedTotal} INR
Over-Budget Risk: ${overBudgetRisk}
Top Expense Category: ${topCategory} (₹${(sortedCats[0]?.[1] || 0)})

Itinerary Items (${itinerary.length} items):
${itinerary.slice(0, 10).map((act: any) => `- Day ${act.day} [${act.timeSlot}]: ${act.title} at ${act.location} (${act.category})`).join('\n')}

Group Members (${members.length} members):
${members.map((m: any) => `- ${m.name} (${m.role}): paid ₹${(memberPaidMap[m.name] || 0)} INR`).join('\n')}

Return a valid JSON object matching this exact schema (all monetary values MUST be in Indian Rupees ₹):
{
  "readinessScore": number between 65 and 98,
  "status": "optimal" | "attention" | "warning",
  "summary": "2-3 sentences summarizing the overall state of the Maharashtra trip across heritage fort treks, MTDC stays, budget in INR, and group dynamics.",
  "itinerary": {
    "score": number between 70 and 99,
    "pacingAssessment": "Short assessment of daily schedule pacing and Maharashtra Sahyadri transit density.",
    "highlights": ["highlight 1", "highlight 2"],
    "clashes": ["potential timing or ghat weather clash if any"],
    "transitGaps": ["transit or ghat road transfer note"],
    "suggestions": ["specific actionable scheduling tip 1", "specific actionable scheduling tip 2"]
  },
  "budget": {
    "score": number between 50 and 99,
    "totalSpentUsd": ${totalSpent},
    "budgetLimitUsd": ${budgetLimit},
    "burnRateDailyUsd": ${Math.round(dailyBurnRate)},
    "projectedTotalUsd": ${Math.round(projectedTotal)},
    "overBudgetRisk": "${overBudgetRisk}",
    "topExpenseCategory": "${topCategory}",
    "savingsOpportunities": ["practical tip to save rupees on MTDC resorts, state transport, or ticket queues 1", "practical tip 2"]
  },
  "group": {
    "score": number between 70 and 98,
    "fairnessIndex": "e.g. 88% - Fair distribution across travelers via UPI",
    "topCreditor": "Name of who paid the most",
    "topDebtor": "Name of who needs to settle",
    "settlementAdvice": ["actionable advice to keep balances fair via UPI/GPay"]
  },
  "packing": {
    "score": number between 75 and 96,
    "weatherReadiness": "Assessment for the expected Maharashtra climate",
    "missingEssentials": ["essential 1 for Maharashtra forts/beaches", "essential 2"],
    "culturalEtiquette": ["cultural etiquette tip for Maharashtra Jyotirlingas or temple towns", "attire requirement for holy sites"]
  },
  "quickFixes": [
    {
      "id": "fix-1",
      "title": "Short title",
      "category": "itinerary" | "budget" | "group" | "packing",
      "impact": "e.g. Save ₹850 or Beat fort crowds",
      "description": "Clear single-sentence description of the smart recommendation"
    },
    {
      "id": "fix-2",
      "title": "Short title",
      "category": "itinerary" | "budget" | "group" | "packing",
      "impact": "High or Medium",
      "description": "Clear single-sentence description of the recommendation"
    },
    {
      "id": "fix-3",
      "title": "Short title",
      "category": "itinerary" | "budget" | "group" | "packing",
      "impact": "Pacing improvement",
      "description": "Clear single-sentence description"
    }
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.4,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        try {
          const parsed = JSON.parse(text);
          return res.json({
            ...parsed,
            analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        } catch (parseError) {
          console.error('Failed to parse Gemini JSON output, falling back to deterministic response:', parseError);
        }
      } catch (geminiError: any) {
        console.warn('TripGenie Gemini call unavailable (e.g. 503/high demand), using deterministic fallback:', geminiError?.message || geminiError);
      }
    }

    // High quality deterministic fallback when AI key is missing or offline
    const fallbackScore = Math.max(65, Math.min(94, Math.round(92 - (totalSpent > budgetLimit ? 22 : totalSpent > budgetLimit * 0.8 ? 10 : 0))));
    const fallbackStatus = totalSpent > budgetLimit ? 'warning' : totalSpent > budgetLimit * 0.8 ? 'attention' : 'optimal';

    const fallbackAnalysis = {
      readinessScore: fallbackScore,
      status: fallbackStatus,
      summary: `TripGenie analyzed ${itinerary.length} scheduled stops, ₹${totalSpent.toLocaleString('en-IN')} in recorded expenses across ${members.length} travelers. Schedule pacing is healthy, with budget tracking at ${Math.round((totalSpent / budgetLimit) * 100)}% of your ₹${budgetLimit.toLocaleString('en-IN')} limit.`,
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itinerary: {
        score: 90,
        pacingAssessment: 'Morning slots beat the midday Sahyadri heat. High-energy fort ascent scheduled in early morning.',
        highlights: [
          'Sunrise fort ramparts visit beats peak afternoon tourist rush and provides prime photography light',
          'Good mix of Maratha heritage fortresses, MTDC seaside stays, and authentic local cuisine',
        ],
        clashes: [
          'Ghat road travel after dusk: recommend arriving at Mahabaleshwar/Panchgani before 18:00',
        ],
        transitGaps: [
          'Allow 45 mins buffer on Mumbai-Pune expressway and Bhor ghat during weekend morning hours',
        ],
        suggestions: [
          'Book MTDC Beach Resort Ganpatipule or Tarkarli 48h in advance to ensure cottage availability',
          'Enjoy authentic Kolhapuri Misal Pav and fresh Malvani fish thali at certified family dhabas',
        ],
      },
      budget: {
        score: totalSpent > budgetLimit ? 58 : 88,
        totalSpentUsd: totalSpent,
        budgetLimitUsd: budgetLimit,
        burnRateDailyUsd: Math.round(dailyBurnRate),
        projectedTotalUsd: Math.round(projectedTotal),
        overBudgetRisk,
        topExpenseCategory: topCategory,
        savingsOpportunities: [
          'Use MSRTC Shivshahi AC buses or local train passes between Mumbai and Pune to save ~45% on toll and cab costs',
          'Book official ASI tickets for Ajanta & Ellora caves online (₹40 Indians) to avoid long on-site ticketing queues',
        ],
      },
      group: {
        score: 92,
        fairnessIndex: '89% - Fair distribution across members via UPI',
        topCreditor: members[0]?.name || 'Abhijeet Rao',
        topDebtor: members[1]?.name || 'Tanvi Deshmukh',
        settlementAdvice: [
          'Rohan has 2 small pending splits (₹450 & ₹820); one-click batch settle via UPI recommended',
          'Fuel and hotel room charges are evenly split; keep using automated UPI settlements',
        ],
      },
      packing: {
        score: 94,
        weatherReadiness: `Optimized for ${trip?.weatherTemp || '24°C'} with breezy Sahyadri plateau evenings`,
        missingEssentials: [
          'Sturdy high-traction trekking shoes for stone fort staircases (Raigad, Sinhagad, Pratapgad)',
          'Sun cap, sunglasses & 10,000mAh power bank for full-day ghat and cave expeditions',
        ],
        culturalEtiquette: [
          'Footwear must be deposited outside inner sanctums at Trimbakeshwar, Shirdi, and Tuljapur temples',
          'Dress modestly with shoulders covered when entering sacred Jyotirlinga and Ashtavinayak shrines',
        ],
      },
      quickFixes: [
        {
          id: 'fix-1',
          title: 'Shift Raigad Fort Ascent to 07:00 AM',
          category: 'itinerary',
          impact: 'Avoid 80% of heat & ropeway queues',
          description: 'Early morning allows cooler temperatures and pristine Sahyadri valley photography lighting.',
          applied: false,
        },
        {
          id: 'fix-2',
          title: 'Activate Daily Dining Cap (₹1,200/person)',
          category: 'budget',
          impact: 'Preserves ₹4,500 buffer in INR',
          description: 'Keeps projected spending safely under your configured trip budget limit.',
          applied: false,
        },
        {
          id: 'fix-3',
          title: 'Batch Settle Minor Group Balances via UPI',
          category: 'group',
          impact: 'Clears 3 open micro-debts',
          description: 'Consolidates separate snack and toll splits into a single instant UPI transfer.',
          applied: false,
        },
      ],
    };

    return res.json(fallbackAnalysis);
  } catch (error: any) {
    console.error('TripGenie analysis error:', error);
    res.status(500).json({ error: error.message || 'Internal server error analyzing trip' });
  }
});

// In-memory Weather Forecast Cache to conserve Gemini API quota
const weatherForecastCache = new Map<string, { forecast: any; cachedAt: number }>();

// TripGenie 5-Day Weather Forecast Endpoint
app.post('/api/tripgenie/weather', async (req, res) => {
  try {
    const {
      destination = 'Maharashtra, India',
      location = 'Maharashtra, India',
      destinationId = '1',
      dates = 'Nov 14 – Nov 21',
      currentWeather = '28°C Pleasant & Sunny',
    } = req.body;

    const cacheKey = `${destinationId}_${destination}_${location}`;
    const cached = weatherForecastCache.get(cacheKey);
    // Cache for 30 minutes
    if (cached && Date.now() - cached.cachedAt < 30 * 60 * 1000) {
      return res.json(cached.forecast);
    }

    const ai = getGemini();

    if (ai) {
      const prompt = `You are TripGenie, an expert AI travel assistant specializing in destination climate analysis and itinerary weather planning.
Generate a realistic, geographically accurate 5-day weather forecast for travelers visiting:
Destination: "${destination}"
Location: "${location}"
Trip Dates: "${dates}"
Current observed weather: "${currentWeather}"

Return ONLY valid JSON matching this exact structure with no markdown fences, no formatting tags, just raw JSON:
{
  "destinationId": "${destinationId}",
  "destinationName": "${destination}",
  "location": "${location}",
  "summaryAdvisory": "1-2 sentences summarizing the 5-day weather outlook, best outdoor day, and climate packing advice.",
  "bestOutdoorDay": "e.g. Day 1 (Today)",
  "cautionDay": "e.g. Day 3 (Thu)",
  "days": [
    {
      "id": "day-1",
      "dayLabel": "Today",
      "dateStr": "e.g. Nov 14",
      "condition": "e.g. Sunny & Crisp",
      "weatherType": "sunny",
      "icon": "wb_sunny",
      "tempHighC": 28,
      "tempLowC": 18,
      "rainChancePct": 0,
      "humidityPct": 52,
      "windSpeedKmH": 12,
      "tripGenieTip": "e.g. Prime weather for fort trekking and outdoor exploration",
      "recommendation": "outdoor_favorable"
    }
  ]
}
Requirements:
- "days" array MUST contain exactly 5 days (Day 1 to Day 5).
- "weatherType" must be one of: "sunny", "partly_cloudy", "cloudy", "rainy", "thunderstorm", "snowy", "windy".
- "icon" must be a valid Google Material Symbol name corresponding to the weather (e.g. "wb_sunny", "partly_cloudy_day", "cloud", "rainy", "thunderstorm", "ac_unit", "air").
- "recommendation" must be one of: "outdoor_favorable", "good", "rain_prep", "indoor_ideal".
- Temperatures must be integers in Celsius suitable for the destination and season.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        try {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
            const result = {
              ...parsed,
              destinationId,
              fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            weatherForecastCache.set(cacheKey, { forecast: result, cachedAt: Date.now() });
            return res.json(result);
          }
        } catch (parseError) {
          console.error('Failed to parse Gemini Weather output, using fallback:', parseError);
        }
      } catch (geminiError: any) {
        const isQuota =
          geminiError?.status === 429 ||
          geminiError?.code === 429 ||
          (typeof geminiError?.message === 'string' &&
            (geminiError.message.includes('429') ||
              geminiError.message.includes('Quota exceeded') ||
              geminiError.message.includes('RESOURCE_EXHAUSTED')));
        if (isQuota) {
          console.info('TripGenie weather: Gemini daily quota reached, using regional Maharashtra forecast fallback.');
        } else {
          console.warn('TripGenie weather: using regional fallback:', geminiError?.message || 'High demand');
        }
      }
    }

    // Curated high-fidelity fallback based on destination
    const fallbackForecast = getFallbackWeatherForecast(destinationId, destination, location);
    weatherForecastCache.set(cacheKey, { forecast: fallbackForecast, cachedAt: Date.now() });
    return res.json(fallbackForecast);
  } catch (error: any) {
    console.error('TripGenie weather error:', error);
    res.status(500).json({ error: error.message || 'Error fetching weather forecast' });
  }
});

function getFallbackWeatherForecast(destinationId: string, destination: string, location: string) {
  const isMarathwada = destinationId === '2' || destination.toLowerCase().includes('ajanta') || destination.toLowerCase().includes('ellora') || destination.toLowerCase().includes('sambhaji');
  const isVidarbha = destinationId === '3' || destination.toLowerCase().includes('tadoba') || destination.toLowerCase().includes('nagpur') || destination.toLowerCase().includes('lonar');
  const isNashik = destination.toLowerCase().includes('nashik') || destination.toLowerCase().includes('shirdi') || destination.toLowerCase().includes('bhandardara');

  if (isMarathwada) {
    return {
      destinationId,
      destinationName: destination || 'Marathwada UNESCO Caves & Heritage',
      location: location || 'Chhatrapati Sambhaji Nagar, Maharashtra',
      summaryAdvisory: 'Crisp dry Deccan sunshine with pleasant mornings. Outstanding conditions for Kailash Temple monolithic stone exploration and Ajanta cave frescoes.',
      bestOutdoorDay: 'Day 2 (Wed)',
      cautionDay: 'Day 4 (Fri - Midday Sun)',
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      days: [
        {
          id: 'day-1',
          dayLabel: 'Today',
          dateStr: 'Nov 14',
          condition: 'Sunny & Pleasant',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 27,
          tempLowC: 15,
          rainChancePct: 0,
          humidityPct: 42,
          windSpeedKmH: 10,
          tripGenieTip: 'Ideal morning light for Ellora Kailash Temple courtyard photography.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-2',
          dayLabel: 'Day 2 (Wed)',
          dateStr: 'Nov 15',
          condition: 'Clear Blue Sky',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 28,
          tempLowC: 16,
          rainChancePct: 0,
          humidityPct: 38,
          windSpeedKmH: 11,
          tripGenieTip: 'Pristine visibility: prime time for Daulatabad Fort hilltop fortress hike.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-3',
          dayLabel: 'Day 3 (Thu)',
          dateStr: 'Nov 16',
          condition: 'Mild & Sunny',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 27,
          tempLowC: 15,
          rainChancePct: 0,
          humidityPct: 40,
          windSpeedKmH: 9,
          tripGenieTip: 'Full day excursion to Ajanta horseshoe gorge caves; carry water and sun protection.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-4',
          dayLabel: 'Day 4 (Fri)',
          dateStr: 'Nov 17',
          condition: 'Warm Golden Sunshine',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 29,
          tempLowC: 17,
          rainChancePct: 0,
          humidityPct: 36,
          windSpeedKmH: 8,
          tripGenieTip: 'Visit Bibi Ka Maqbara at sunset for soft rose-tinted marble silhouettes.',
          recommendation: 'good',
        },
        {
          id: 'day-5',
          dayLabel: 'Day 5 (Sat)',
          dateStr: 'Nov 18',
          condition: 'Clear & Pleasant',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 28,
          tempLowC: 16,
          rainChancePct: 0,
          humidityPct: 39,
          windSpeedKmH: 10,
          tripGenieTip: 'Shop authentic Paithani sarees and Himroo shawls in old city bazaars.',
          recommendation: 'outdoor_favorable',
        },
      ],
    };
  }

  if (isVidarbha) {
    return {
      destinationId,
      destinationName: destination || 'Vidarbha Tiger Safari & Lonar Meteorite',
      location: location || 'Tadoba (Chandrapur) • Nagpur, Maharashtra',
      summaryAdvisory: 'Crisp morning teak forest chill with clear dry afternoons. Superb tiger tracking conditions around Tadoba lakes and pristine Lonar crater viewpoints.',
      bestOutdoorDay: 'Day 1 (Today)',
      cautionDay: 'Day 3 (Thu - Chilly Dawn)',
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      days: [
        {
          id: 'day-1',
          dayLabel: 'Today',
          dateStr: 'Jan 5',
          condition: 'Cool Forest Sun',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 26,
          tempLowC: 12,
          rainChancePct: 0,
          humidityPct: 48,
          windSpeedKmH: 8,
          tripGenieTip: 'Afternoon gypsy safari in Moharli core zone; tigers frequently spot near Telia lake.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-2',
          dayLabel: 'Day 2 (Wed)',
          dateStr: 'Jan 6',
          condition: 'Misty Dawn & Sun',
          weatherType: 'partly_cloudy',
          icon: 'wb_sunny',
          tempHighC: 25,
          tempLowC: 11,
          rainChancePct: 0,
          humidityPct: 52,
          windSpeedKmH: 7,
          tripGenieTip: 'Wear a warm fleece jacket for 06:00 AM open safari departure.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-3',
          dayLabel: 'Day 3 (Thu)',
          dateStr: 'Jan 7',
          condition: 'Pleasant & Crisp',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 27,
          tempLowC: 13,
          rainChancePct: 0,
          humidityPct: 44,
          windSpeedKmH: 9,
          tripGenieTip: 'Drive to Lonar salt crater lake; explore 12th-century Daitya Sudan temple.',
          recommendation: 'good',
        },
        {
          id: 'day-4',
          dayLabel: 'Day 4 (Fri)',
          dateStr: 'Jan 8',
          condition: 'Warm Golden Sunshine',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 28,
          tempLowC: 14,
          rainChancePct: 0,
          humidityPct: 41,
          windSpeedKmH: 10,
          tripGenieTip: 'Nagpur city culinary trail: taste authentic Tarri Poha and orange barfi.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-5',
          dayLabel: 'Day 5 (Sat)',
          dateStr: 'Jan 9',
          condition: 'Sunny & Clear',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 27,
          tempLowC: 13,
          rainChancePct: 0,
          humidityPct: 45,
          windSpeedKmH: 8,
          tripGenieTip: 'Visit Deekshabhoomi stupa and Sevagram Ashram in neighboring Wardha.',
          recommendation: 'outdoor_favorable',
        },
      ],
    };
  }

  // Default: Sahyadri & Konkan Grand Tour (Mumbai • Pune • Mahabaleshwar • Raigad)
  return {
    destinationId: destinationId || '1',
    destinationName: destination || 'Sahyadri & Konkan Grand Tour',
    location: location || 'Mumbai • Pune • Mahabaleshwar • Raigad, Maharashtra',
    summaryAdvisory: 'Pleasant Sahyadri hill breeze with clear Konkan skies. Day 1 & 2 offer optimal fort trekking weather; evenings bring refreshing plateau breezes in Mahabaleshwar.',
    bestOutdoorDay: 'Day 1 (Today)',
    cautionDay: 'Day 3 (Thu - Midday Sun on Ghats)',
    fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    days: [
      {
        id: 'day-1',
        dayLabel: 'Today',
        dateStr: 'Nov 14',
        condition: 'Breezy & Sunny',
        weatherType: 'sunny',
        icon: 'wb_sunny',
        tempHighC: 25,
        tempLowC: 16,
        rainChancePct: 0,
        humidityPct: 54,
        windSpeedKmH: 12,
        tripGenieTip: 'Early morning Raigad ropeway ascent beats noon Sahyadri heat and queue lines.',
        recommendation: 'outdoor_favorable',
      },
      {
        id: 'day-2',
        dayLabel: 'Day 2 (Wed)',
        dateStr: 'Nov 15',
        condition: 'Cool Mountain Air',
        weatherType: 'sunny',
        icon: 'wb_sunny',
        tempHighC: 23,
        tempLowC: 13,
        rainChancePct: 0,
        humidityPct: 48,
        windSpeedKmH: 10,
        tripGenieTip: 'Mahabaleshwar Arthur’s Seat viewpoint: prime morning panoramic cliff photography.',
        recommendation: 'outdoor_favorable',
      },
      {
        id: 'day-3',
        dayLabel: 'Day 3 (Thu)',
        dateStr: 'Nov 16',
        condition: 'Warm Sunshine',
        weatherType: 'sunny',
        icon: 'wb_sunny',
        tempHighC: 26,
        tempLowC: 15,
        rainChancePct: 0,
        humidityPct: 50,
        windSpeedKmH: 9,
        tripGenieTip: 'Scenic descent down Pratapgad ghat to Konkan; stop at local dhabas for fresh strawberry cream.',
        recommendation: 'good',
      },
      {
        id: 'day-4',
        dayLabel: 'Day 4 (Fri)',
        dateStr: 'Nov 17',
        condition: 'Tropical Coastal Breeze',
        weatherType: 'partly_cloudy',
        icon: 'wb_sunny',
        tempHighC: 29,
        tempLowC: 20,
        rainChancePct: 5,
        humidityPct: 65,
        windSpeedKmH: 14,
        tripGenieTip: 'Ganpatipule beach sunset walk and evening pradosh aarti at 400-year-old Swayambhu Ganpati.',
        recommendation: 'outdoor_favorable',
      },
      {
        id: 'day-5',
        dayLabel: 'Day 5 (Sat)',
        dateStr: 'Nov 18',
        condition: 'Pleasant & Sunny',
        weatherType: 'sunny',
        icon: 'wb_sunny',
        tempHighC: 28,
        tempLowC: 19,
        rainChancePct: 0,
        humidityPct: 60,
        windSpeedKmH: 11,
        tripGenieTip: 'Explore Jaigad fort lighthouse overlooking the tranquil Shastri river estuary.',
        recommendation: 'outdoor_favorable',
      },
    ],
  };
}

// TripGenie Interactive Q&A Chat Endpoint
app.post('/api/tripgenie/chat', async (req, res) => {
  try {
    const { message, conversation = [], tripContext = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGemini();

    if (ai) {
      const systemInstruction = `You are TripGenie, the ultimate AI travel concierge and trip auditor specializing in Maharashtra, India.
You analyze and assist across all travel dimensions:
- Maharashtra itinerary planning & pacing (Sahyadri forts, UNESCO caves, Konkan beaches, Vidarbha tiger reserves, Jyotirlinga pilgrimage shrines)
- Budget tracking, savings, and expense splitting strictly in Indian Rupees (₹ INR)
- MTDC beach & hill resort bookings and lodging recommendations across all 36 Maharashtra districts
- Group dynamics & debt settlement via UPI / Google Pay
- Climate-aware packing & temple/fort etiquette
- Real-time suggestions tailored to the active Maharashtra destination: ${tripContext.destination || 'Maharashtra, India'}

Current Trip Context:
- Destination: ${tripContext.destination || 'Sahyadri & Konkan, Maharashtra'}
- Total Spent: ₹${tripContext.totalSpent || 0} INR (Budget: ₹${tripContext.budgetLimit || 45000} INR)
- Weather: ${tripContext.weather || '24°C Pleasant & Sunny'}
- Group: ${tripContext.memberCount || 4} travelers

Guidelines:
- Give concise, highly practical, punchy answers (under 120 words).
- All prices and cost recommendations MUST be in Indian Rupees (₹), NEVER in dollars ($).
- Reference authentic Maharashtra places, local transport (MSRTC, local trains, expressway), MTDC resorts, and food (Misal Pav, Poha, Thali, Malvani seafood).
- Use bullet points for readability.
- Be proactive, warm, and encourage great travel memories.`;

      const prompt = `${systemInstruction}\n\nUser Question: ${message}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.6,
          },
        });

        const reply = response.text || 'TripGenie is ready to guide your Maharashtra expedition!';

        return res.json({
          reply,
          suggestedQuestions: [
            'How can we optimize our budget by ₹3,000 for this Maharashtra trip?',
            'What are the best sunrise fort spots near our MTDC resort?',
            'How to settle group splits easily using UPI / GPay?',
          ],
        });
      } catch (geminiError: any) {
        console.warn('TripGenie chat Gemini call unavailable (e.g. 503/high demand), using deterministic fallback:', geminiError?.message || geminiError);
      }
    }

    // Smart fallback responses in Rupees and Maharashtra context
    const lower = message.toLowerCase();
    let reply = `TripGenie here! For your Maharashtra journey to ${tripContext.destination || 'Sahyadri & Konkan'}, everything looks well-aligned. Pacing is steady across fort ascents, and your expenses are currently within safe limits. Make sure to keep offline maps downloaded!`;
    let suggestedQuestions = [
      'Is our Day 3 fort schedule too packed?',
      'How to save on MTDC resort dining and toll fares?',
      'What should we pack for temple and fort days?',
    ];

    if (lower.includes('budget') || lower.includes('save') || lower.includes('cost') || lower.includes('money') || lower.includes('rupee')) {
      reply = `💰 **TripGenie Budget Tip**: You have spent ₹${Number(tripContext.totalSpent || 18500).toLocaleString('en-IN')} of your ₹${Number(tripContext.budgetLimit || 45000).toLocaleString('en-IN')} budget. To optimize:
• Book MTDC Beach & Hill Resorts directly for authentic subsidized lodging with complimentary breakfast (₹2,200–₹4,500/night).
• Opt for MSRTC Shivshahi AC express or Vistadome train passes between Mumbai and Pune to cut cab tolls by 45%.
• Enjoy authentic family dhabas serving Kolhapuri Misal Pav (₹80) and unlimited Maharashtrian Thali (₹200–₹350).`;
      suggestedQuestions = ['Show me our top expense categories', 'Are we at risk of overspending?'];
    } else if (lower.includes('itinerary') || lower.includes('schedule') || lower.includes('day') || lower.includes('time')) {
      reply = `📅 **Maharashtra Itinerary Insights**:
• Start your ascent to Fort Raigad, Sinhagad, or Pratapgad before 07:30 AM to beat the midday Sahyadri heat and ropeway queues.
• Keep scenic sunset drives along the Konkan coastal road (Ganpatipule or Tarkarli) reserved for late afternoon (16:30–18:00).
• Allow 45 minutes buffer on Mumbai-Pune Expressway and Bhor ghat during weekend morning hours!`;
      suggestedQuestions = ['What if it rains in the ghats?', 'Suggest a top local dinner spot'];
    } else if (lower.includes('pack') || lower.includes('wear') || lower.includes('weather')) {
      reply = `🎒 **Maharashtra Packing & Weather Advisory**:
• Forecast: ${tripContext.weather || '24°C'}. Expect crisp mornings (15°C) and comfortable daytime temperatures.
• Must-haves: Sturdy high-traction trekking shoes with good grip for carved stone fort steps, lightweight cotton clothing, sunhat, and a 10,000mAh power bank for ghat photography.
• Temple attire: Modest attire with shoulders and knees covered for Trimbakeshwar, Shirdi, and Tuljapur shrines.`;
      suggestedQuestions = ['What temple etiquette should we know in Maharashtra?', 'Where to book MTDC resorts?'];
    }

    return res.json({
      reply,
      suggestedQuestions,
    });
  } catch (error: any) {
    console.error('TripGenie chat error:', error);
    res.status(500).json({ error: error.message || 'Error processing chat' });
  }
});

// ============================================================
// World Places & Nearby Attractions AI Endpoint
// Enables searching ANY place worldwide with full details & nearby spots
// ============================================================
app.post('/api/places/details', async (req, res) => {
  try {
    const { placeQuery = '', city = '', country = '' } = req.body;
    const query = (placeQuery || city || country || '').trim();

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const ai = getGemini();

    if (ai) {
      const prompt = `You are a world-class travel geographer and TripGenie expert.
Generate a comprehensive, accurate travel profile and nearby guide for the world destination or landmark: "${query}".

Return ONLY valid JSON with this exact schema and no markdown code blocks:
{
  "id": "kebab-case-id",
  "name": "Full Destination Name (e.g. Venice & Grand Canal)",
  "city": "City name",
  "country": "Country name",
  "countryCode": "2-letter ISO code",
  "continent": "Europe" | "Asia" | "North America" | "South America" | "Africa" | "Middle East" | "Oceania",
  "flagEmoji": "Country flag emoji",
  "category": "Must-See Wonder" | "Historic City" | "Beach & Coastal" | "Mountain & Nature" | "Food Capital" | "Metropolis",
  "rating": number (e.g. 4.8),
  "reviewsCount": "e.g. 54,000",
  "coordinates": {
    "lat": number (accurate latitude),
    "lng": number (accurate longitude)
  },
  "heroImage": "High quality Unsplash travel image URL for this destination",
  "galleryImages": ["image1 URL", "image2 URL"],
  "tagline": "Evocative 1-sentence tagline",
  "description": "2-3 rich paragraphs explaining why travelers visit, cultural history, and what to experience.",
  "highlights": ["3 to 4 standout highlights"],
  "vibe": "3-5 descriptive words",
  "bestTimeToVisit": "Best months and seasonal tips",
  "currency": "Currency name and symbol",
  "currencySymbol": "$ or € or ¥ etc",
  "language": "Local languages",
  "timezone": "Time zone string",
  "avgDailyCostUsd": number (daily budget in USD),
  "safetyRating": "Safety overview and tips",
  "weatherSummary": "Climate description and typical seasonal temperatures",
  "practicalTips": ["3 crucial insider tips for first-time visitors"],
  "tags": ["5 to 7 relevant tags"],
  "nearbyPlaces": [
    {
      "id": "unique-id-1",
      "name": "Nearby Attraction Name",
      "category": "Attraction" | "Food & Dining" | "Nature & Scenery" | "Culture & Temple" | "Shopping & Bazaar" | "Day Trip" | "Nightlife & View",
      "distanceKm": number (realistic distance from center, e.g. 0.8),
      "distanceText": "e.g. 0.8 km • 10 min walk",
      "travelTime": "e.g. 10 min walk",
      "coordinates": {
        "lat": number (accurate nearby latitude),
        "lng": number (accurate nearby longitude)
      },
      "image": "Travel photo URL",
      "description": "1-2 sentences on what this nearby place is and why to go",
      "highlights": ["2 key highlights"],
      "rating": number (4.5 - 4.9),
      "estDuration": "e.g. 1.5 - 2 hrs",
      "estCost": "e.g. Free or $15 entry",
      "openHours": "e.g. 09:00 - 18:00",
      "tags": ["2-3 tags"]
    }
  ]
}
Requirements:
- "nearbyPlaces" MUST include 4 to 6 diverse nearby attractions, famous dining spots, or day trips that a user visiting this place can go to!
- Coordinates must be geographically accurate for mapping pins.`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.name && parsed.coordinates) {
            // Ensure fallback images if needed
            if (!parsed.heroImage || !parsed.heroImage.startsWith('http')) {
              parsed.heroImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80';
            }
            if (!Array.isArray(parsed.nearbyPlaces) || parsed.nearbyPlaces.length === 0) {
              parsed.nearbyPlaces = generateNearbyFallbackPlaces(parsed.coordinates.lat, parsed.coordinates.lng, parsed.name, parsed.city);
            }
            return res.json(parsed);
          }
        } catch (jsonErr) {
          console.error('Failed to parse Gemini place JSON:', jsonErr);
        }
      } catch (geminiError: any) {
        console.warn('Gemini place details unavailable (503/demand), using synthesized fallback:', geminiError?.message || geminiError);
      }
    }

    // Synthesized resilient fallback when Gemini is unavailable
    const fallbackPlace = createSynthesizedWorldPlace(query);
    return res.json(fallbackPlace);
  } catch (error: any) {
    console.error('Error fetching world place details:', error);
    res.status(500).json({ error: error.message || 'Internal server error resolving place' });
  }
});

function generateNearbyFallbackPlaces(centerLat: number, centerLng: number, placeName: string, cityName: string) {
  return [
    {
      id: `near-${Date.now()}-1`,
      name: `${cityName || placeName} Historic Old Quarter & Plaza`,
      category: 'Attraction' as const,
      distanceKm: 0.7,
      distanceText: '0.7 km • 9 min walk',
      travelTime: '9 min walk',
      coordinates: { lat: centerLat + 0.005, lng: centerLng + 0.004 },
      image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80',
      description: 'Charming pedestrian center filled with historical monuments, street buskers, and outdoor cafes.',
      highlights: ['Historic architecture', 'Local atmosphere', 'Great photography'],
      rating: 4.8,
      estDuration: '1.5 - 2 hrs',
      estCost: 'Free stroll',
      openHours: 'Open 24/7',
      tags: ['Historic', 'Walkable', 'Plaza'],
    },
    {
      id: `near-${Date.now()}-2`,
      name: `${placeName} Traditional Market & Local Eateries`,
      category: 'Food & Dining' as const,
      distanceKm: 1.4,
      distanceText: '1.4 km • 18 min walk or 5 min transit',
      travelTime: '18 min walk',
      coordinates: { lat: centerLat - 0.008, lng: centerLng + 0.006 },
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      description: 'Lively food hall and artisan stalls serving authentic local specialties and freshly made desserts.',
      highlights: ['Authentic dishes', 'Fresh produce', 'Artisan souvenirs'],
      rating: 4.7,
      estDuration: '1.5 hrs',
      estCost: '$10 - $25',
      openHours: '09:00 - 20:00',
      tags: ['Foodie', 'Market', 'Local'],
    },
    {
      id: `near-${Date.now()}-3`,
      name: `${cityName || placeName} Panoramic Scenic Overlook`,
      category: 'Nature & Scenery' as const,
      distanceKm: 2.8,
      distanceText: '2.8 km • 12 min taxi / funicular',
      travelTime: '12 min',
      coordinates: { lat: centerLat + 0.012, lng: centerLng - 0.01 },
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      description: 'Elevated viewpoint offering sweeping 360-degree vistas over the rooftops, mountains, and waterways.',
      highlights: ['Sunset golden hour', 'City panorama', 'Funicular / cable car'],
      rating: 4.9,
      estDuration: '1 - 2 hrs',
      estCost: 'Free entry',
      openHours: 'Best at dusk',
      tags: ['Views', 'Sunset', 'Scenic'],
    },
    {
      id: `near-${Date.now()}-4`,
      name: `${cityName || placeName} Grand Cultural Museum & Heritage Hall`,
      category: 'Culture & Temple' as const,
      distanceKm: 1.9,
      distanceText: '1.9 km • 8 min transit',
      travelTime: '8 min transit',
      coordinates: { lat: centerLat - 0.006, lng: centerLng - 0.008 },
      image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=600&q=80',
      description: 'National repository celebrating the rich archaeology, royal heritage, and folklore of the region.',
      highlights: ['Masterpiece artifacts', 'Sculpture courtyard', 'Guided audio tour'],
      rating: 4.8,
      estDuration: '2 - 3 hrs',
      estCost: '$12 entry',
      openHours: '10:00 - 18:00',
      tags: ['Museum', 'Culture', 'History'],
    },
  ];
}

function createSynthesizedWorldPlace(query: string) {
  const clean = query.replace(/[^\w\s,]/g, '').trim();
  const title = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  // Approximate default coordinates near central Europe / Global hub
  const lat = 45.4386;
  const lng = 12.3267;

  return {
    id: clean.toLowerCase().replace(/\s+/g, '-'),
    name: title,
    city: title.split(',')[0].trim(),
    country: title.includes(',') ? title.split(',')[1].trim() : 'Global Destination',
    countryCode: 'INT',
    continent: 'Europe' as const,
    flagEmoji: '🌍',
    category: 'Must-See Wonder',
    rating: 4.8,
    reviewsCount: '38,500',
    coordinates: { lat, lng },
    heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ],
    tagline: `Unforgettable landscapes, ancient heritage, and vibrant local spirit in ${title}`,
    description: `${title} is a renowned global travel treasure known for picturesque vistas, historic architectural charm, and rich local gastronomy. Travelers from around the world come to discover its timeless streets, celebrated cultural landmarks, and serene natural settings.`,
    highlights: [
      `Historic central square and signature architectural monuments of ${title}`,
      'Scenic viewpoints with breathtaking panoramic landscape photos',
      'Tasting traditional regional delicacies and local market specialties',
      'Walking cobblestone pathways and immersive cultural neighborhoods',
    ],
    vibe: 'Charming, scenic, culturally authentic, and deeply memorable',
    bestTimeToVisit: 'Spring (April–June) and Autumn (September–November)',
    currency: 'Local Currency (USD / EUR equivalent)',
    currencySymbol: '$',
    language: 'Local language & English',
    timezone: 'UTC+1',
    avgDailyCostUsd: 95,
    safetyRating: 'High (Standard travel awareness recommended)',
    weatherSummary: 'Temperate climate; pleasantly warm springs & sunny autumns (18°C–24°C)',
    practicalTips: [
      'Book popular monument tickets online 1–2 weeks in advance to skip queue lines',
      'Wear comfortable walking shoes suitable for stone streets and scenic trails',
      'Keep offline map downloads ready on your device for seamless navigation',
    ],
    tags: [title, 'Travel', 'Explore', 'Culture', 'Scenic', 'Wonders'],
    nearbyPlaces: generateNearbyFallbackPlaces(lat, lng, title, title.split(',')[0].trim()),
  };
}

// Vite middleware for development vs static build for production
async function startServer() {
  try {
    // Initialize database (MySQL or persistent local storage fallback) & seed admin idempotently
    await db.initialize();
  } catch (dbErr) {
    console.error('[Server] Database initialization warning:', dbErr);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    // 1. Vite middlewares handle /@vite/client, /src/*, public files, and static assets
    app.use(vite.middlewares);

    // 2. Fallback HTML handler for all client-side routes (GET and HEAD)
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' });
        if (req.method === 'HEAD') {
          return res.end();
        }
        return res.end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        return next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.all('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      if (req.method === 'HEAD') {
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' });
        return res.end();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TripGenie server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
