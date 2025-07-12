import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

const seedPropertyManagement = async () => {
    try {
        logger.info('🏠 Starting property management seeding...');

        // Additional property categories
        await pool.query(`
            INSERT INTO property_categories (name, slug, description, icon, is_active) VALUES
            ('Co-living', 'co-living', 'Shared living spaces and co-living properties', 'users', true),
            ('Student Housing', 'student-housing', 'Properties specifically for students', 'graduation-cap', true),
            ('Senior Living', 'senior-living', 'Properties for senior citizens', 'user-plus', true),
            ('Vacation Rental', 'vacation-rental', 'Short-term vacation rental properties', 'calendar', true)
            ON CONFLICT (slug) DO NOTHING;
        `);

        // Additional amenities
        await pool.query(`
            INSERT INTO amenities (name, category, icon, is_active) VALUES
            -- Smart Home amenities
            ('Smart Locks', 'connectivity', 'lock', true),
            ('Smart Lighting', 'connectivity', 'lightbulb', true),
            ('Home Automation', 'connectivity', 'robot', true),
            ('Video Doorbell', 'security', 'doorbell', true),

            -- Wellness amenities
            ('Yoga Studio', 'recreation', 'meditation', true),
            ('Spa/Wellness Center', 'recreation', 'spa', true),
            ('Jogging Track', 'recreation', 'running', true),
            ('Meditation Garden', 'recreation', 'leaf', true),

            -- Business amenities
            ('Business Center', 'convenience', 'briefcase', true),
            ('Conference Room', 'convenience', 'presentation', true),
            ('Co-working Space', 'convenience', 'laptop', true),
            ('High-speed Internet', 'connectivity', 'wifi-strong', true),

            -- Luxury amenities
            ('Concierge Service', 'convenience', 'bell', true),
            ('Valet Parking', 'convenience', 'car-service', true),
            ('Private Theater', 'recreation', 'film', true),
            ('Wine Cellar', 'recreation', 'wine', true),
            ('Rooftop Terrace', 'recreation', 'building-top', true)
            ON CONFLICT (name) DO NOTHING;
        `);

        // Additional sample properties with more variety
        await pool.query(`
            INSERT INTO properties (
                title, description, owner_id, category_id, property_type, listing_type,
                price, monthly_rent, security_deposit, area, area_unit, bedroom, bathroom, balcony, bhk,
                floor_no, total_floors, furnish_type, available_from, available_for,
                status, is_featured, city, state, locality, landmark, zipcode, full_address,
                latitude, longitude, map_location, meta_title, meta_description
            ) VALUES
            (
                'Premium Co-living Space in HSR Layout',
                'Modern co-living space with private rooms and shared common areas. Perfect for young professionals and students.',
                2, 1, 'co-living', 'rent',
                NULL, 25000.00, 50000.00, 400.00, 'sqft', 1, 1, 0, 1,
                3, 5, 'furnished', '2024-02-01', '["Bachelor"]',
                'published', false, 'Bangalore', 'Karnataka', 'HSR Layout', 'Near Agara Lake', '560102',
                'Co-live Space, Sector 1, HSR Layout, Bangalore - 560102',
                12.9116, 77.6370, 'HSR Layout, Bangalore',
                'Premium Co-living Space for Rent in HSR Layout Bangalore',
                'Modern co-living space with all amenities in prime HSR Layout location.'
            ),
            (
                'Luxury Penthouse in Worli',
                'Stunning penthouse with panoramic city and sea views. Premium location with world-class amenities.',
                1, 5, 'apartment', 'sale',
                45000000.00, NULL, NULL, 3500.00, 'sqft', 4, 4, 3, 4,
                25, 25, 'furnished', '2024-03-01', '["Family"]',
                'published', true, 'Mumbai', 'Maharashtra', 'Worli', 'Near Worli Sea Face', '400018',
                'Penthouse, Worli Towers, Worli, Mumbai - 400018',
                19.0176, 72.8162, 'Worli Towers, Mumbai',
                'Luxury Penthouse for Sale in Worli Mumbai',
                'Stunning penthouse with sea views and premium amenities in Worli.'
            ),
            (
                'Student Housing Near IIT Delhi',
                'Purpose-built student accommodation with study areas, high-speed internet, and security.',
                3, 1, 'apartment', 'rent',
                NULL, 15000.00, 30000.00, 300.00, 'sqft', 1, 1, 1, 1,
                2, 4, 'furnished', '2024-01-15', '["Bachelor"]',
                'published', false, 'Delhi', 'Delhi', 'Hauz Khas', 'Near IIT Delhi', '110016',
                'Student Housing, Hauz Khas, New Delhi - 110016',
                28.5494, 77.1925, 'Hauz Khas, New Delhi',
                'Student Housing for Rent near IIT Delhi',
                'Purpose-built student accommodation with all facilities near IIT Delhi.'
            ),
            (
                'Warehouse Space in MIDC Pune',
                'Large warehouse space suitable for manufacturing and storage. Good connectivity to highways.',
                4, 3, 'warehouse', 'rent',
                NULL, 80000.00, 160000.00, 5000.00, 'sqft', 0, 2, 0, 0,
                1, 1, 'unfurnished', '2024-02-15', '["Commercial"]',
                'published', false, 'Pune', 'Maharashtra', 'MIDC Bhosari', 'Near Highway', '411026',
                'Warehouse No. 15, MIDC Bhosari, Pune - 411026',
                18.6298, 73.8397, 'MIDC Bhosari, Pune',
                'Warehouse Space for Rent in MIDC Pune',
                'Large warehouse space with good connectivity in MIDC industrial area.'
            ),
            (
                'Farmhouse with Agricultural Land',
                'Beautiful farmhouse with 5 acres of agricultural land. Perfect for weekend getaways.',
                2, 4, 'house', 'sale',
                8500000.00, NULL, NULL, 50000.00, 'sqft', 3, 2, 2, 3,
                NULL, 1, 'semi-furnished', '2024-01-20', '["Family"]',
                'published', true, 'Lonavala', 'Maharashtra', 'Khandala', 'Near Khandala Station', '410301',
                'Farmhouse, Khandala Hills, Lonavala - 410301',
                18.7645, 73.4084, 'Khandala Hills, Lonavala',
                'Farmhouse with Agricultural Land for Sale in Lonavala',
                'Beautiful farmhouse with agricultural land in scenic Lonavala hills.'
            )
        `);

        // Get the IDs of newly inserted properties
        const newPropertiesResult = await pool.query(`
            SELECT id FROM properties
            WHERE title IN (
                'Premium Co-living Space in HSR Layout',
                'Luxury Penthouse in Worli',
                'Student Housing Near IIT Delhi',
                'Warehouse Space in MIDC Pune',
                'Farmhouse with Agricultural Land'
            )
            ORDER BY id
        `);

        const newPropertyIds = newPropertiesResult.rows.map(row => row.id);

        // Add location data for new properties
        const locationInserts = [
            [newPropertyIds[0], 'India', 'Karnataka', 'Bangalore', 'HSR Layout', 'Near Agara Lake', '560102', 'Co-live Space, Sector 1, HSR Layout, Bangalore - 560102'],
            [newPropertyIds[1], 'India', 'Maharashtra', 'Mumbai', 'Worli', 'Near Worli Sea Face', '400018', 'Penthouse, Worli Towers, Worli, Mumbai - 400018'],
            [newPropertyIds[2], 'India', 'Delhi', 'Delhi', 'Hauz Khas', 'Near IIT Delhi', '110016', 'Student Housing, Hauz Khas, New Delhi - 110016'],
            [newPropertyIds[3], 'India', 'Maharashtra', 'Pune', 'MIDC Bhosari', 'Near Highway', '411026', 'Warehouse No. 15, MIDC Bhosari, Pune - 411026'],
            [newPropertyIds[4], 'India', 'Maharashtra', 'Lonavala', 'Khandala', 'Near Khandala Station', '410301', 'Farmhouse, Khandala Hills, Lonavala - 410301']
        ];

        for (const location of locationInserts) {
            await pool.query(`
                INSERT INTO property_location (property_id, country, state, city, locality, landmark, zipcode, full_address)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, location);
        }

        // Add features for new properties
        const features = [
            // Co-living space features
            [newPropertyIds[0], 'Common Kitchen', 'Fully equipped shared kitchen'],
            [newPropertyIds[0], 'Study Area', 'Dedicated study and work spaces'],
            [newPropertyIds[0], 'Laundry', 'Coin-operated laundry facility'],
            [newPropertyIds[0], 'Recreation', 'Gaming and entertainment area'],

            // Penthouse features
            [newPropertyIds[1], 'Sea View', 'Panoramic Arabian Sea view'],
            [newPropertyIds[1], 'Private Elevator', 'Dedicated elevator access'],
            [newPropertyIds[1], 'Terrace Garden', 'Private terrace with landscaping'],
            [newPropertyIds[1], 'Home Theater', 'Dedicated home theater room'],

            // Student housing features
            [newPropertyIds[2], 'Study Desk', 'Individual study desk and chair'],
            [newPropertyIds[2], 'High-speed WiFi', 'Unlimited high-speed internet'],
            [newPropertyIds[2], 'Mess Facility', 'Optional mess facility available'],
            [newPropertyIds[2], 'Security', '24/7 security and CCTV'],

            // Warehouse features
            [newPropertyIds[3], 'Loading Dock', 'Multiple loading and unloading docks'],
            [newPropertyIds[3], 'High Ceiling', '20 feet high ceiling'],
            [newPropertyIds[3], 'Power Supply', '3-phase power supply available'],
            [newPropertyIds[3], 'Office Space', 'Attached office space'],

            // Farmhouse features
            [newPropertyIds[4], 'Agricultural Land', '5 acres of fertile agricultural land'],
            [newPropertyIds[4], 'Water Source', 'Bore well and natural water source'],
            [newPropertyIds[4], 'Fruit Trees', 'Mango and coconut trees'],
            [newPropertyIds[4], 'Caretaker Quarter', 'Separate caretaker accommodation']
        ];

        for (const feature of features) {
            await pool.query(`
                INSERT INTO property_features (property_id, feature_key, feature_value)
                VALUES ($1, $2, $3)
            `, feature);
        }

        // Add amenities for new properties
        const amenityMappings = [
            // Co-living space amenities
            [newPropertyIds[0], [1, 2, 7, 9, 10, 17, 19, 20, 21, 31]], // Security, parking, power backup, etc.

            // Penthouse amenities (luxury)
            [newPropertyIds[1], [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 17, 19, 20, 21, 22, 33, 34, 35, 36, 37]], // All luxury amenities

            // Student housing amenities
            [newPropertyIds[2], [1, 2, 7, 9, 10, 17, 19, 20, 32]], // Basic amenities + high-speed internet

            // Warehouse amenities
            [newPropertyIds[3], [1, 2, 7, 9, 10, 17]], // Basic commercial amenities

            // Farmhouse amenities
            [newPropertyIds[4], [1, 4, 8, 9, 10, 11, 17, 20, 21]] // Security, garden, parking, etc.
        ];

        for (const [propertyId, amenityIds] of amenityMappings) {
            for (const amenityId of amenityIds) {
                await pool.query(`
                    INSERT INTO property_amenities (property_id, amenity_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [propertyId, amenityId]);
            }
        }

        // Add more property visits for analytics
        const visitData = [];
        for (let i = 0; i < 50; i++) {
            const propertyId = newPropertyIds[Math.floor(Math.random() * newPropertyIds.length)];
            const userId = Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null;
            const visitType = ['view', 'inquiry', 'contact'][Math.floor(Math.random() * 3)];
            const source = ['organic', 'social', 'direct', 'referral'][Math.floor(Math.random() * 4)];
            const daysAgo = Math.floor(Math.random() * 30);

            visitData.push([propertyId, userId, `192.168.1.${100 + i}`, visitType, source, daysAgo]);
        }

        for (const visit of visitData) {
            await pool.query(`
                INSERT INTO property_visits (property_id, user_id, visitor_ip, visit_type, source, created_at)
                VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${visit[5]} days')
            `, visit.slice(0, 5));
        }

        logger.info('✅ Property management seeding completed!');
        logger.info('📊 Additional data added:');
        logger.info('   - 4 New Property Categories');
        logger.info('   - 17 Additional Amenities');
        logger.info('   - 5 New Properties with full details');
        logger.info('   - 50 Additional Property Visits for analytics');

    } catch (error) {
        logger.error('❌ Property management seeding failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
};

// Run seeding
seedPropertyManagement()
    .then(() => {
        logger.info('✅ Property management seeding completed');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('❌ Property management seeding failed:', error);
        process.exit(1);
    });