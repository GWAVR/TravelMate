# TravelMate — Secure Admin Authentication & Database Integration

TravelMate is a full-stack, AI-powered travel planning companion equipped with the TripGenie 360° Travel Auditor, smart group expense ledger, itinerary coordination, and a role-based access control (RBAC) **Administrator Console**.

---

## 1. Overview of Changes & Features

- **Server-Side Password Hashing & Bcrypt**: Passwords are never stored in plaintext or sent to clients. Passwords are securely hashed with 10 rounds of salted bcrypt (`bcryptjs`).
- **Role-Based Access Control (RBAC)**: Distinct `ADMIN` and `USER` roles enforced on the server. Browser-supplied roles are strictly validated against verified database records.
- **Protected Admin Routes & Endpoints**:
  - Direct browser URL `/admin` opens the protected Administrator Console or prompts for Admin credentials.
  - Protected backend APIs (`/api/admin/dashboard`, `/api/admin/users`, `/api/admin/logout`) require a valid JWT with verified `ADMIN` database role. Normal users receive `403 Forbidden`.
- **Brute-Force Rate Limiting**: Built-in security middleware rate-limits login attempts per IP and email. Exceeding 5 failed attempts locks the login endpoint for 15 minutes.
- **Relational Database with Graceful Fallback**:
  - Connects to **MySQL 8.0+** when `MYSQL_*` environment variables are provided.
  - If MySQL is not configured or temporarily unreachable, TravelMate automatically falls back to a high-reliability persistent local relational database engine (`data/travelmate_db.json`) maintaining identical schema, relations, and ACID transaction safety.
- **Admin Dashboard**:
  - Real database metrics: Total Registered Users, Total Admins, Total Trips, Total Expenses ($ USD).
  - User management table with create, view, and delete capabilities.
  - Recent registered trips.
  - Security audit logs with admin timestamps and IP addresses.
- **Idempotent Admin Seeder**:
  - Automatically initializes the default administrator on server startup or via `npm run seed:admin`.
  - Re-running the script never duplicates administrators and never overwrites an existing admin's changed password.

---

## 2. Configuration & Environment Variables

Create or configure `.env` (or supply environment variables to your deployment container) based on `.env.example`:

```env
# Gemini API Key (injected by AI Studio or set manually)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# JWT Secret for signing session tokens (use a strong 32+ char key)
JWT_SECRET="travelmate-super-secure-production-jwt-token-2025-aistudio-key-av89"

# Initial Administrator Account Credentials
ADMIN_EMAIL="abhijeetraoavr@gmail.com"
ADMIN_PASSWORD="your_secure_admin_password_here"
ADMIN_NAME="Abhijeet Rao"

# Optional: MySQL Relational Database Configuration
# If omitted or offline, the app seamlessly runs using the persistent storage engine
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="travelmate"
MYSQL_PASSWORD="your_mysql_password"
MYSQL_DATABASE="travelmate_db"
```

---

## 3. Database Setup & Migrations

### For MySQL / MariaDB

1. Start your MySQL server.
2. Execute the provided SQL schema file:
   ```bash
   mysql -u root -p < schema.sql
   ```
3. Set `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` in your `.env`.
4. When the server boots, it connects, verifies tables, and ensures all indexes exist.

### For Default Persistent Storage

If running in local prototyping, tests, or containers without an external MySQL daemon, no setup is required! The server initializes `data/travelmate_db.json` automatically.

---

## 4. How to Create the Initial Admin Account Securely

Run the idempotent seeding script:
```bash
npm run seed:admin
```
Or execute:
```bash
npx tsx scripts/seed-admin.ts
```

The script will:
1. Connect to the database and verify schemas.
2. Check if the administrator (`ADMIN_EMAIL`) already exists.
3. If not found, hash the `ADMIN_PASSWORD` with bcrypt salt rounds and create the account with role `ADMIN`.
4. If already present, it preserves the existing password and prints a confirmation.

The server also runs this verification on every startup.

---

## 5. How to Run the Project

1. Install dependencies (already pre-installed):
   ```bash
   npm install
   ```
2. Start the development server (runs Express backend + Vite on port 3000):
   ```bash
   npm run dev
   ```
3. Open your browser:
   ```
   http://localhost:3000
   ```

---

## 6. How to Log In as Admin

Configured Administrator Accounts:
- **Lead Administrator**: `abhijeetraoavr@gmail.com` (password: `Abhi@032006`)
- **Operations Administrator**: `lokeshramkor650@gmail.com` (password: `Lokesh@212006`)

*(Note: Per strict privacy rules, email fields have zero autofill enabled across all login inputs).*

### Login Methods:
1. **Direct URL**: Navigate directly to:
   ```
   http://localhost:3000/admin
   ```
   If unauthenticated, you will see the **Administrator Portal** with the dark navy & gold security badge.
2. **From the Sign In Screen**:
   - In the auth dialog, click the **Admin** tab at the top or click **"Sign In to Administrator Console →"** at the bottom.
   - Enter your administrator email and password.
   - Click **"Sign In as Administrator"**.
   - Upon successful verification, you will be automatically redirected to the **Super Admin Dashboard**.

---

## 7. How to Verify Role-Based Protection

1. **Browser Test**:
   - Create or sign in as a standard user (e.g. click "Sign Up" or "One-Tap Sample Explorer").
   - Now click the URL bar and type `/admin` or click "Administrator Sign In Portal" in Profile.
   - You will see the **"Administrator Access Required"** barrier stating that regular travelers cannot access the admin console without admin credentials.
2. **API Protection Test**:
   - Try to query the admin dashboard endpoint without an admin token:
     ```bash
     curl -i http://localhost:3000/api/admin/dashboard
     ```
     Returns `HTTP 401 Unauthorized: Authentication required`.
   - Pass a regular user's JWT token:
     Returns `HTTP 403 Forbidden: Administrator privileges required`.
   - Pass an administrator's JWT token:
     Returns `HTTP 200 OK` with full database metrics, user lists, trips, and audit records.
