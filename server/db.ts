import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  avatar?: string;
  bio?: string;
  phone?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TripRecord {
  id: string;
  user_id: string;
  name: string;
  location: string;
  country: string;
  dates?: string;
  days_total?: number;
  budget_limit_usd: number;
  spent_usd: number;
  status: 'Active' | 'Planned' | 'Completed' | 'Archived';
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItineraryRecord {
  id: string;
  trip_id: string;
  user_id: string;
  day: number;
  time_slot: string;
  title: string;
  location: string;
  category: string;
  cost_usd: number;
  created_at: string;
}

export interface ExpenseRecord {
  id: string;
  trip_id: string;
  user_id: string;
  title: string;
  amount_usd: number;
  amount_local?: number;
  currency: string;
  category: string;
  payer_name?: string;
  date?: string;
  created_at: string;
}

export interface DestinationRecord {
  id: string;
  name: string;
  city: string;
  country: string;
  continent: string;
  category: string;
  rating: number;
  trips_count: number;
  hero_image?: string;
  created_at: string;
}

export interface AiUsageRecord {
  id: string;
  endpoint: string;
  feature: string;
  status: 'success' | 'error';
  latency_ms: number;
  tokens_estimated: number;
  error_message?: string;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  admin_email: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface HotelReservationRecord {
  id: string;
  booking_ref: string;
  user_id: string;
  trip_id?: string;
  hotel_id: string;
  hotel_name: string;
  hotel_image: string;
  district: string;
  city: string;
  room_type_id: string;
  room_type_name: string;
  check_in_date: string;
  check_out_date: string;
  nights_count: number;
  guests_count: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests?: string;
  room_rate_per_night_inr: number;
  total_amount_inr: number;
  total_amount_usd: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  payment_status: 'Paid' | 'Pay at Hotel';
  created_at: string;
}

interface RateLimitEntry {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

// In-memory rate limiting map for login attempts
const rateLimitMap = new Map<string, RateLimitEntry>();

// Persistent File DB Storage fallback path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'travelmate_db.json');

interface LocalDatabaseState {
  users: UserRecord[];
  trips: TripRecord[];
  itineraries: ItineraryRecord[];
  expenses: ExpenseRecord[];
  destinations: DestinationRecord[];
  reservations: HotelReservationRecord[];
  ai_usage_logs: AiUsageRecord[];
  audit_logs: AuditLogRecord[];
  meta: {
    version: string;
    initialized_at: string;
  };
}

class DatabaseManager {
  private mysqlPool: mysql.Pool | null = null;
  private isUsingMySQL = false;
  private connectionError: string | null = null;
  private localState: LocalDatabaseState = {
    users: [],
    trips: [],
    itineraries: [],
    expenses: [],
    destinations: [],
    reservations: [],
    ai_usage_logs: [],
    audit_logs: [],
    meta: {
      version: '2.5.0',
      initialized_at: new Date().toISOString(),
    },
  };

  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('[DatabaseManager] Failed to create data dir:', err);
      }
    }
  }

  private loadLocalDb(): LocalDatabaseState {
    this.ensureDataDir();
    if (fs.existsSync(DB_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        this.localState = {
          users: (parsed.users || []).map((u: any) => ({
            ...u,
            status: u.status || 'ACTIVE',
            role: u.role || 'USER',
          })),
          trips: (parsed.trips || []).map((t: any) => ({
            ...t,
            status: t.status || 'Active',
            is_archived: Boolean(t.is_archived),
          })),
          itineraries: parsed.itineraries || [],
          expenses: (parsed.expenses || []).map((e: any) => ({
            ...e,
            currency: e.currency || 'USD',
          })),
          destinations: parsed.destinations || [],
          reservations: parsed.reservations || [],
          ai_usage_logs: parsed.ai_usage_logs || [],
          audit_logs: parsed.audit_logs || [],
          meta: parsed.meta || {
            version: '2.5.0',
            initialized_at: new Date().toISOString(),
          },
        };
        return this.localState;
      } catch (err) {
        console.error('[DatabaseManager] Corrupt local DB file, backing up and recreating', err);
      }
    }
    this.saveLocalDb();
    return this.localState;
  }

  private saveLocalDb() {
    try {
      this.ensureDataDir();
      const tmpPath = `${DB_FILE_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.localState, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_FILE_PATH);
    } catch (err) {
      console.error('[DatabaseManager] Failed to save persistent local DB:', err);
    }
  }

  public async initialize(): Promise<void> {
    this.loadLocalDb();

    // Check if MySQL configuration is provided in env
    const hasMySqlConfig = Boolean(process.env.MYSQL_HOST || process.env.DATABASE_URL);

    if (hasMySqlConfig) {
      try {
        console.log(`[DatabaseManager] Attempting MySQL connection to ${process.env.MYSQL_HOST || 'DATABASE_URL'}...`);
        this.mysqlPool = mysql.createPool({
          host: process.env.MYSQL_HOST || 'localhost',
          port: Number(process.env.MYSQL_PORT) || 3306,
          user: process.env.MYSQL_USER || 'root',
          password: process.env.MYSQL_PASSWORD || '',
          database: process.env.MYSQL_DATABASE || 'travelmate_db',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 4000,
        });

        // Test connection
        const conn = await this.mysqlPool.getConnection();
        await conn.ping();
        conn.release();

        this.isUsingMySQL = true;
        this.connectionError = null;
        console.log('[DatabaseManager] Successfully connected to MySQL server.');

        await this.runMySqlMigrations();
      } catch (err: any) {
        this.isUsingMySQL = false;
        this.mysqlPool = null;
        this.connectionError = `MySQL connection failed: ${err.message || err}`;
        console.warn(
          `[DatabaseManager] MySQL not reachable (${err.message || 'connection failed'}). Gracefully falling back to persistent relational JSON storage at ${DB_FILE_PATH}.`
        );
      }
    } else {
      this.isUsingMySQL = false;
      this.connectionError = 'No MYSQL_HOST environment variable configured. Operating in high-reliability persistent database mode.';
      console.log(`[DatabaseManager] Operating in persistent relational database mode (storage: ${DB_FILE_PATH}).`);
    }

    // Always seed the initial administrators idempotently
    await this.seedInitialAdmin();
    // Seed initial travel data if empty so admin dashboard has real statistics
    await this.seedInitialTripsIfEmpty();
    // Seed destinations if empty
    await this.seedInitialDestinationsIfEmpty();
  }

  private async runMySqlMigrations(): Promise<void> {
    if (!this.mysqlPool) return;

    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'USER',
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        avatar TEXT,
        bio TEXT,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL,
        dates VARCHAR(100),
        days_total INT DEFAULT 7,
        budget_limit_usd DECIMAL(10,2) DEFAULT 1200.00,
        spent_usd DECIMAL(10,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Active',
        is_archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(64) PRIMARY KEY,
        trip_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount_usd DECIMAL(10,2) NOT NULL,
        amount_local DECIMAL(10,2) NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        category VARCHAR(100) NOT NULL,
        payer_name VARCHAR(255),
        date VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS destinations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        country VARCHAR(255) NOT NULL,
        continent VARCHAR(100) DEFAULT 'Asia',
        category VARCHAR(100) DEFAULT 'Must-See Wonder',
        rating DECIMAL(3,1) DEFAULT 4.8,
        trips_count INT DEFAULT 0,
        hero_image TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS ai_usage_logs (
        id VARCHAR(64) PRIMARY KEY,
        endpoint VARCHAR(100) NOT NULL,
        feature VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        latency_ms INT NOT NULL,
        tokens_estimated INT DEFAULT 0,
        error_message TEXT NULL,
        ip_address VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NULL,
        resource_id VARCHAR(100) NULL,
        details TEXT,
        ip_address VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS hotel_reservations (
        id VARCHAR(64) PRIMARY KEY,
        booking_ref VARCHAR(64) NOT NULL UNIQUE,
        user_id VARCHAR(64) NOT NULL,
        trip_id VARCHAR(64) NULL,
        hotel_id VARCHAR(64) NOT NULL,
        hotel_name VARCHAR(255) NOT NULL,
        hotel_image TEXT,
        district VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        room_type_id VARCHAR(64) NOT NULL,
        room_type_name VARCHAR(100) NOT NULL,
        check_in_date VARCHAR(50) NOT NULL,
        check_out_date VARCHAR(50) NOT NULL,
        nights_count INT NOT NULL DEFAULT 1,
        guests_count INT NOT NULL DEFAULT 1,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) NOT NULL,
        guest_phone VARCHAR(50) NOT NULL,
        special_requests TEXT NULL,
        room_rate_per_night_inr DECIMAL(10,2) NOT NULL,
        total_amount_inr DECIMAL(10,2) NOT NULL,
        total_amount_usd DECIMAL(10,2) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'Confirmed',
        payment_status VARCHAR(32) NOT NULL DEFAULT 'Pay at Hotel',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
    ];

    for (const sql of queries) {
      await this.mysqlPool.query(sql);
    }
    console.log('[DatabaseManager] MySQL schema verification & migrations completed.');
  }

  public async seedInitialAdmin(): Promise<void> {
    const defaultAdmins = [
      {
        email: (process.env.ADMIN_EMAIL || 'abhijeetraoavr@gmail.com').trim().toLowerCase(),
        password: process.env.ADMIN_PASSWORD || 'Abhi@032006',
        name: process.env.ADMIN_NAME || 'Abhijeet Rao',
        role: 'ADMIN' as const,
        bio: 'TravelMate Lead Super Administrator & Founder',
      },
      {
        email: 'lokeshramkor650@gmail.com',
        password: 'Lokesh@212006',
        name: 'Lokesh Ramkor',
        role: 'ADMIN' as const,
        bio: 'TravelMate Administrator & Operations Lead',
      },
    ];

    for (const admin of defaultAdmins) {
      const existing = await this.findUserByEmail(admin.email);
      if (existing) {
        if (existing.role !== 'ADMIN') {
          await this.updateUserRole(existing.id, 'ADMIN');
        }
        continue;
      }

      const password_hash = bcrypt.hashSync(admin.password, 10);
      const now = new Date().toISOString();
      const newAdmin: UserRecord = {
        id: `usr-admin-${admin.email.split('@')[0]}`,
        name: admin.name,
        email: admin.email,
        password_hash,
        role: 'ADMIN',
        status: 'ACTIVE',
        avatar: '',
        bio: admin.bio,
        created_at: now,
        updated_at: now,
      };

      if (this.isUsingMySQL && this.mysqlPool) {
        await this.mysqlPool.query(
          `INSERT INTO users (id, name, email, password_hash, role, status, avatar, bio, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [newAdmin.id, newAdmin.name, newAdmin.email, newAdmin.password_hash, newAdmin.role, newAdmin.status, newAdmin.avatar, newAdmin.bio, newAdmin.created_at, newAdmin.updated_at]
        );
      } else {
        this.localState.users.push(newAdmin);
        this.saveLocalDb();
      }

      await this.logAudit(admin.email, 'SEED_ADMIN_CREATED', 'users', newAdmin.id, `Created initial administrator account '${admin.email}'`);
    }
  }

  private async seedInitialTripsIfEmpty() {
    const trips = await this.listTrips();
    if (trips.length === 0) {
      const now = new Date().toISOString();
      const demoTrips: TripRecord[] = [
        {
          id: 'trip-sahyadri-heritage',
          user_id: 'usr-admin-abhijeetraoavr',
          name: 'Sahyadri Heritage & Konkan Expedition',
          location: 'Mumbai • Pune • Raigad • Mahabaleshwar, Maharashtra',
          country: 'India',
          dates: 'Nov 14 - Nov 21',
          days_total: 8,
          budget_limit_usd: 1500,
          spent_usd: 778.5,
          status: 'Active',
          is_archived: false,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'trip-marathwada-heritage',
          user_id: 'usr-admin-abhijeetraoavr',
          name: 'Marathwada Heritage & Ajanta-Ellora Caves',
          location: 'Chhatrapati Sambhaji Nagar & Nanded, Maharashtra',
          country: 'India',
          dates: 'Dec 10 - Dec 18',
          days_total: 9,
          budget_limit_usd: 1400,
          spent_usd: 640,
          status: 'Planned',
          is_archived: false,
          created_at: now,
          updated_at: now,
        },
        {
          id: 'trip-vidarbha-safari',
          user_id: 'usr-admin-lokeshramkor650',
          name: 'Vidarbha Tiger Safari & Lonar Meteorite Crater',
          location: 'Nagpur • Chandrapur (Tadoba) • Buldhana, Maharashtra',
          country: 'India',
          dates: 'Oct 01 - Oct 08',
          days_total: 7,
          budget_limit_usd: 950,
          spent_usd: 620,
          status: 'Completed',
          is_archived: false,
          created_at: now,
          updated_at: now,
        },
      ];

      const demoExpenses: ExpenseRecord[] = [
        {
          id: 'exp-1',
          trip_id: 'trip-sahyadri-heritage',
          user_id: 'usr-admin-abhijeetraoavr',
          title: 'Vistadome Express Mumbai to Pune Train Pass',
          amount_usd: 45.0,
          currency: 'INR',
          category: 'Transport & Rail',
          payer_name: 'Abhijeet Rao',
          date: 'Nov 14',
          created_at: now,
        },
        {
          id: 'exp-2',
          trip_id: 'trip-sahyadri-heritage',
          user_id: 'usr-admin-abhijeetraoavr',
          title: 'Maharashtrian Thali & Malvani Seafood Dinner',
          amount_usd: 35.5,
          currency: 'INR',
          category: 'Dining & Food',
          payer_name: 'Abhijeet Rao',
          date: 'Nov 15',
          created_at: now,
        },
        {
          id: 'exp-3',
          trip_id: 'trip-sahyadri-heritage',
          user_id: 'usr-admin-abhijeetraoavr',
          title: 'Raigad Ropeway & Heritage Historian Guide',
          amount_usd: 28.0,
          currency: 'INR',
          category: 'Culture & Entry',
          payer_name: 'Abhijeet Rao',
          date: 'Nov 16',
          created_at: now,
        },
        {
          id: 'exp-4',
          trip_id: 'trip-vidarbha-safari',
          user_id: 'usr-admin-lokeshramkor650',
          title: 'Tadoba Moharli Zone Open Gypsy Forest Safari',
          amount_usd: 85.0,
          currency: 'INR',
          category: 'Nature & Wildlife',
          payer_name: 'Lokesh Ramkor',
          date: 'Oct 02',
          created_at: now,
        },
      ];

      for (const t of demoTrips) {
        await this.createTrip(t);
      }
      for (const e of demoExpenses) {
        await this.createExpense(e);
      }
    }
  }

  private async seedInitialDestinationsIfEmpty() {
    if (this.localState.destinations.length === 0) {
      const now = new Date().toISOString();
      const dests: DestinationRecord[] = [
        {
          id: 'dest-gateway-mumbai',
          name: 'Gateway of India & Marine Drive',
          city: 'Mumbai',
          country: 'India, Maharashtra',
          continent: 'Asia',
          category: 'Heritage & Waterfront',
          rating: 4.9,
          trips_count: 24,
          hero_image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
          created_at: now,
        },
        {
          id: 'dest-ajanta-ellora',
          name: 'Ajanta & Ellora UNESCO Rock-Cut Caves',
          city: 'Chhatrapati Sambhaji Nagar',
          country: 'India, Maharashtra',
          continent: 'Asia',
          category: 'Ancient Heritage',
          rating: 5.0,
          trips_count: 28,
          hero_image: 'https://images.unsplash.com/photo-1600100397608-f010f444f434?auto=format&fit=crop&w=800&q=80',
          created_at: now,
        },
        {
          id: 'dest-raigad-fort',
          name: 'Chhatrapati Shivaji Maharaj Raigad Fort',
          city: 'Mahad, Raigad',
          country: 'India, Maharashtra',
          continent: 'Asia',
          category: 'Royal Hill Fortress',
          rating: 4.9,
          trips_count: 19,
          hero_image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=800&q=80',
          created_at: now,
        },
        {
          id: 'dest-tadoba-safari',
          name: 'Tadoba-Andhari Tiger Reserve',
          city: 'Chandrapur',
          country: 'India, Maharashtra',
          continent: 'Asia',
          category: 'Wildlife & Safari',
          rating: 4.8,
          trips_count: 16,
          hero_image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=800&q=80',
          created_at: now,
        },
        {
          id: 'dest-mahabaleshwar',
          name: 'Mahabaleshwar & Pratapgad Hills',
          city: 'Satara',
          country: 'India, Maharashtra',
          continent: 'Asia',
          category: 'Hill Retreat & Forts',
          rating: 4.8,
          trips_count: 22,
          hero_image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
          created_at: now,
        },
      ];

      for (const d of dests) {
        if (this.isUsingMySQL && this.mysqlPool) {
          await this.mysqlPool.query(
            `INSERT INTO destinations (id, name, city, country, continent, category, rating, trips_count, hero_image, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [d.id, d.name, d.city, d.country, d.continent, d.category, d.rating, d.trips_count, d.hero_image, d.created_at]
          );
        } else {
          this.localState.destinations.push(d);
        }
      }
      this.saveLocalDb();
    }
  }

  // --- User Operations ---

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
        if (rows && rows.length > 0) {
          return rows[0] as UserRecord;
        }
        return null;
      } catch (err) {
        console.error('[DatabaseManager] Error querying MySQL user by email:', err);
      }
    }

    const found = this.localState.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return found ? { ...found } : null;
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length > 0) {
          return rows[0] as UserRecord;
        }
        return null;
      } catch (err) {
        console.error('[DatabaseManager] Error querying MySQL user by id:', err);
      }
    }

    const found = this.localState.users.find((u) => u.id === id);
    return found ? { ...found } : null;
  }

  public async createUser(userData: {
    name: string;
    email: string;
    passwordHash: string;
    role?: 'ADMIN' | 'USER' | 'SUPER_ADMIN';
    status?: 'ACTIVE' | 'SUSPENDED';
    avatar?: string;
    bio?: string;
  }): Promise<UserRecord> {
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = await this.findUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('A user account with this email address already exists.');
    }

    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: `usr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: userData.name.trim(),
      email: cleanEmail,
      password_hash: userData.passwordHash,
      role: userData.role || 'USER',
      status: userData.status || 'ACTIVE',
      avatar: userData.avatar || '',
      bio: userData.bio || '',
      created_at: now,
      updated_at: now,
    };

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        `INSERT INTO users (id, name, email, password_hash, role, status, avatar, bio, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newUser.id, newUser.name, newUser.email, newUser.password_hash, newUser.role, newUser.status, newUser.avatar, newUser.bio, newUser.created_at, newUser.updated_at]
      );
    } else {
      this.localState.users.push(newUser);
      this.saveLocalDb();
    }

    return newUser;
  }

  public async recordUserLogin(userId: string): Promise<void> {
    const now = new Date().toISOString();
    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query('UPDATE users SET last_login_at = ? WHERE id = ?', [now, userId]);
    } else {
      const idx = this.localState.users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        this.localState.users[idx].last_login_at = now;
        this.saveLocalDb();
      }
    }
  }

  public async updateUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<UserRecord> {
    const user = await this.findUserById(id);
    if (!user) throw new Error('User not found.');

    const now = new Date().toISOString();
    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);
    } else {
      const idx = this.localState.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        this.localState.users[idx].status = status;
        this.localState.users[idx].updated_at = now;
        this.saveLocalDb();
      }
    }

    return { ...user, status, updated_at: now };
  }

  public async updateUserProfile(
    id: string,
    updates: { name?: string; bio?: string; avatar?: string; phone?: string }
  ): Promise<UserRecord> {
    const user = await this.findUserById(id);
    if (!user) throw new Error('User not found.');

    const now = new Date().toISOString();
    const newName = updates.name !== undefined ? updates.name.trim() : user.name;
    const newBio = updates.bio !== undefined ? updates.bio.trim() : (user.bio || '');
    const newAvatar = updates.avatar !== undefined ? updates.avatar : (user.avatar || '');
    const newPhone = updates.phone !== undefined ? updates.phone.trim() : (user.phone || '');

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        'UPDATE users SET name = ?, bio = ?, avatar = ?, phone = ?, updated_at = ? WHERE id = ?',
        [newName, newBio, newAvatar, newPhone, now, id]
      );
    } else {
      const idx = this.localState.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        this.localState.users[idx] = {
          ...this.localState.users[idx],
          name: newName,
          bio: newBio,
          avatar: newAvatar,
          phone: newPhone,
          updated_at: now,
        };
        this.saveLocalDb();
      }
    }

    return {
      ...user,
      name: newName,
      bio: newBio,
      avatar: newAvatar,
      phone: newPhone,
      updated_at: now,
    };
  }

  public async resetUserPassword(id: string, newPasswordPlain: string): Promise<void> {
    const user = await this.findUserById(id);
    if (!user) throw new Error('User not found.');

    const newHash = bcrypt.hashSync(newPasswordPlain, 10);
    const now = new Date().toISOString();

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, id]);
    } else {
      const idx = this.localState.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        this.localState.users[idx].password_hash = newHash;
        this.localState.users[idx].updated_at = now;
        this.saveLocalDb();
      }
    }
  }

  public async updateAdminProfile(email: string, updates: { name?: string; bio?: string }): Promise<UserRecord> {
    const user = await this.findUserByEmail(email);
    if (!user) throw new Error('Admin account not found.');

    const now = new Date().toISOString();
    const updatedName = updates.name !== undefined ? updates.name.trim() : user.name;
    const updatedBio = updates.bio !== undefined ? updates.bio.trim() : user.bio;

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query('UPDATE users SET name = ?, bio = ?, updated_at = ? WHERE id = ?', [updatedName, updatedBio, now, user.id]);
    } else {
      const idx = this.localState.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        this.localState.users[idx].name = updatedName;
        this.localState.users[idx].bio = updatedBio;
        this.localState.users[idx].updated_at = now;
        this.saveLocalDb();
      }
    }

    return { ...user, name: updatedName, bio: updatedBio, updated_at: now };
  }

  public async changeAdminPassword(email: string, currentPass: string, newPass: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) throw new Error('Admin user not found.');

    const valid = await bcrypt.compare(currentPass, user.password_hash);
    if (!valid) {
      throw new Error('Current password does not match.');
    }

    const newHash = bcrypt.hashSync(newPass, 10);
    const now = new Date().toISOString();

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, user.id]);
    } else {
      const idx = this.localState.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        this.localState.users[idx].password_hash = newHash;
        this.localState.users[idx].updated_at = now;
        this.saveLocalDb();
      }
    }
  }

  public async updateUserRole(id: string, role: 'ADMIN' | 'USER' | 'SUPER_ADMIN'): Promise<void> {
    const now = new Date().toISOString();
    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query('UPDATE users SET role = ?, updated_at = ? WHERE id = ?', [role, now, id]);
    } else {
      const idx = this.localState.users.findIndex((u) => u.id === id);
      if (idx !== -1) {
        this.localState.users[idx].role = role;
        this.localState.users[idx].updated_at = now;
        this.saveLocalDb();
      }
    }
  }

  public async listUsers(filters?: { search?: string; role?: string; status?: string }): Promise<UserRecord[]> {
    let users: UserRecord[] = [];
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM users ORDER BY created_at DESC');
        users = rows as UserRecord[];
      } catch (err) {
        console.error('[DatabaseManager] Error listing MySQL users:', err);
      }
    } else {
      users = [...this.localState.users];
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
    }
    if (filters?.role && filters.role !== 'ALL') {
      users = users.filter((u) => u.role === filters.role);
    }
    if (filters?.status && filters.status !== 'ALL') {
      users = users.filter((u) => u.status === filters.status);
    }

    return users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async deleteUser(id: string): Promise<boolean> {
    if (this.isUsingMySQL && this.mysqlPool) {
      const [res]: any = await this.mysqlPool.query('DELETE FROM users WHERE id = ?', [id]);
      return res.affectedRows > 0;
    }

    const beforeLen = this.localState.users.length;
    this.localState.users = this.localState.users.filter((u) => u.id !== id);
    if (this.localState.users.length !== beforeLen) {
      this.saveLocalDb();
      return true;
    }
    return false;
  }

  // --- Trip & Itinerary Operations ---

  public async listTrips(filters?: { search?: string; status?: string }): Promise<TripRecord[]> {
    let trips: TripRecord[] = [];
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM trips ORDER BY created_at DESC');
        trips = rows as TripRecord[];
      } catch (err) {
        console.error('[DatabaseManager] Error listing MySQL trips:', err);
      }
    } else {
      trips = [...this.localState.trips];
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      trips = trips.filter((t) => t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q) || t.country.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }
    if (filters?.status && filters.status !== 'ALL') {
      const targetStatus = filters.status.toLowerCase();
      trips = trips.filter((t) => t.status.toLowerCase() === targetStatus);
    }

    return trips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async createTrip(trip: TripRecord): Promise<void> {
    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        `INSERT INTO trips (id, user_id, name, location, country, dates, days_total, budget_limit_usd, spent_usd, status, is_archived, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), location = VALUES(location), spent_usd = VALUES(spent_usd)`,
        [
          trip.id,
          trip.user_id,
          trip.name,
          trip.location,
          trip.country,
          trip.dates || '',
          trip.days_total || 7,
          trip.budget_limit_usd || 1200,
          trip.spent_usd || 0,
          trip.status || 'Active',
          trip.is_archived ? 1 : 0,
          trip.created_at,
          trip.updated_at,
        ]
      );
    } else {
      const existingIdx = this.localState.trips.findIndex((t) => t.id === trip.id);
      if (existingIdx !== -1) {
        this.localState.trips[existingIdx] = trip;
      } else {
        this.localState.trips.push(trip);
      }
      this.saveLocalDb();
    }
  }

  public async archiveTrip(id: string, isArchived: boolean): Promise<void> {
    const now = new Date().toISOString();
    const newStatus = isArchived ? 'Archived' : 'Active';

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query('UPDATE trips SET is_archived = ?, status = ?, updated_at = ? WHERE id = ?', [isArchived ? 1 : 0, newStatus, now, id]);
    } else {
      const idx = this.localState.trips.findIndex((t) => t.id === id);
      if (idx !== -1) {
        this.localState.trips[idx].is_archived = isArchived;
        this.localState.trips[idx].status = newStatus;
        this.localState.trips[idx].updated_at = now;
        this.saveLocalDb();
      }
    }
  }

  public async deleteTrip(id: string): Promise<boolean> {
    if (this.isUsingMySQL && this.mysqlPool) {
      const [res]: any = await this.mysqlPool.query('DELETE FROM trips WHERE id = ?', [id]);
      return res.affectedRows > 0;
    }

    const beforeLen = this.localState.trips.length;
    this.localState.trips = this.localState.trips.filter((t) => t.id !== id);
    if (this.localState.trips.length !== beforeLen) {
      this.saveLocalDb();
      return true;
    }
    return false;
  }

  // --- Expense Operations & Analytics ---

  public async listExpenses(filters?: { search?: string; category?: string; currency?: string }): Promise<ExpenseRecord[]> {
    let expenses: ExpenseRecord[] = [];
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM expenses ORDER BY created_at DESC');
        expenses = rows as ExpenseRecord[];
      } catch (err) {
        console.error('[DatabaseManager] Error listing MySQL expenses:', err);
      }
    } else {
      expenses = [...this.localState.expenses];
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      expenses = expenses.filter((e) => e.title.toLowerCase().includes(q) || (e.payer_name && e.payer_name.toLowerCase().includes(q)));
    }
    if (filters?.category && filters.category !== 'ALL') {
      expenses = expenses.filter((e) => e.category === filters.category);
    }
    if (filters?.currency && filters.currency !== 'ALL') {
      expenses = expenses.filter((e) => e.currency === filters.currency);
    }

    return expenses;
  }

  public async createExpense(expense: ExpenseRecord): Promise<void> {
    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        `INSERT INTO expenses (id, trip_id, user_id, title, amount_usd, amount_local, currency, category, payer_name, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), amount_usd = VALUES(amount_usd)`,
        [
          expense.id,
          expense.trip_id,
          expense.user_id,
          expense.title,
          expense.amount_usd,
          expense.amount_local || expense.amount_usd,
          expense.currency || 'USD',
          expense.category,
          expense.payer_name || 'Traveler',
          expense.date || '',
          expense.created_at,
        ]
      );
    } else {
      const idx = this.localState.expenses.findIndex((e) => e.id === expense.id);
      if (idx !== -1) {
        this.localState.expenses[idx] = expense;
      } else {
        this.localState.expenses.push(expense);
      }
      this.saveLocalDb();
    }
  }

  public async getExpensesAnalytics() {
    const expenses = await this.listExpenses();

    // Group by currency
    const byCurrency: Record<string, { count: number; total: number }> = {};
    const byCategory: Record<string, { count: number; totalUsd: number }> = {};

    expenses.forEach((e) => {
      const curr = e.currency || 'USD';
      if (!byCurrency[curr]) byCurrency[curr] = { count: 0, total: 0 };
      byCurrency[curr].count += 1;
      byCurrency[curr].total += Number(e.amount_usd) || 0;

      const cat = e.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = { count: 0, totalUsd: 0 };
      byCategory[cat].count += 1;
      byCategory[cat].totalUsd += Number(e.amount_usd) || 0;
    });

    const totalUsdEquivalent = expenses.reduce((sum, e) => sum + (Number(e.amount_usd) || 0), 0);

    return {
      totalCount: expenses.length,
      totalUsdEquivalent,
      byCurrency,
      byCategory,
      disclaimer: 'Note: These records reflect traveler expense budgets and splits recorded inside trips; this does not constitute company revenue.',
    };
  }

  // --- Destinations Operations ---

  public async listDestinations(): Promise<DestinationRecord[]> {
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM destinations ORDER BY trips_count DESC');
        return rows as DestinationRecord[];
      } catch (err) {
        console.error('[DatabaseManager] Error listing MySQL destinations:', err);
      }
    }
    return [...this.localState.destinations].sort((a, b) => b.trips_count - a.trips_count);
  }

  // --- AI Telemetry & Usage Logs ---

  public async logAiUsage(log: {
    endpoint: string;
    feature: string;
    status: 'success' | 'error';
    latency_ms: number;
    tokens_estimated?: number;
    error_message?: string;
    ip?: string;
  }): Promise<void> {
    const entry: AiUsageRecord = {
      id: `ai-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      endpoint: log.endpoint,
      feature: log.feature,
      status: log.status,
      latency_ms: Math.round(log.latency_ms),
      tokens_estimated: log.tokens_estimated || 0,
      error_message: log.error_message || '',
      ip_address: log.ip || '127.0.0.1',
      created_at: new Date().toISOString(),
    };

    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        await this.mysqlPool.query(
          `INSERT INTO ai_usage_logs (id, endpoint, feature, status, latency_ms, tokens_estimated, error_message, ip_address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [entry.id, entry.endpoint, entry.feature, entry.status, entry.latency_ms, entry.tokens_estimated, entry.error_message, entry.ip_address, entry.created_at]
        );
      } catch (err) {
        console.error('[DatabaseManager] Failed to insert AI log to MySQL:', err);
      }
    } else {
      this.localState.ai_usage_logs.unshift(entry);
      if (this.localState.ai_usage_logs.length > 500) {
        this.localState.ai_usage_logs = this.localState.ai_usage_logs.slice(0, 500);
      }
      this.saveLocalDb();
    }
  }

  public async getAiMetrics() {
    let logs: AiUsageRecord[] = [];
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM ai_usage_logs ORDER BY created_at DESC LIMIT 200');
        logs = rows as AiUsageRecord[];
      } catch (err) {
        console.error('[DatabaseManager] Error querying AI logs:', err);
      }
    } else {
      logs = this.localState.ai_usage_logs;
    }

    const totalRequests = logs.length;
    const successCount = logs.filter((l) => l.status === 'success').length;
    const errorCount = logs.filter((l) => l.status === 'error').length;
    const avgLatencyMs = totalRequests > 0 ? Math.round(logs.reduce((acc, l) => acc + l.latency_ms, 0) / totalRequests) : 0;
    const successRate = totalRequests > 0 ? Math.round((successCount / totalRequests) * 100) : 100;

    const featureBreakdown: Record<string, number> = {};
    logs.forEach((l) => {
      featureBreakdown[l.feature] = (featureBreakdown[l.feature] || 0) + 1;
    });

    return {
      totalRequests,
      successCount,
      errorCount,
      successRate,
      avgLatencyMs,
      featureBreakdown,
      recentLogs: logs.slice(0, 20),
    };
  }

  // --- Audit Logs ---

  public async logAudit(
    adminEmail: string,
    action: string,
    resourceType = '',
    resourceId = '',
    details = '',
    ip = '127.0.0.1'
  ): Promise<void> {
    const entry: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      admin_email: adminEmail,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: ip,
      created_at: new Date().toISOString(),
    };

    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        await this.mysqlPool.query(
          `INSERT INTO admin_audit_logs (id, admin_email, action, resource_type, resource_id, details, ip_address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [entry.id, entry.admin_email, entry.action, entry.resource_type || '', entry.resource_id || '', entry.details || '', entry.ip_address || '', entry.created_at]
        );
      } catch (err) {
        console.error('[DatabaseManager] Failed to insert audit log to MySQL:', err);
      }
    } else {
      this.localState.audit_logs.unshift(entry);
      if (this.localState.audit_logs.length > 300) {
        this.localState.audit_logs = this.localState.audit_logs.slice(0, 300);
      }
      this.saveLocalDb();
    }
  }

  public async getAuditLogs(limit = 100, filterAction?: string): Promise<AuditLogRecord[]> {
    let logs: AuditLogRecord[] = [];
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?', [limit]);
        logs = rows as AuditLogRecord[];
      } catch (err) {
        console.error('[DatabaseManager] Error listing MySQL audit logs:', err);
      }
    } else {
      logs = this.localState.audit_logs;
    }

    if (filterAction && filterAction !== 'ALL') {
      logs = logs.filter((l) => l.action === filterAction);
    }
    return logs.slice(0, limit);
  }

  // --- Hotel Lodging & Reservations Operations ---

  public async createReservation(r: HotelReservationRecord): Promise<HotelReservationRecord> {
    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        `INSERT INTO hotel_reservations (
          id, booking_ref, user_id, trip_id, hotel_id, hotel_name, hotel_image, district, city,
          room_type_id, room_type_name, check_in_date, check_out_date, nights_count, guests_count,
          guest_name, guest_email, guest_phone, special_requests, room_rate_per_night_inr,
          total_amount_inr, total_amount_usd, status, payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.id, r.booking_ref, r.user_id, r.trip_id || null, r.hotel_id, r.hotel_name, r.hotel_image || '',
          r.district, r.city, r.room_type_id, r.room_type_name, r.check_in_date, r.check_out_date,
          r.nights_count, r.guests_count, r.guest_name, r.guest_email, r.guest_phone,
          r.special_requests || '', r.room_rate_per_night_inr, r.total_amount_inr, r.total_amount_usd,
          r.status, r.payment_status, r.created_at
        ]
      );
    } else {
      if (!this.localState.reservations) {
        this.localState.reservations = [];
      }
      this.localState.reservations.unshift(r);
      this.saveLocalDb();
    }
    return r;
  }

  public async listReservations(filters?: { user_id?: string; district?: string; status?: string; search?: string }): Promise<HotelReservationRecord[]> {
    let list: HotelReservationRecord[] = [];
    if (this.isUsingMySQL && this.mysqlPool) {
      try {
        const [rows]: any = await this.mysqlPool.query('SELECT * FROM hotel_reservations ORDER BY created_at DESC');
        list = rows as HotelReservationRecord[];
      } catch (err) {
        console.error('[DatabaseManager] Error listing MySQL reservations:', err);
      }
    } else {
      list = [...(this.localState.reservations || [])];
    }

    if (filters?.user_id) {
      list = list.filter((r) => r.user_id === filters.user_id);
    }
    if (filters?.district && filters.district !== 'ALL') {
      list = list.filter((r) => r.district.toLowerCase() === filters.district!.toLowerCase());
    }
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter((r) =>
        r.booking_ref.toLowerCase().includes(q) ||
        r.hotel_name.toLowerCase().includes(q) ||
        r.guest_name.toLowerCase().includes(q) ||
        r.guest_email.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async getReservationById(id: string): Promise<HotelReservationRecord | null> {
    if (this.isUsingMySQL && this.mysqlPool) {
      const [rows]: any = await this.mysqlPool.query('SELECT * FROM hotel_reservations WHERE id = ? OR booking_ref = ? LIMIT 1', [id, id]);
      return (rows[0] as HotelReservationRecord) || null;
    }
    const r = (this.localState.reservations || []).find((x) => x.id === id || x.booking_ref === id);
    return r || null;
  }

  public async updateReservationStatus(id: string, status: 'Confirmed' | 'Completed' | 'Cancelled'): Promise<boolean> {
    if (this.isUsingMySQL && this.mysqlPool) {
      const [res]: any = await this.mysqlPool.query('UPDATE hotel_reservations SET status = ? WHERE id = ? OR booking_ref = ?', [status, id, id]);
      return res.affectedRows > 0;
    }
    const idx = (this.localState.reservations || []).findIndex((r) => r.id === id || r.booking_ref === id);
    if (idx !== -1) {
      this.localState.reservations[idx].status = status;
      this.saveLocalDb();
      return true;
    }
    return false;
  }

  // --- Comprehensive User Deep Data Inspector for Admin ---
  public async getUserFullData(userId: string) {
    const user = await this.findUserById(userId);
    if (!user) return null;

    const allTrips = await this.listTrips();
    const userTrips = allTrips.filter((t) => t.user_id === userId);
    const tripIds = new Set(userTrips.map((t) => t.id));

    const allExpenses = await this.listExpenses();
    const userExpenses = allExpenses.filter((e) => e.user_id === userId || tripIds.has(e.trip_id));

    const userReservations = await this.listReservations({ user_id: userId });

    const totalSpentUsd = userExpenses.reduce((sum, e) => sum + (Number(e.amount_usd) || 0), 0);
    const totalReservationsInr = userReservations.reduce((sum, r) => sum + (Number(r.total_amount_inr) || 0), 0);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar || '',
        bio: user.bio || '',
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      stats: {
        totalTrips: userTrips.length,
        activeTrips: userTrips.filter((t) => t.status === 'Active').length,
        completedTrips: userTrips.filter((t) => t.status === 'Completed').length,
        totalExpensesCount: userExpenses.length,
        totalSpentUsd,
        totalReservationsCount: userReservations.length,
        totalReservationsInr,
      },
      trips: userTrips,
      expenses: userExpenses,
      reservations: userReservations,
    };
  }

  // --- Super Admin Dashboard Aggregate Stats ---

  public async getSuperAdminStats() {
    const users = await this.listUsers();
    const trips = await this.listTrips();
    const expenses = await this.listExpenses();
    const destinations = await this.listDestinations();
    const aiMetrics = await this.getAiMetrics();
    const auditLogs = await this.getAuditLogs(15);
    const reservations = await this.listReservations();

    const totalUsers = users.length;
    const totalAdmins = users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length;
    const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
    const suspendedUsers = users.filter((u) => u.status === 'SUSPENDED').length;

    const totalTrips = trips.length;
    const activeTrips = trips.filter((t) => t.status === 'Active').length;
    const plannedTrips = trips.filter((t) => t.status === 'Planned').length;
    const completedTrips = trips.filter((t) => t.status === 'Completed').length;
    const archivedTrips = trips.filter((t) => t.is_archived || t.status === 'Archived').length;

    const totalExpensesUsd = expenses.reduce((sum, e) => sum + (Number(e.amount_usd) || 0), 0);
    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter((r) => r.status === 'Confirmed').length;
    const totalReservationsInr = reservations.reduce((sum, r) => sum + (Number(r.total_amount_inr) || 0), 0);

    // Trip status breakdown
    const tripStatusCounts = {
      Active: activeTrips,
      Planned: plannedTrips,
      Completed: completedTrips,
      Archived: archivedTrips,
    };

    // User registrations by month
    const registrationsByMonth: Record<string, number> = {};
    users.forEach((u) => {
      const d = u.created_at ? new Date(u.created_at) : new Date();
      const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      registrationsByMonth[monthKey] = (registrationsByMonth[monthKey] || 0) + 1;
    });

    // Expenses breakdown by currency
    const expensesByCurrency: Record<string, number> = {};
    expenses.forEach((e) => {
      const c = e.currency || 'USD';
      expensesByCurrency[c] = (expensesByCurrency[c] || 0) + (Number(e.amount_usd) || 0);
    });

    const safeUsers = users.slice(0, 10).map((u) => ({
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

    const safeTrips = trips.slice(0, 8).map((t) => {
      const owner = users.find((u) => u.id === t.user_id);
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

    return {
      overview: {
        totalUsers,
        totalAdmins,
        activeUsers,
        suspendedUsers,
        totalTrips,
        activeTrips,
        plannedTrips,
        completedTrips,
        archivedTrips,
        totalExpensesUsd,
        totalDestinations: destinations.length,
        totalReservations,
        confirmedReservations,
        totalReservationsInr,
        totalAiRequests: aiMetrics.totalRequests,
        aiSuccessRate: aiMetrics.successRate,
        aiAvgLatencyMs: aiMetrics.avgLatencyMs,
      },
      charts: {
        tripStatusCounts,
        registrationsByMonth,
        expensesByCurrency,
      },
      database: {
        type: this.isUsingMySQL ? 'MySQL 8.0+ Enterprise' : 'High-Availability Persistent Storage (JSON File Engine)',
        status: this.isUsingMySQL ? 'connected' : 'local_fallback',
        message: this.isUsingMySQL
          ? 'Connected to MySQL server with full ACID transactional integrity and live table indexes.'
          : 'Operating in self-contained persistent relational storage at data/travelmate_db.json. Set MYSQL_* environment variables to connect external MySQL database.',
        tablesCount: 7,
      },
      recentUsers: safeUsers,
      recentTrips: safeTrips,
      recentReservations: reservations.slice(0, 8),
      aiMetrics,
      auditLogs,
    };
  }

  public async getDashboardStats() {
    const stats = await this.getSuperAdminStats();
    return {
      totalUsers: stats.overview.totalUsers,
      totalAdmins: stats.overview.totalAdmins,
      totalTrips: stats.overview.totalTrips,
      totalExpensesUsd: stats.overview.totalExpensesUsd,
      totalReservations: stats.overview.totalReservations,
      databaseType: stats.database.type,
      databaseStatus: stats.database.status,
      databaseMessage: stats.database.message,
      recentUsers: stats.recentUsers,
      recentTrips: stats.recentTrips,
      recentReservations: stats.recentReservations,
      auditLogs: stats.auditLogs,
    };
  }

  // --- CSV Export Generator ---

  public async generateCsvExport(type: 'users' | 'trips' | 'expenses' | 'audit' | 'ai' | 'reservations'): Promise<string> {
    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    if (type === 'users') {
      const users = await this.listUsers();
      const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Last Login At', 'Created At'];
      const rows = users.map((u) => [
        sanitize(u.id),
        sanitize(u.name),
        sanitize(u.email),
        sanitize(u.role),
        sanitize(u.status),
        sanitize(u.last_login_at || 'Never'),
        sanitize(u.created_at),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'trips') {
      const trips = await this.listTrips();
      const users = await this.listUsers();
      const userMap = new Map(users.map((u) => [u.id, u]));

      const headers = ['Trip ID', 'Owner Name', 'Owner Email', 'Trip Name', 'Location', 'Country', 'Days Total', 'Budget USD', 'Spent USD', 'Status', 'Archived', 'Created At'];
      const rows = trips.map((t) => {
        const owner = userMap.get(t.user_id);
        return [
          sanitize(t.id),
          sanitize(owner?.name || 'Traveler'),
          sanitize(owner?.email || ''),
          sanitize(t.name),
          sanitize(t.location),
          sanitize(t.country),
          sanitize(t.days_total),
          sanitize(t.budget_limit_usd),
          sanitize(t.spent_usd),
          sanitize(t.status),
          sanitize(t.is_archived ? 'YES' : 'NO'),
          sanitize(t.created_at),
        ];
      });
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'expenses') {
      const expenses = await this.listExpenses();
      const headers = ['Expense ID', 'Trip ID', 'Title', 'Amount USD', 'Currency', 'Category', 'Payer', 'Date', 'Recorded At'];
      const rows = expenses.map((e) => [
        sanitize(e.id),
        sanitize(e.trip_id),
        sanitize(e.title),
        sanitize(e.amount_usd),
        sanitize(e.currency || 'USD'),
        sanitize(e.category),
        sanitize(e.payer_name || 'Traveler'),
        sanitize(e.date || ''),
        sanitize(e.created_at),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'ai') {
      const metrics = await this.getAiMetrics();
      const headers = ['Log ID', 'Endpoint', 'Feature', 'Status', 'Latency (ms)', 'Error', 'IP', 'Timestamp'];
      const rows = metrics.recentLogs.map((l) => [
        sanitize(l.id),
        sanitize(l.endpoint),
        sanitize(l.feature),
        sanitize(l.status),
        sanitize(l.latency_ms),
        sanitize(l.error_message || 'None'),
        sanitize(l.ip_address || ''),
        sanitize(l.created_at),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'audit') {
      const logs = await this.getAuditLogs(200);
      const headers = ['Audit ID', 'Admin Email', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'Timestamp'];
      const rows = logs.map((l) => [
        sanitize(l.id),
        sanitize(l.admin_email),
        sanitize(l.action),
        sanitize(l.resource_type || ''),
        sanitize(l.resource_id || ''),
        sanitize(l.details || ''),
        sanitize(l.ip_address || ''),
        sanitize(l.created_at),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    if (type === 'reservations') {
      const reservations = await this.listReservations();
      const headers = [
        'Booking Ref', 'User ID', 'Hotel Name', 'District', 'City', 'Room Type',
        'Check-In', 'Check-Out', 'Nights', 'Guests', 'Guest Name', 'Guest Email', 'Guest Phone',
        'Total INR', 'Total USD', 'Status', 'Payment Status', 'Booked At'
      ];
      const rows = reservations.map((r) => [
        sanitize(r.booking_ref),
        sanitize(r.user_id),
        sanitize(r.hotel_name),
        sanitize(r.district),
        sanitize(r.city),
        sanitize(r.room_type_name),
        sanitize(r.check_in_date),
        sanitize(r.check_out_date),
        sanitize(r.nights_count),
        sanitize(r.guests_count),
        sanitize(r.guest_name),
        sanitize(r.guest_email),
        sanitize(r.guest_phone),
        sanitize(r.total_amount_inr),
        sanitize(r.total_amount_usd),
        sanitize(r.status),
        sanitize(r.payment_status),
        sanitize(r.created_at),
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    return '';
  }

  // --- Rate Limiting for Security ---

  public checkRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry) {
      return { allowed: true };
    }

    if (entry.blockedUntil && entry.blockedUntil > now) {
      const waitSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
      return { allowed: false, waitSeconds };
    }

    if (now - entry.firstAttemptAt > 15 * 60 * 1000) {
      rateLimitMap.delete(key);
      return { allowed: true };
    }

    return { allowed: true };
  }

  public recordFailedLogin(key: string): { blocked: boolean; waitSeconds?: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(key) || {
      attempts: 0,
      firstAttemptAt: now,
    };

    entry.attempts += 1;

    if (entry.attempts >= 5) {
      entry.blockedUntil = now + 15 * 60 * 1000;
      rateLimitMap.set(key, entry);
      return { blocked: true, waitSeconds: 15 * 60 };
    }

    rateLimitMap.set(key, entry);
    return { blocked: false };
  }

  public resetRateLimit(key: string): void {
    rateLimitMap.delete(key);
  }

  public getDbInfo() {
    return {
      isUsingMySQL: this.isUsingMySQL,
      connectionError: this.connectionError,
      storageFile: DB_FILE_PATH,
    };
  }
}

export const db = new DatabaseManager();
