import dotenv from 'dotenv';
import { db } from '../server/db.js';

dotenv.config();

async function runSeed() {
  console.log('--- TravelMate Database & Admin Seeding ---');
  try {
    await db.initialize();
    console.log('✓ Database connected and schema verified.');

    await db.seedInitialAdmin();
    console.log('✓ Admin seed completed successfully.');

    const stats = await db.getDashboardStats();
    console.log(`Database Status: ${stats.databaseType} (${stats.databaseStatus})`);
    console.log(`Total Users in DB: ${stats.totalUsers} (${stats.totalAdmins} admin(s))`);
    console.log(`Total Trips in DB: ${stats.totalTrips}`);

    process.exit(0);
  } catch (error) {
    console.error('Fatal error during admin seeding:', error);
    process.exit(1);
  }
}

runSeed();
