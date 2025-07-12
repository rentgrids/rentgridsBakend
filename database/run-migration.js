import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runMigration = async () => {
    try {
        logger.info('🔄 Running database migration...');

        // Read and execute schema file
        const schemaPath = join(__dirname, 'schema.sql');
        const schema = readFileSync(schemaPath, 'utf8');

        await pool.query(schema);

        logger.info('✅ Database migration completed successfully!');
        logger.info('📝 Schema updated with:');
        logger.info('   - Enhanced property management tables');
        logger.info('   - Improved indexing for better performance');
        logger.info('   - Triggers for data consistency');
        logger.info('   - Legacy field compatibility');

    } catch (error) {
        logger.error('❌ Database migration failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
};

// Run migration
runMigration()
    .then(() => {
        logger.info('✅ Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('❌ Migration failed:', error);
        process.exit(1);
    });