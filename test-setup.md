# Sunrise Admin & Property Management System - Test Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=sunrise_admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1d

# Email Configuration (Optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@sunrise.com

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Database Setup & Seeding

#### Option 1: Complete Setup (Recommended)
```bash
# Setup database schema
npm run setup

# Seed with sample data
npm run seed

# Add additional property data
npm run seed-property
```

#### Option 2: Individual Steps
```bash
# 1. Create database schema
npm run setup

# 2. Seed basic data (admins, users, roles, permissions)
npm run seed

# 3. Add more property management data
npm run seed-property

# 4. Run migration (if needed)
npm run migrate-property
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Test Data Overview

After running the seeders, you'll have:

### Admin Accounts
- **Super Admin**: admin@sunrise.com / admin123
- **Property Manager**: property@sunrise.com / admin123
- **User Manager**: users@sunrise.com / admin123
- **Content Manager**: content@sunrise.com / admin123

### Sample Users
- **John Doe** (Landlord): john@example.com / admin123
- **Jane Smith** (Tenant): jane@example.com / admin123
- **Mike Johnson** (Owner): mike@example.com / admin123
- **Sarah Wilson** (Landlord): sarah@example.com / admin123
- **David Brown** (Tenant): david@example.com / admin123

### Property Data
- **11 Sample Properties** with complete details
- **9 Property Categories** (Residential, Commercial, etc.)
- **37 Amenities** across different categories
- **Property Images & Documents** (sample file paths)
- **Location Data** for all properties
- **Features & Amenities** mapping

### Role-Based Access Control
- **5 Roles** with specific permissions
- **24 Permissions** across different modules
- Complete admin-role-permission mapping

## API Testing with Postman

### 1. Import Collection
1. Open Postman
2. Click "Import"
3. Select the `postman_collection.json` file
4. The collection will be imported with all endpoints

### 2. Set Base URL
- The collection uses `{{base_url}}` variable
- Default: `http://localhost:3000`
- Update in collection variables if needed

### 3. Authentication Flow
1. **Login**: Use "Admin Login" request
   - Email: admin@sunrise.com
   - Password: admin123
   - Token will be automatically saved to collection variables

2. **Test Protected Routes**: All other requests will use the saved token

### 4. File Upload Testing
The collection includes form-data examples for:
- **Property Creation** with images and documents
- **Image Upload** for existing properties
- **Document Upload** for properties

## API Endpoints Overview

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Dashboard
- `GET /api/admin/dashboard/metrics/*` - Various metrics
- `GET /api/admin/dashboard/charts/*` - Chart data
- `GET /api/admin/dashboard/recent/*` - Recent activities

### User Management
- `GET /api/admin/users` - List users with filters
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/status` - Update status
- `PATCH /api/admin/users/:id/block` - Block/unblock user

### Admin Management
- `GET /api/admin/admins` - List admins
- `POST /api/admin/admins` - Create admin
- `GET /api/admin/roles` - List roles
- `GET /api/admin/permissions` - List permissions

### Enhanced Properties (Sequelize)
- `GET /api/properties` - List properties with advanced filters
- `GET /api/properties/search` - Advanced property search
- `GET /api/properties/featured` - Featured properties
- `POST /api/properties` - Create property (form-data)
- `PUT /api/properties/:id` - Update property
- `POST /api/properties/:id/verify` - Verify property
- `GET /api/properties/:id/images` - Property images
- `POST /api/properties/:id/images` - Upload images
- `GET /api/properties/:id/documents` - Property documents
- `POST /api/properties/:id/documents` - Upload documents

### Owner Properties
- `GET /api/owners/:id/properties` - Get properties by owner

## Testing Scenarios

### 1. Basic Authentication
```bash
# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sunrise.com","password":"admin123"}'
```

### 2. Property Search
```bash
# Search properties in Mumbai
curl "http://localhost:3000/api/properties/search?city=Mumbai&property_type=apartment" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. File Upload (using curl)
```bash
# Upload property images
curl -X POST http://localhost:3000/api/properties/1/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

## Database Verification

### Check Data
```sql
-- Check admin accounts
SELECT name, email, is_super_admin FROM admins;

-- Check properties
SELECT title, property_type, listing_type, status, city FROM properties LIMIT 5;

-- Check users
SELECT name, email, user_type, status FROM users LIMIT 5;

-- Check roles and permissions
SELECT r.name as role, p.name as permission, p.module, p.action 
FROM roles r 
JOIN permission_role pr ON r.id = pr.role_id 
JOIN permissions p ON pr.permission_id = p.id 
LIMIT 10;
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Permission Denied Errors**
   - Make sure you're logged in (check Authorization header)
   - Verify admin has required permissions

3. **File Upload Issues**
   - Check `uploads` directory exists and is writable
   - Verify file size limits in middleware

4. **Sequelize Errors**
   - Run `npm run migrate-property` to ensure schema is up to date
   - Check model associations in `models/sequelize/associations.js`

### Logs
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Console output in development mode

## Performance Testing

### Load Testing with Artillery
```bash
# Install artillery
npm install -g artillery

# Create test config
echo '
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Property Search"
    requests:
      - get:
          url: "/api/properties/search?city=Mumbai"
          headers:
            Authorization: "Bearer YOUR_TOKEN"
' > load-test.yml

# Run test
artillery run load-test.yml
```

## Next Steps

1. **Frontend Integration**: Use the API endpoints to build your frontend
2. **Custom Endpoints**: Add more specific endpoints as needed
3. **Monitoring**: Set up monitoring for production deployment
4. **Caching**: Implement Redis caching for better performance
5. **Documentation**: Generate API documentation using tools like Swagger

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Verify database connection and data
3. Test with Postman collection
4. Review the API responses for error details