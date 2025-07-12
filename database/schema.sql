-- Create database schema for Admin Authentication & Property Management System

-- Drop existing tables if they exist (in correct order to avoid FK conflicts)
DROP TABLE IF EXISTS property_amenities CASCADE;
DROP TABLE IF EXISTS property_features CASCADE;
DROP TABLE IF EXISTS property_documents CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS property_categories CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS admin_password_resets CASCADE;
DROP TABLE IF EXISTS permission_admin CASCADE;
DROP TABLE IF EXISTS permission_role CASCADE;
DROP TABLE IF EXISTS role_admin CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS user_logins CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_property_unique_id() CASCADE;
DROP FUNCTION IF EXISTS generate_slug() CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to generate property unique_id
CREATE OR REPLACE FUNCTION generate_property_unique_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unique_id IS NULL OR NEW.unique_id = '' THEN
        NEW.unique_id := 'PROP-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || FLOOR(RANDOM() * 1000)::INT;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        )) || '-' || FLOOR(RANDOM() * 1000)::INT;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  is_blocked BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  last_login_ip INET,
  login_attempts INT DEFAULT 0,
  provider VARCHAR(50),
  provider_id VARCHAR(100),
  user_type VARCHAR(50) DEFAULT 'user' CHECK (user_type IN ('user', 'tenant', 'landlord', 'owner', 'premium')),
  profile_image TEXT,
  address TEXT,
  dob DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User logins table
CREATE TABLE user_logins (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  platform VARCHAR(50),
  location TEXT,
  status VARCHAR(20) DEFAULT 'success'
);

-- Admins table
CREATE TABLE admins (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  is_super_admin BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  last_login_ip INET,
  login_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Permissions table
CREATE TABLE permissions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Role Admin junction table
CREATE TABLE role_admin (
  admin_id BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_id, role_id)
);

-- Permission Role junction table
CREATE TABLE permission_role (
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Permission Admin junction table (direct permissions)
CREATE TABLE permission_admin (
  admin_id BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_id, permission_id)
);

-- Admin Password Resets table
CREATE TABLE admin_password_resets (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property Categories Table
CREATE TABLE property_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Amenities Table
CREATE TABLE amenities (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'security', 'recreation', 'convenience', 'connectivity')),
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Properties Main Table
CREATE TABLE properties (
  id BIGSERIAL PRIMARY KEY,
  unique_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  owner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  category_id BIGINT REFERENCES property_categories(id) ON DELETE SET NULL,
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('apartment', 'villa', 'house', 'plot', 'office', 'shop', 'warehouse', 'co-living')),
  listing_type VARCHAR(20) NOT NULL CHECK (listing_type IN ('rent', 'sale', 'lease')),
  price DECIMAL(12, 2),
  monthly_rent DECIMAL(12, 2),
  security_deposit DECIMAL(12, 2),
  area DECIMAL(10, 2) NOT NULL CHECK (area > 0),
  area_unit VARCHAR(20) DEFAULT 'sqft' CHECK (area_unit IN ('sqft', 'sqm', 'acre', 'bigha')),
  bedroom INTEGER DEFAULT 0 CHECK (bedroom >= 0),
  bathroom INTEGER DEFAULT 0 CHECK (bathroom >= 0),
  balcony INTEGER DEFAULT 0 CHECK (balcony >= 0),
  bhk INTEGER DEFAULT 0 CHECK (bhk >= 0),
  floor_no INTEGER,
  total_floors INTEGER,
  furnish_type VARCHAR(30) DEFAULT 'unfurnished' CHECK (furnish_type IN ('furnished', 'unfurnished', 'semi-furnished')),
  available_from DATE NOT NULL DEFAULT CURRENT_DATE,
  available_for JSONB DEFAULT '["Family"]'::jsonb,
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'blocked', 'sold', 'rented', 'pending_verification', 'verified', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by BIGINT REFERENCES admins(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  views_count INTEGER DEFAULT 0,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  map_location TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  canonical_url TEXT,
  schema_markup JSONB,
  -- Location fields
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  locality VARCHAR(150),
  landmark VARCHAR(255),
  zipcode VARCHAR(20),
  full_address TEXT,
  address TEXT,
  map_latitude DECIMAL(10, 6),
  map_longitude DECIMAL(10, 6),
  map_address TEXT,
  -- Legacy compatibility fields
  area_sqft DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms INTEGER,
  balconies INTEGER,
  purpose VARCHAR(50),
  furnishing VARCHAR(50),
  available_for_legacy VARCHAR(50),
  views INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



-- Property Images Table
CREATE TABLE property_images (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_type VARCHAR(20) DEFAULT 'gallery' CHECK (image_type IN ('gallery', 'floor_plan', 'featured')),
  video TEXT,
  image_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  alt_text VARCHAR(255),
  uploaded_by BIGINT REFERENCES admins(id) ON DELETE SET NULL,
  -- Legacy compatibility fields
  image_url TEXT,
  document_url TEXT,
  document_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Property Documents Table
CREATE TABLE property_documents (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  doc_type VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (doc_type IN ('ownership_deed', 'tax_receipt', 'noc', 'floor_plan', 'legal_clearance', 'rental_agreement', 'other')),
  doc_path TEXT NOT NULL,
  document_url TEXT, -- Legacy compatibility
  document_type VARCHAR(50), -- Legacy compatibility
  document_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  uploaded_by BIGINT REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Property Features Table
CREATE TABLE property_features (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100), -- Legacy compatibility
  icon VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feature_property (
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  feature_id BIGINT NOT NULL REFERENCES property_features(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, feature_id)
);

-- Property Amenities Junction Table
CREATE TABLE property_amenities (
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id BIGINT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);

-- Property visits/inquiries table for dashboard metrics
CREATE TABLE property_visits (
  id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  visitor_ip INET,
  visit_type VARCHAR(20) DEFAULT 'view' CHECK (visit_type IN ('view', 'inquiry', 'contact')),
  source VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_status ON admins(status);

CREATE INDEX idx_properties_unique_id ON properties(unique_id);
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_category_id ON properties(category_id);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_is_featured ON properties(is_featured);
CREATE INDEX idx_properties_is_verified ON properties(is_verified);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_locality ON properties(locality);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_bedroom ON properties(bedroom);
CREATE INDEX idx_properties_available_from ON properties(available_from);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_is_deleted ON properties(is_deleted);

CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_image_type ON property_images(image_type);
CREATE INDEX idx_property_images_is_primary ON property_images(is_primary);

CREATE INDEX idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX idx_property_documents_doc_type ON property_documents(doc_type);


CREATE INDEX idx_property_visits_property_id ON property_visits(property_id);
CREATE INDEX idx_property_visits_created_at ON property_visits(created_at);

CREATE INDEX idx_amenities_category ON amenities(category);
CREATE INDEX idx_amenities_is_active ON amenities(is_active);

CREATE INDEX idx_property_categories_slug ON property_categories(slug);
CREATE INDEX idx_property_categories_is_active ON property_categories(is_active);

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_categories_updated_at BEFORE UPDATE ON property_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_amenities_updated_at BEFORE UPDATE ON amenities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_images_updated_at BEFORE UPDATE ON property_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_documents_updated_at BEFORE UPDATE ON property_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_features_updated_at BEFORE UPDATE ON property_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for auto-generating unique_id and slug
CREATE TRIGGER generate_property_unique_id_trigger BEFORE INSERT ON properties FOR EACH ROW EXECUTE FUNCTION generate_property_unique_id();
CREATE TRIGGER generate_property_slug_trigger BEFORE INSERT ON properties FOR EACH ROW EXECUTE FUNCTION generate_slug();

-- Create trigger for property category slug generation
CREATE OR REPLACE FUNCTION generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_category_slug_trigger BEFORE INSERT ON property_categories FOR EACH ROW EXECUTE FUNCTION generate_category_slug();

-- Create trigger for role slug generation
CREATE OR REPLACE FUNCTION generate_role_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_role_slug_trigger BEFORE INSERT ON roles FOR EACH ROW EXECUTE FUNCTION generate_role_slug();

-- Create trigger to sync legacy fields in properties table
CREATE OR REPLACE FUNCTION sync_property_legacy_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync area fields
    IF NEW.area IS NOT NULL THEN
        NEW.area_sqft := NEW.area;
    END IF;

    -- Sync bedroom/bathroom fields
    NEW.bedrooms := NEW.bedroom;
    NEW.bathrooms := NEW.bathroom;
    NEW.balconies := NEW.balcony;

    -- Sync purpose field
    NEW.purpose := NEW.listing_type;

    -- Sync furnishing field
    NEW.furnishing := NEW.furnish_type;

    -- Sync views field
    NEW.views := NEW.views_count;

    -- Sync map coordinates
    IF NEW.latitude IS NOT NULL THEN
        NEW.map_latitude := NEW.latitude;
    END IF;

    IF NEW.longitude IS NOT NULL THEN
        NEW.map_longitude := NEW.longitude;
    END IF;

    IF NEW.map_location IS NOT NULL THEN
        NEW.map_address := NEW.map_location;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_property_legacy_fields_trigger BEFORE INSERT OR UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION sync_property_legacy_fields();

-- Create trigger to sync legacy fields in property_images table
CREATE OR REPLACE FUNCTION sync_image_legacy_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.image_url := NEW.image_path;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_image_legacy_fields_trigger BEFORE INSERT OR UPDATE ON property_images FOR EACH ROW EXECUTE FUNCTION sync_image_legacy_fields();

-- Create trigger to sync legacy fields in property_documents table
CREATE OR REPLACE FUNCTION sync_document_legacy_fields()
RETURNS TRIGGER AS $$
BEGIN
    NEW.document_url := NEW.doc_path;
    NEW.document_type := NEW.doc_type;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sync_document_legacy_fields_trigger BEFORE INSERT OR UPDATE ON property_documents FOR EACH ROW EXECUTE FUNCTION sync_document_legacy_fields();

-- Create trigger to sync legacy fields in property_features table
