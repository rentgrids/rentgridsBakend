import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedDatabase = async () => {
    try {
        logger.info('🌱 Starting database seeding...');

        // Read and execute seed file
        const seedPath = join(__dirname, '20250711122435_bitter_jungle.sql');
        const seedData = readFileSync(seedPath, 'utf8');

        await pool.query(seedData);

        logger.info('✅ Database seeded successfully!');
        logger.info('📊 Sample data includes:');
        logger.info('   - 1 Super Admin (admin@sunrise.com / admin123)');
        logger.info('   - 3 Additional Admins with different roles');
        logger.info('   - 5 Sample Users (landlords, tenants, owners)');
        logger.info('   - 5 Property Categories');
        logger.info('   - 20+ Amenities');
        logger.info('   - 6 Sample Properties with full details');
        logger.info('   - Complete role-based permission system');

    } catch (error) {
        logger.error('❌ Database seeding failed:', error);
        throw error;
    } finally {
        await pool.end();
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