import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PropertyService {
  // ============ PROPERTY CRUD OPERATIONS ============
  static async getAllProperties(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        property_type = '',
        listing_type = '',
        status = '',
        city = '',
        min_price = '',
        max_price = '',
        bedrooms = '',
        is_featured = '',
        is_verified = '',
        owner_id = '',
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE p.is_deleted = FALSE';
      let queryParams = [];
      let paramIndex = 1;

      // Build where conditions
      if (search) {
        whereClause += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (property_type) {
        whereClause += ` AND p.property_type = $${paramIndex}`;
        queryParams.push(property_type);
        paramIndex++;
      }

      if (listing_type) {
        whereClause += ` AND p.listing_type = $${paramIndex}`;
        queryParams.push(listing_type);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND p.status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }

      if (city) {
        whereClause += ` AND p.city ILIKE $${paramIndex}`;
        queryParams.push(`%${city}%`);
        paramIndex++;
      }

      if (bedrooms) {
        whereClause += ` AND p.bedroom = $${paramIndex}`;
        queryParams.push(parseInt(bedrooms));
        paramIndex++;
      }

      if (is_featured !== '') {
        whereClause += ` AND p.is_featured = $${paramIndex}`;
        queryParams.push(is_featured === 'true');
        paramIndex++;
      }

      if (is_verified !== '') {
        whereClause += ` AND p.is_verified = $${paramIndex}`;
        queryParams.push(is_verified === 'true');
        paramIndex++;
      }

      if (owner_id) {
        whereClause += ` AND p.owner_id = $${paramIndex}`;
        queryParams.push(parseInt(owner_id));
        paramIndex++;
      }

      // Price filters
      if (min_price) {
        whereClause += ` AND (p.price >= $${paramIndex} OR p.monthly_rent >= $${paramIndex})`;
        queryParams.push(parseFloat(min_price));
        paramIndex++;
      }

      if (max_price) {
        whereClause += ` AND (p.price <= $${paramIndex} OR p.monthly_rent <= $${paramIndex})`;
        queryParams.push(parseFloat(max_price));
        paramIndex++;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) FROM properties p ${whereClause}`,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count);

      // Get properties with related data
      const propertiesResult = await query(
        `SELECT
          p.*,
          u.name as owner_name,
          u.email as owner_email,
          pc.name as category_name,
          (SELECT pi.image_path FROM property_images pi WHERE pi.property_id = p.id AND pi.is_primary = true LIMIT 1) as featured_image
         FROM properties p
         LEFT JOIN users u ON p.owner_id = u.id
         LEFT JOIN property_categories pc ON p.category_id = pc.id
         ${whereClause}
         ORDER BY p.${sort_by} ${sort_order.toUpperCase()}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        data: propertiesResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('PropertyService getAllProperties error:', error);
      throw error;
    }
  }

static async getPropertyById(id) {
  try {
    const propertyResult = await query(
      `SELECT
        p.*,
        u.name AS owner_name,
        u.email AS owner_email,
        u.phone AS owner_phone,
        pc.name AS category_name
       FROM properties p
       LEFT JOIN users u ON p.owner_id = u.id
       LEFT JOIN property_categories pc ON p.category_id = pc.id
       WHERE p.id = $1 AND p.is_deleted = FALSE`,
      [id]
    );

    if (propertyResult.rows.length === 0) {
      throw new Error('Property not found');
    }

    const property = propertyResult.rows[0];

    // Get images
    const imagesResult = await query(
      'SELECT * FROM property_images WHERE property_id = $1 ORDER BY sort_order ASC',
      [id]
    );

    // Get documents
    const documentsResult = await query(
      'SELECT * FROM property_documents WHERE property_id = $1 ORDER BY created_at DESC',
      [id]
    );

    // Get features (via pivot)
    const featuresResult = await query(
      `SELECT pf.id, pf.name, pf.icon
       FROM property_features pf
       INNER JOIN feature_property fp ON pf.id = fp.feature_id
       WHERE fp.property_id = $1`,
      [id]
    );

    // Get amenities
    const amenitiesResult = await query(
      `SELECT a.* FROM amenities a
       JOIN property_amenities pa ON a.id = pa.amenity_id
       WHERE pa.property_id = $1`,
      [id]
    );

    // Increment views count
    await query(
      'UPDATE properties SET views_count = views_count + 1 WHERE id = $1',
      [id]
    );

    return {
      ...property,
      images: imagesResult.rows,
      documents: documentsResult.rows,
      features: featuresResult.rows,
      amenities: amenitiesResult.rows
    };
  } catch (error) {
    logger.error('PropertyService getPropertyById error:', error);
    throw error;
  }
}


  static async createProperty(propertyData, files = {}) {
  const client = await query.pool?.connect() || null;

  try {
    if (client) await client.query('BEGIN');

    const {
      title,
      description,
      owner_id,
      category_id,
      property_type,
      listing_type,
      price,
      monthly_rent,
      security_deposit,
      area,
      area_unit = 'sqft',
      bedroom = 0,
      bathroom = 0,
      balcony = 0,
      bhk = 0,
      floor_no,
      total_floors,
      furnish_type = 'unfurnished',
      available_from,
      available_for = ['Family'],
      status = 'draft',
      is_featured = false,
      latitude,
      longitude,
      map_location,
      meta_title,
      meta_description,
      meta_keywords,
      canonical_url,
      // Location data
      country = 'India',
      state,
      city,
      locality,
      landmark,
      zipcode,
      full_address,
      // Features and amenities
      features = [],
      amenities = []
    } = propertyData;

    // Create property
    const propertyResult = await query(
      `INSERT INTO properties (
        title, description, owner_id, category_id, property_type, listing_type,
        price, monthly_rent, security_deposit, area, area_unit, bedroom, bathroom, balcony, bhk,
        floor_no, total_floors, furnish_type, available_from, available_for,
        status, is_featured, latitude, longitude, map_location,
        meta_title, meta_description, meta_keywords, canonical_url,
        city, state, locality, landmark, zipcode, full_address
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35
      ) RETURNING id, unique_id`,
      [
        title, description, owner_id ? parseInt(owner_id) : null, category_id ? parseInt(category_id) : null,
        property_type, listing_type, price ? parseFloat(price) : null, monthly_rent ? parseFloat(monthly_rent) : null,
        security_deposit ? parseFloat(security_deposit) : null, parseFloat(area), area_unit,
        parseInt(bedroom), parseInt(bathroom), parseInt(balcony), parseInt(bhk),
        floor_no ? parseInt(floor_no) : null, total_floors ? parseInt(total_floors) : null,
        furnish_type, available_from || new Date(), Array.isArray(available_for) ? available_for : [available_for],
        status, is_featured === 'true' || is_featured === true,
        latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null, map_location,
        meta_title, meta_description, meta_keywords, canonical_url,
        city, state, locality, landmark, zipcode, full_address
      ]
    );

    const property = propertyResult.rows[0];

    // ✅ Add features via pivot table
    if (features && features.length > 0) {
      for (const featureId of features) {
        await query(
          'INSERT INTO feature_property (property_id, feature_id) VALUES ($1, $2)',
          [property.id, parseInt(featureId)]
        );
      }
    }

    // ✅ Add amenities (same as before)
    if (amenities && amenities.length > 0) {
      for (const amenityId of amenities) {
        await query(
          'INSERT INTO property_amenities (property_id, amenity_id) VALUES ($1, $2)',
          [property.id, parseInt(amenityId)]
        );
      }
    }

    // ✅ Add images
    if (files.images && files.images.length > 0) {
      for (let i = 0; i < files.images.length; i++) {
        const file = files.images[i];
        await query(
          `INSERT INTO property_images (property_id, image_path, image_type, is_primary, sort_order, alt_text)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            property.id,
            `/uploads/properties/images/${file.filename}`,
            'gallery',
            i === 0,
            i,
            `${title} - Image ${i + 1}`
          ]
        );
      }
    }

    // ✅ Add documents
    if (files.documents && files.documents.length > 0) {
      for (const file of files.documents) {
        await query(
          `INSERT INTO property_documents (property_id, doc_path, doc_type, document_name, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            property.id,
            `/uploads/properties/documents/${file.filename}`,
            'other',
            file.originalname,
            file.size,
            file.mimetype
          ]
        );
      }
    }

    if (client) await client.query('COMMIT');

    logger.info(`Property created successfully: ${property.id}`);
    return { propertyId: property.id, unique_id: property.unique_id };
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    logger.error('PropertyService createProperty error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
}


 static async updateProperty(id, propertyData, files = {}) {
  try {
    const existingProperty = await query(
      'SELECT * FROM properties WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );

    if (existingProperty.rows.length === 0) {
      throw new Error('Property not found');
    }

    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    // Build dynamic update query
    Object.entries(propertyData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'features' && key !== 'amenities') {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);
      await query(
        `UPDATE properties SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );
    }

    // ✅ Update features (via feature_property pivot)
    if (propertyData.features !== undefined) {
      await query('DELETE FROM feature_property WHERE property_id = $1', [id]);

      if (propertyData.features.length > 0) {
        for (const featureId of propertyData.features) {
          await query(
            'INSERT INTO feature_property (property_id, feature_id) VALUES ($1, $2)',
            [id, parseInt(featureId)]
          );
        }
      }
    }

    // ✅ Update amenities
    if (propertyData.amenities !== undefined) {
      await query('DELETE FROM property_amenities WHERE property_id = $1', [id]);
      if (propertyData.amenities.length > 0) {
        for (const amenityId of propertyData.amenities) {
          await query(
            'INSERT INTO property_amenities (property_id, amenity_id) VALUES ($1, $2)',
            [id, parseInt(amenityId)]
          );
        }
      }
    }

    // ✅ Handle image uploads
    if (files.images && files.images.length > 0) {
      const existingImagesCount = await query(
        'SELECT COUNT(*) FROM property_images WHERE property_id = $1',
        [id]
      );
      const startIndex = parseInt(existingImagesCount.rows[0].count);

      for (let i = 0; i < files.images.length; i++) {
        const file = files.images[i];
        await query(
          `INSERT INTO property_images (property_id, image_path, image_type, is_primary, sort_order, alt_text)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            `/uploads/properties/images/${file.filename}`,
            'gallery',
            startIndex === 0 && i === 0,
            startIndex + i,
            `Property Image ${startIndex + i + 1}`
          ]
        );
      }
    }

    // ✅ Handle document uploads
    if (files.documents && files.documents.length > 0) {
      for (const file of files.documents) {
        await query(
          `INSERT INTO property_documents (property_id, doc_path, doc_type, document_name, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            id,
            `/uploads/properties/documents/${file.filename}`,
            'other',
            file.originalname,
            file.size,
            file.mimetype
          ]
        );
      }
    }

    logger.info(`Property updated successfully: ${id}`);
    return { success: true };
  } catch (error) {
    logger.error('PropertyService updateProperty error:', error);
    throw error;
  }
}

  static async updatePropertyStatus(id, status) {
    try {
      const result = await query(
        'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2 AND is_deleted = FALSE',
        [status, id]
      );

      if (result.rowCount === 0) {
        throw new Error('Property not found');
      }

      logger.info(`Property status updated to ${status}: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService updatePropertyStatus error:', error);
      throw error;
    }
  }

  static async deleteProperty(id) {
    try {
      const result = await query(
        'UPDATE properties SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('Property not found');
      }

      logger.info(`Property deleted successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService deleteProperty error:', error);
      throw error;
    }
  }

  static async bulkDeleteProperties(propertyIds) {
    try {
      const placeholders = propertyIds.map((_, index) => `$${index + 1}`).join(',');

      const result = await query(
        `UPDATE properties
         SET is_deleted = TRUE, updated_at = NOW()
         WHERE id IN (${placeholders}) AND is_deleted = FALSE`,
        propertyIds
      );

      logger.info(`Bulk deleted ${result.rowCount} properties`);
      return {
        deletedCount: result.rowCount,
        requestedCount: propertyIds.length
      };
    } catch (error) {
      logger.error('PropertyService bulkDeleteProperties error:', error);
      throw error;
    }
  }

  // ============ PROPERTY VERIFICATION OPERATIONS ============
  static async verifyProperty(id, adminId) {
    try {
      const result = await query(
        `UPDATE properties
         SET is_verified = TRUE, verified_by = $1, verified_at = NOW(), status = 'published', updated_at = NOW()
         WHERE id = $2 AND is_deleted = FALSE`,
        [adminId, id]
      );

      if (result.rowCount === 0) {
        throw new Error('Property not found');
      }

      logger.info(`Property verified successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService verifyProperty error:', error);
      throw error;
    }
  }

  static async rejectProperty(id, reason) {
    try {
      const result = await query(
        `UPDATE properties
         SET status = 'rejected', is_verified = FALSE, updated_at = NOW()
         WHERE id = $1 AND is_deleted = FALSE`,
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('Property not found');
      }

      logger.info(`Property rejected successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService rejectProperty error:', error);
      throw error;
    }
  }

  // ============ PROPERTY IMAGES OPERATIONS ============
  static async getPropertyImages(propertyId) {
    try {
      const result = await query(
        'SELECT * FROM property_images WHERE property_id = $1 ORDER BY sort_order ASC',
        [propertyId]
      );

      return result.rows;
    } catch (error) {
      logger.error('PropertyService getPropertyImages error:', error);
      throw error;
    }
  }

  static async uploadPropertyImages(propertyId, files, adminId) {
    try {
      const propertyCheck = await query(
        'SELECT id FROM properties WHERE id = $1 AND is_deleted = FALSE',
        [propertyId]
      );

      if (propertyCheck.rows.length === 0) {
        throw new Error('Property not found');
      }

      const existingImagesCount = await query(
        'SELECT COUNT(*) FROM property_images WHERE property_id = $1',
        [propertyId]
      );
      const startIndex = parseInt(existingImagesCount.rows[0].count);

      const uploadedImages = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await query(
          `INSERT INTO property_images (property_id, image_path, image_type, is_primary, sort_order, alt_text, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            propertyId,
            `/uploads/properties/images/${file.filename}`,
            'gallery',
            startIndex === 0 && i === 0,
            startIndex + i,
            `Property Image ${startIndex + i + 1}`,
            adminId
          ]
        );
        uploadedImages.push(result.rows[0]);
      }

      logger.info(`${uploadedImages.length} images uploaded for property: ${propertyId}`);
      return { uploadedCount: uploadedImages.length, images: uploadedImages };
    } catch (error) {
      logger.error('PropertyService uploadPropertyImages error:', error);
      throw error;
    }
  }

  static async deletePropertyImage(imageId) {
    try {
      const imageResult = await query(
        'SELECT * FROM property_images WHERE id = $1',
        [imageId]
      );

      if (imageResult.rows.length === 0) {
        throw new Error('Image not found');
      }

      const image = imageResult.rows[0];

      // Delete file from filesystem
      const imagePath = path.join(process.cwd(), 'uploads', 'properties', 'images', path.basename(image.image_path));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      await query('DELETE FROM property_images WHERE id = $1', [imageId]);

      logger.info(`Property image deleted successfully: ${imageId}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService deletePropertyImage error:', error);
      throw error;
    }
  }

  // ============ PROPERTY DOCUMENTS OPERATIONS ============
  static async getPropertyDocuments(propertyId) {
    try {
      const result = await query(
        'SELECT * FROM property_documents WHERE property_id = $1 ORDER BY created_at DESC',
        [propertyId]
      );

      return result.rows;
    } catch (error) {
      logger.error('PropertyService getPropertyDocuments error:', error);
      throw error;
    }
  }

  static async uploadPropertyDocument(propertyId, file, documentData) {
    try {
      const propertyCheck = await query(
        'SELECT id FROM properties WHERE id = $1 AND is_deleted = FALSE',
        [propertyId]
      );

      if (propertyCheck.rows.length === 0) {
        throw new Error('Property not found');
      }

      const result = await query(
        `INSERT INTO property_documents (property_id, doc_path, doc_type, document_name, file_size, mime_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          propertyId,
          `/uploads/properties/documents/${file.filename}`,
          documentData.doc_type || 'other',
          documentData.document_name || file.originalname,
          file.size,
          file.mimetype,
          documentData.uploaded_by
        ]
      );

      logger.info(`Document uploaded for property: ${propertyId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('PropertyService uploadPropertyDocument error:', error);
      throw error;
    }
  }

  static async deletePropertyDocument(docId) {
    try {
      const docResult = await query(
        'SELECT * FROM property_documents WHERE id = $1',
        [docId]
      );

      if (docResult.rows.length === 0) {
        throw new Error('Document not found');
      }

      const document = docResult.rows[0];

      // Delete file from filesystem
      const docPath = path.join(process.cwd(), 'uploads', 'properties', 'documents', path.basename(document.doc_path));
      if (fs.existsSync(docPath)) {
        fs.unlinkSync(docPath);
      }

      await query('DELETE FROM property_documents WHERE id = $1', [docId]);

      logger.info(`Property document deleted successfully: ${docId}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService deletePropertyDocument error:', error);
      throw error;
    }
  }

  // ============ PROPERTY CATEGORIES OPERATIONS ============
  static async getAllCategories() {
    try {
      const result = await query(
        'SELECT * FROM property_categories WHERE is_active = TRUE ORDER BY name ASC'
      );

      return result.rows;
    } catch (error) {
      logger.error('PropertyService getAllCategories error:', error);
      throw error;
    }
  }

  static async getCategoryById(id) {
    try {
      const result = await query(
        'SELECT * FROM property_categories WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Category not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('PropertyService getCategoryById error:', error);
      throw error;
    }
  }

  static async createCategory(categoryData) {
    try {
      const { name, slug, description, icon, is_active = true } = categoryData;

      const result = await query(
        'INSERT INTO property_categories (name, slug, description, icon, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, slug || name.toLowerCase().replace(/\s+/g, '-'), description, icon, is_active]
      );

      logger.info(`Category created successfully: ${result.rows[0].id}`);
      return { categoryId: result.rows[0].id };
    } catch (error) {
      logger.error('PropertyService createCategory error:', error);
      throw error;
    }
  }

  static async updateCategory(id, categoryData) {
    try {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      Object.entries(categoryData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const result = await query(
        `UPDATE property_categories SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );

      if (result.rowCount === 0) {
        throw new Error('Category not found');
      }

      logger.info(`Category updated successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService updateCategory error:', error);
      throw error;
    }
  }

  static async deleteCategory(id) {
    try {
      const result = await query(
        'DELETE FROM property_categories WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('Category not found');
      }

      logger.info(`Category deleted successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService deleteCategory error:', error);
      throw error;
    }
  }

  // ============ AMENITIES OPERATIONS ============
  static async getAllAmenities() {
    try {
      const result = await query(
        'SELECT * FROM amenities WHERE is_active = TRUE ORDER BY category, name ASC'
      );

      return result.rows;
    } catch (error) {
      logger.error('PropertyService getAllAmenities error:', error);
      throw error;
    }
  }

  static async getAmenityById(id) {
    try {
      const result = await query(
        'SELECT * FROM amenities WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Amenity not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('PropertyService getAmenityById error:', error);
      throw error;
    }
  }

  static async createAmenity(amenityData) {
    try {
      const { name, category = 'general', icon, is_active = true } = amenityData;

      const result = await query(
        'INSERT INTO amenities (name, category, icon, is_active) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, category, icon, is_active]
      );

      logger.info(`Amenity created successfully: ${result.rows[0].id}`);
      return { amenityId: result.rows[0].id };
    } catch (error) {
      logger.error('PropertyService createAmenity error:', error);
      throw error;
    }
  }

  static async updateAmenity(id, amenityData) {
    try {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      Object.entries(amenityData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const result = await query(
        `UPDATE amenities SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        updateValues
      );

      if (result.rowCount === 0) {
        throw new Error('Amenity not found');
      }

      logger.info(`Amenity updated successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService updateAmenity error:', error);
      throw error;
    }
  }

  static async deleteAmenity(id) {
    try {
      const result = await query(
        'DELETE FROM amenities WHERE id = $1',
        [id]
      );

      if (result.rowCount === 0) {
        throw new Error('Amenity not found');
      }

      logger.info(`Amenity deleted successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('PropertyService deleteAmenity error:', error);
      throw error;
    }
  }

  // ============ PROPERTY STATISTICS AND REPORTS ============
  static async getPropertyStats() {
    try {
      const stats = await query(`
        SELECT
          COUNT(*) as total_properties,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_properties,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_properties,
          COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_properties,
          COUNT(CASE WHEN status = 'rented' THEN 1 END) as rented_properties,
          COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_properties,
          COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_properties,
          COUNT(CASE WHEN listing_type = 'rent' THEN 1 END) as rental_properties,
          COUNT(CASE WHEN listing_type = 'sale' THEN 1 END) as sale_properties,
          AVG(CASE WHEN price IS NOT NULL THEN price END) as avg_sale_price,
          AVG(CASE WHEN monthly_rent IS NOT NULL THEN monthly_rent END) as avg_rental_price
        FROM properties
        WHERE is_deleted = FALSE
      `);

      const propertyTypes = await query(`
        SELECT
          property_type,
          COUNT(*) as count
        FROM properties
        WHERE is_deleted = FALSE
        GROUP BY property_type
        ORDER BY count DESC
      `);

      const citiesStats = await query(`
        SELECT
          city,
          COUNT(*) as property_count,
          AVG(CASE WHEN price IS NOT NULL THEN price END) as avg_price
        FROM properties
        WHERE is_deleted = FALSE AND city IS NOT NULL
        GROUP BY city
        ORDER BY property_count DESC
        LIMIT 10
      `);

      const monthlyStats = await query(`
        SELECT
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as properties_added
        FROM properties
        WHERE is_deleted = FALSE
          AND created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);

      return {
        overview: stats.rows[0],
        property_types: propertyTypes.rows,
        cities_stats: citiesStats.rows,
        monthly_stats: monthlyStats.rows
      };
    } catch (error) {
      logger.error('PropertyService getPropertyStats error:', error);
      throw error;
    }
  }

  static async getVacantProperties(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        property_type = '',
        city = ''
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = "WHERE status NOT IN ('sold', 'rented') AND is_deleted = FALSE";
      let queryParams = [];
      let paramIndex = 1;

      if (property_type) {
        whereClause += ` AND property_type = $${paramIndex}`;
        queryParams.push(property_type);
        paramIndex++;
      }

      if (city) {
        whereClause += ` AND city ILIKE $${paramIndex}`;
        queryParams.push(`%${city}%`);
        paramIndex++;
      }

      const countResult = await query(
        `SELECT COUNT(*) FROM properties ${whereClause}`,
        queryParams
      );

      const propertiesResult = await query(
        `SELECT * FROM properties ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        data: propertiesResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        }
      };
    } catch (error) {
      logger.error('PropertyService getVacantProperties error:', error);
      throw error;
    }
  }

  static async getOccupiedProperties(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        property_type = '',
        city = ''
      } = filters;

      const offset = (page - 1) * limit;
      let whereClause = "WHERE status IN ('sold', 'rented') AND is_deleted = FALSE";
      let queryParams = [];
      let paramIndex = 1;

      if (property_type) {
        whereClause += ` AND property_type = $${paramIndex}`;
        queryParams.push(property_type);
        paramIndex++;
      }

      if (city) {
        whereClause += ` AND city ILIKE $${paramIndex}`;
        queryParams.push(`%${city}%`);
        paramIndex++;
      }

      const countResult = await query(
        `SELECT COUNT(*) FROM properties ${whereClause}`,
        queryParams
      );

      const propertiesResult = await query(
        `SELECT * FROM properties ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );

      return {
        data: propertiesResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        }
      };
    } catch (error) {
      logger.error('PropertyService getOccupiedProperties error:', error);
      throw error;
    }
  }

  static async exportProperties(filters = {}) {
    try {
      let whereClause = 'WHERE is_deleted = FALSE';
      let queryParams = [];
      let paramIndex = 1;

      if (filters.property_type) {
        whereClause += ` AND property_type = $${paramIndex}`;
        queryParams.push(filters.property_type);
        paramIndex++;
      }

      if (filters.listing_type) {
        whereClause += ` AND listing_type = $${paramIndex}`;
        queryParams.push(filters.listing_type);
        paramIndex++;
      }

      if (filters.status) {
        whereClause += ` AND status = $${paramIndex}`;
        queryParams.push(filters.status);
        paramIndex++;
      }

      if (filters.city) {
        whereClause += ` AND city ILIKE $${paramIndex}`;
        queryParams.push(`%${filters.city}%`);
        paramIndex++;
      }

      if (filters.is_featured !== undefined) {
        whereClause += ` AND is_featured = $${paramIndex}`;
        queryParams.push(filters.is_featured);
        paramIndex++;
      }

      if (filters.is_verified !== undefined) {
        whereClause += ` AND is_verified = $${paramIndex}`;
        queryParams.push(filters.is_verified);
        paramIndex++;
      }

      const result = await query(
        `SELECT
          id, unique_id, title, property_type, listing_type, status, price, monthly_rent,
          area, bedroom, bathroom, city, locality, is_featured, is_verified, created_at
         FROM properties
         ${whereClause}
         ORDER BY created_at DESC`,
        queryParams
      );

      return {
        properties: result.rows,
        total: result.rows.length,
        exported_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('PropertyService exportProperties error:', error);
      throw error;
    }
  }
}