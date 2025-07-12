import { query } from '../config/database.js';
import { hashPassword } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const seedDatabase = async () => {
  try {
    logger.info('🌱 Starting database seeding...');

    // 1. Create Super Admin
    const superAdminPassword = await hashPassword('admin123');
    await query(`
      INSERT INTO admins (name, email, password, status, is_super_admin)
      VALUES ('Super Admin', 'admin@example.com', $1, 'active', true)
      ON CONFLICT (email) DO NOTHING
    `, [superAdminPassword]);
    logger.info('✅ Super Admin created');


    logger.info('🎉 Database seeding completed successfully!');
    logger.info('\n📋 Login Credentials:');
    logger.info('Super Admin: admin@example.com / admin123');
    logger.info('Manager: manager@example.com / manager123');
    logger.info('Sample Users: john@example.com, jane@example.com / user123');

  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Run seeding
seedDatabase()
  .then(() => {
    logger.info('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  });