-- Comprehensive seed data for Admin Authentication & Property Management System

-- Clear existing data
TRUNCATE TABLE property_amenities, property_features, property_documents, property_images, properties, property_categories, amenities, admin_password_resets, permission_admin, permission_role, role_admin, permissions, roles, user_logins, users RESTART IDENTITY CASCADE;

-- Insert Super Admin
-- INSERT INTO admins (name, email, password, status, is_super_admin) VALUES
-- ('Super Admin', 'admin@sunrise.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', true); -- password: admin123

-- Insert sample users
INSERT INTO users (name, email, phone, password, status, user_type, address, dob, gender) VALUES
('John Doe', 'john@example.com', '9876543210', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', 'landlord', '123 Main St, Mumbai', '1985-06-15', 'male'),
('Jane Smith', 'jane@example.com', '9876543211', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', 'tenant', '456 Oak Ave, Delhi', '1990-03-22', 'female'),
('Mike Johnson', 'mike@example.com', '9876543212', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', 'owner', '789 Pine Rd, Bangalore', '1988-11-08', 'male'),
('Sarah Wilson', 'sarah@example.com', '9876543213', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', 'landlord', '321 Elm St, Chennai', '1992-07-14', 'female'),
('David Brown', 'david@example.com', '9876543214', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', 'tenant', '654 Maple Dr, Pune', '1987-12-03', 'male');

-- Insert roles
INSERT INTO roles (name, slug, description) VALUES
('Property Manager', 'property-manager', 'Manages all property-related operations'),
('User Manager', 'user-manager', 'Manages user accounts and profiles'),
('Content Manager', 'content-manager', 'Manages website content and categories'),
('Finance Manager', 'finance-manager', 'Manages financial aspects and reports'),
('Support Agent', 'support-agent', 'Handles customer support and inquiries');

-- Insert permissions
INSERT INTO permissions (name, module, action, description) VALUES
-- Dashboard permissions
('View Dashboard', 'dashboard', 'view', 'View dashboard metrics and analytics'),

-- User management permissions
('View Users', 'user', 'view', 'View user list and details'),
('Create Users', 'user', 'create', 'Create new user accounts'),
('Edit Users', 'user', 'edit', 'Edit user information'),
('Delete Users', 'user', 'delete', 'Delete user accounts'),

-- Property management permissions
('View Properties', 'property', 'view', 'View property listings'),
('Create Properties', 'property', 'create', 'Add new properties'),
('Edit Properties', 'property', 'edit', 'Edit property information'),
('Delete Properties', 'property', 'delete', 'Delete properties'),
('Verify Properties', 'property', 'verify', 'Verify and approve properties'),

-- Admin management permissions
('View Admins', 'admin', 'view', 'View admin accounts'),
('Create Admins', 'admin', 'create', 'Create new admin accounts'),
('Edit Admins', 'admin', 'edit', 'Edit admin information'),
('Delete Admins', 'admin', 'delete', 'Delete admin accounts'),

-- Role management permissions
('View Roles', 'role', 'view', 'View roles and permissions'),
('Create Roles', 'role', 'create', 'Create new roles'),
('Edit Roles', 'role', 'edit', 'Edit role permissions'),
('Delete Roles', 'role', 'delete', 'Delete roles'),

-- Permission management permissions
('View Permissions', 'permission', 'view', 'View all permissions'),
('Create Permissions', 'permission', 'create', 'Create new permissions'),
('Edit Permissions', 'permission', 'edit', 'Edit permission details'),
('Delete Permissions', 'permission', 'delete', 'Delete permissions'),

-- Category management permissions
('View Categories', 'category', 'view', 'View property categories'),
('Create Categories', 'category', 'create', 'Create new categories'),
('Edit Categories', 'category', 'edit', 'Edit category information'),
('Delete Categories', 'category', 'delete', 'Delete categories'),

-- Report permissions
('View Reports', 'report', 'view', 'View system reports'),
('Export Data', 'report', 'export', 'Export system data');

-- Assign permissions to roles
-- Property Manager role permissions
INSERT INTO permission_role (role_id, permission_id)
SELECT 1, id FROM permissions WHERE module IN ('dashboard', 'property', 'category');

-- User Manager role permissions
INSERT INTO permission_role (role_id, permission_id)
SELECT 2, id FROM permissions WHERE module IN ('dashboard', 'user');

-- Content Manager role permissions
INSERT INTO permission_role (role_id, permission_id)
SELECT 3, id FROM permissions WHERE module IN ('dashboard', 'category', 'property') AND action IN ('view', 'create', 'edit');

-- Finance Manager role permissions
INSERT INTO permission_role (role_id, permission_id)
SELECT 4, id FROM permissions WHERE module IN ('dashboard', 'report', 'property') AND action IN ('view', 'export');

-- Support Agent role permissions
INSERT INTO permission_role (role_id, permission_id)
SELECT 5, id FROM permissions WHERE module IN ('dashboard', 'user', 'property') AND action = 'view';

-- Insert additional admins with roles
INSERT INTO admins (name, email, password, status, is_super_admin) VALUES
('Property Manager', 'property@sunrise.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', false),
('User Manager', 'users@sunrise.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', false),
('Content Manager', 'content@sunrise.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZp/k/K', 'active', false);

-- Assign roles to admins
INSERT INTO role_admin (admin_id, role_id) VALUES
(2, 1), -- Property Manager
(3, 2), -- User Manager
(4, 3); -- Content Manager

-- Insert property categories
INSERT INTO property_categories (name, slug, description, icon, is_active) VALUES
('Residential', 'residential', 'Residential properties including apartments, houses, and villas', 'home', true),
('Commercial', 'commercial', 'Commercial properties including offices, shops, and warehouses', 'building', true),
('Industrial', 'industrial', 'Industrial properties and manufacturing units', 'factory', true),
('Agricultural', 'agricultural', 'Agricultural land and farm properties', 'tree', true),
('Luxury', 'luxury', 'Premium and luxury properties', 'star', true);

-- Insert amenities
INSERT INTO amenities (name, category, icon, is_active) VALUES
-- Security amenities
('24/7 Security', 'security', 'shield', true),
('CCTV Surveillance', 'security', 'camera', true),
('Gated Community', 'security', 'gate', true),
('Security Guard', 'security', 'guard', true),

-- Recreation amenities
('Swimming Pool', 'recreation', 'pool', true),
('Gymnasium', 'recreation', 'dumbbell', true),
('Children Play Area', 'recreation', 'playground', true),
('Garden/Park', 'recreation', 'tree', true),
('Club House', 'recreation', 'club', true),
('Sports Complex', 'recreation', 'sports', true),

-- Convenience amenities
('Elevator/Lift', 'convenience', 'elevator', true),
('Parking Space', 'convenience', 'car', true),
('Power Backup', 'convenience', 'battery', true),
('Water Supply', 'convenience', 'water', true),
('Waste Management', 'convenience', 'trash', true),
('Maintenance Staff', 'convenience', 'tools', true),

-- Connectivity amenities
('Wi-Fi/Internet', 'connectivity', 'wifi', true),
('Cable TV', 'connectivity', 'tv', true),
('Intercom', 'connectivity', 'phone', true),

-- General amenities
('Air Conditioning', 'general', 'snowflake', true),
('Balcony', 'general', 'balcony', true),
('Furnished', 'general', 'sofa', true),
('Modular Kitchen', 'general', 'kitchen', true),
('Attached Bathroom', 'general', 'bath', true);

-- Insert sample properties
INSERT INTO properties (
    title, description, owner_id, category_id, property_type, listing_type,
    price, monthly_rent, security_deposit, area, area_unit, bedroom, bathroom, balcony, bhk,
    floor_no, total_floors, furnish_type, available_from, available_for,
    status, is_featured, city, state, locality, landmark, zipcode, full_address,
    latitude, longitude, map_location, meta_title, meta_description
) VALUES
(
    'Luxury 3BHK Apartment in Bandra West',
    'Spacious 3BHK apartment with modern amenities, sea view, and prime location in Bandra West. Perfect for families looking for comfort and convenience.',
    1, 1, 'apartment', 'rent',
    NULL, 85000.00, 170000.00, 1200.00, 'sqft', 3, 2, 2, 3,
    12, 25, 'semi-furnished', '2024-02-01', '["Family", "Bachelor"]',
    'published', true, 'Mumbai', 'Maharashtra', 'Bandra West', 'Near Bandra Station', '400050',
    'A-1204, Sunrise Towers, Linking Road, Bandra West, Mumbai - 400050',
    19.0596, 72.8295, 'Sunrise Towers, Linking Road, Bandra West, Mumbai',
    'Luxury 3BHK Apartment for Rent in Bandra West Mumbai',
    'Spacious 3BHK apartment with sea view in prime Bandra West location. Modern amenities, semi-furnished, perfect for families.'
),
(
    'Modern 2BHK Villa in Koramangala',
    'Beautiful independent villa with garden, parking, and all modern amenities in the heart of Koramangala, Bangalore.',
    3, 1, 'villa', 'sale',
    12500000.00, NULL, NULL, 1800.00, 'sqft', 2, 2, 1, 2,
    NULL, 2, 'furnished', '2024-01-15', '["Family"]',
    'published', true, 'Bangalore', 'Karnataka', 'Koramangala', 'Near Forum Mall', '560034',
    'Villa No. 45, 5th Block, Koramangala, Bangalore - 560034',
    12.9352, 77.6245, 'Villa No. 45, 5th Block, Koramangala, Bangalore',
    'Modern 2BHK Villa for Sale in Koramangala Bangalore',
    'Independent villa with garden and parking in prime Koramangala location. Fully furnished with modern amenities.'
),
(
    'Commercial Office Space in Connaught Place',
    'Prime commercial office space in the heart of Delhi. Ideal for businesses looking for prestigious address and excellent connectivity.',
    1, 2, 'office', 'rent',
    NULL, 150000.00, 300000.00, 2500.00, 'sqft', 0, 2, 0, 0,
    3, 8, 'unfurnished', '2024-03-01', '["Commercial"]',
    'published', false, 'Delhi', 'Delhi', 'Connaught Place', 'Near Metro Station', '110001',
    'Office No. 301, Connaught Plaza, Connaught Place, New Delhi - 110001',
    28.6315, 77.2167, 'Connaught Plaza, Connaught Place, New Delhi',
    'Commercial Office Space for Rent in Connaught Place Delhi',
    'Prime office space in prestigious Connaught Place location. Excellent connectivity and modern facilities.'
),
(
    'Cozy 1BHK Apartment in Pune',
    'Affordable 1BHK apartment perfect for young professionals and students. Located in a peaceful area with good connectivity.',
    4, 1, 'apartment', 'rent',
    NULL, 18000.00, 36000.00, 600.00, 'sqft', 1, 1, 1, 1,
    4, 10, 'furnished', '2024-01-20', '["Bachelor", "Family"]',
    'published', false, 'Pune', 'Maharashtra', 'Kothrud', 'Near Kothrud Depot', '411038',
    'Flat No. 402, Shanti Apartments, Kothrud, Pune - 411038',
    18.5074, 73.8077, 'Shanti Apartments, Kothrud, Pune',
    'Cozy 1BHK Apartment for Rent in Kothrud Pune',
    'Affordable furnished 1BHK apartment in peaceful Kothrud area. Perfect for professionals and students.'
),
(
    'Spacious 4BHK House in Anna Nagar',
    'Large independent house with parking, garden, and terrace. Perfect for big families looking for space and privacy.',
    4, 1, 'house', 'sale',
    8500000.00, NULL, NULL, 2200.00, 'sqft', 4, 3, 2, 4,
    NULL, 2, 'semi-furnished', '2024-02-15', '["Family"]',
    'published', true, 'Chennai', 'Tamil Nadu', 'Anna Nagar', 'Near Anna Nagar Tower', '600040',
    'No. 25, 2nd Avenue, Anna Nagar West, Chennai - 600040',
    13.0843, 80.2705, 'No. 25, 2nd Avenue, Anna Nagar West, Chennai',
    'Spacious 4BHK House for Sale in Anna Nagar Chennai',
    'Large independent house with garden and parking in prime Anna Nagar location. Perfect for big families.'
),
(
    'Retail Shop in Commercial Complex',
    'Well-located retail shop in busy commercial complex. High footfall area, perfect for retail business.',
    3, 2, 'shop', 'rent',
    NULL, 45000.00, 90000.00, 800.00, 'sqft', 0, 1, 0, 0,
    1, 3, 'unfurnished', '2024-01-10', '["Commercial"]',
    'published', false, 'Mumbai', 'Maharashtra', 'Andheri East', 'Near Metro Station', '400069',
    'Shop No. 15, Metro Plaza, Andheri East, Mumbai - 400069',
    19.1136, 72.8697, 'Metro Plaza, Andheri East, Mumbai',
    'Retail Shop for Rent in Andheri East Mumbai',
    'Well-located retail shop in busy commercial area. High footfall, perfect for retail business.'
);


-- Insert property features
INSERT INTO property_features (name, icon)
VALUES
  ('Sea View', 'sea_view_icon'),
  ('Parking', 'parking_icon'),
  ('Floor', 'floor_icon'),
  ('Age', 'age_icon'),
  ('Garden', 'garden_icon'),
  ('Solar', 'solar_icon'),
  ('Location', 'location_icon'),
  ('Connectivity', 'connectivity_icon'),
  ('Facilities', 'facilities_icon'),
  ('Furnished', 'furnished_icon'),
  ('Terrace', 'terrace_icon'),
  ('Kitchen', 'kitchen_icon'),
  ('Visibility', 'visibility_icon');

-- Property 1: "Luxury 3BHK Apartment in Bandra West"
INSERT INTO feature_property (property_id, feature_id) VALUES
(1, 1),  -- Sea View
(1, 2),  -- Parking
(1, 3),  -- Floor
(1, 4);  -- Age

-- Property 2: "Modern 2BHK Villa in Koramangala"
INSERT INTO feature_property (property_id, feature_id) VALUES
(2, 5),  -- Garden
(2, 2),  -- Parking
(2, 6),  -- Solar
(2, 4);  -- Age

-- Property 3: "Commercial Office Space in Connaught Place"
INSERT INTO feature_property (property_id, feature_id) VALUES
(3, 7),  -- Location
(3, 2),  -- Parking
(3, 8),  -- Connectivity
(3, 9);  -- Facilities

-- Property 4: "Cozy 1BHK Apartment in Pune"
INSERT INTO feature_property (property_id, feature_id) VALUES
(4, 10), -- Furnished
(4, 2),  -- Parking
(4, 8),  -- Connectivity
(4, 4);  -- Age

-- Property 5: "Spacious 4BHK House in Anna Nagar"
INSERT INTO feature_property (property_id, feature_id) VALUES
(5, 11), -- Terrace
(5, 2),  -- Parking
(5, 12), -- Kitchen
(5, 4);  -- Age

-- Property 6: "Retail Shop in Commercial Complex"
INSERT INTO feature_property (property_id, feature_id) VALUES
(6, 7),  -- Location
(6, 13), -- Visibility
(6, 8),  -- Connectivity
(6, 9);  -- Facilities


-- Insert property amenities relationships
INSERT INTO property_amenities (property_id, amenity_id) VALUES
-- Property 1 amenities (Luxury apartment)
(1, 1), (1, 2), (1, 3), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 17), (1, 19), (1, 20), (1, 21),

-- Property 2 amenities (Villa)
(2, 1), (2, 4), (2, 8), (2, 9), (2, 10), (2, 11), (2, 17), (2, 19), (2, 20), (2, 21), (2, 22),

-- Property 3 amenities (Office)
(3, 1), (3, 2), (3, 7), (3, 9), (3, 10), (3, 17), (3, 18), (3, 19),

-- Property 4 amenities (1BHK apartment)
(4, 1), (4, 7), (4, 9), (4, 10), (4, 17), (4, 20), (4, 21), (4, 22),

-- Property 5 amenities (4BHK house)
(5, 1), (5, 4), (5, 8), (5, 9), (5, 10), (5, 11), (5, 17), (5, 20), (5, 21), (5, 22),

-- Property 6 amenities (Shop)
(6, 1), (6, 2), (6, 7), (6, 9), (6, 10), (6, 17);

-- Insert sample property visits for dashboard metrics
INSERT INTO property_visits (property_id, user_id, visitor_ip, visit_type, source) VALUES
(1, 2, '192.168.1.100', 'view', 'organic'),
(1, 5, '192.168.1.101', 'inquiry', 'social'),
(2, 2, '192.168.1.102', 'view', 'direct'),
(3, NULL, '192.168.1.103', 'view', 'organic'),
(4, 5, '192.168.1.104', 'contact', 'referral'),
(5, 2, '192.168.1.105', 'view', 'organic'),
(1, NULL, '192.168.1.106', 'view', 'social'),
(2, 5, '192.168.1.107', 'inquiry', 'direct');

-- Insert sample user login history
INSERT INTO user_logins (user_id, login_at, ip_address, user_agent, platform, location, status) VALUES
(1, NOW() - INTERVAL '1 day', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Windows', 'Mumbai, India', 'success'),
(2, NOW() - INTERVAL '2 hours', '192.168.1.11', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'iOS', 'Delhi, India', 'success'),
(3, NOW() - INTERVAL '3 days', '192.168.1.12', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'macOS', 'Bangalore, India', 'success'),
(4, NOW() - INTERVAL '1 hour', '192.168.1.13', 'Mozilla/5.0 (Android 11; Mobile)', 'Android', 'Chennai, India', 'success'),
(5, NOW() - INTERVAL '5 hours', '192.168.1.14', 'Mozilla/5.0 (X11; Linux x86_64)', 'Linux', 'Pune, India', 'success');

-- Update admin last login times
UPDATE admins SET last_login_at = NOW() - INTERVAL '30 minutes', last_login_ip = '192.168.1.1' WHERE id = 1;
UPDATE admins SET last_login_at = NOW() - INTERVAL '2 hours', last_login_ip = '192.168.1.2' WHERE id = 2;
UPDATE admins SET last_login_at = NOW() - INTERVAL '1 day', last_login_ip = '192.168.1.3' WHERE id = 3;