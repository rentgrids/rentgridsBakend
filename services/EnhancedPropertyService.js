import { Property, PropertyCategory, PropertyDocument, PropertyImage, PropertyLocation, PropertyFeature, Amenity, User } from '../models/sequelize/associations.js';
import { Op } from 'sequelize';
import sequelize from '../config/sequelize.js';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import FeatureProperty from '../models/sequelize/FeatureProperty.js';

export class EnhancedPropertyService {
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
      bedroom = '',
      is_featured = '',
      is_verified = '',
      owner_id = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 🔍 Text search
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // 🎯 Filters
    if (property_type) whereClause.property_type = property_type;
    if (listing_type) whereClause.listing_type = listing_type;
    if (status) whereClause.status = status;
    if (bedroom) whereClause.bedroom = parseInt(bedroom);
    if (is_featured !== '') whereClause.is_featured = is_featured === 'true';
    if (is_verified !== '') whereClause.is_verified = is_verified === 'true';
    if (owner_id) whereClause.owner_id = parseInt(owner_id);
    if (city) whereClause.city = { [Op.iLike]: `%${city}%` };

    // 💰 Price filters (monthly_rent or sale price)
    if (min_price || max_price) {
      whereClause[Op.or] = [];
      if (min_price && max_price) {
        whereClause[Op.or].push(
          { price: { [Op.between]: [parseFloat(min_price), parseFloat(max_price)] } },
          { monthly_rent: { [Op.between]: [parseFloat(min_price), parseFloat(max_price)] } }
        );
      } else if (min_price) {
        whereClause[Op.or].push(
          { price: { [Op.gte]: parseFloat(min_price) } },
          { monthly_rent: { [Op.gte]: parseFloat(min_price) } }
        );
      } else if (max_price) {
        whereClause[Op.or].push(
          { price: { [Op.lte]: parseFloat(max_price) } },
          { monthly_rent: { [Op.lte]: parseFloat(max_price) } }
        );
      }
    }

    // 🧾 Query with relations
    const { count, rows } = await Property.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PropertyCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: PropertyImage,
          as: 'images',
          where: { is_primary: true },
          required: false,
          limit: 1
        }
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('EnhancedPropertyService getAllProperties error:', error);
    throw error;
  }
}


 static async searchProperties(searchParams = {}) {
  try {
    const {
      query: searchQuery = '',
      property_type = '',
      listing_type = '',
      city = '',
      locality = '',
      min_price = '',
      max_price = '',
      bedroom = '',
      bathroom = '',
      furnish_type = '',
      amenities = [],
      page = 1,
      limit = 10,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = searchParams;

    const offset = (page - 1) * limit;
    const whereClause = { status: 'published' };

    // 🔍 Search query
    if (searchQuery) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${searchQuery}%` } },
        { description: { [Op.iLike]: `%${searchQuery}%` } }
      ];
    }

    // 🧾 Filters
    if (property_type) whereClause.property_type = property_type;
    if (listing_type) whereClause.listing_type = listing_type;
    if (bedroom) whereClause.bedroom = { [Op.gte]: parseInt(bedroom) };
    if (bathroom) whereClause.bathroom = { [Op.gte]: parseInt(bathroom) };
    if (furnish_type) whereClause.furnish_type = furnish_type;
    if (city) whereClause.city = { [Op.iLike]: `%${city}%` };
    if (locality) whereClause.locality = { [Op.iLike]: `%${locality}%` };

    // 💰 Price filters
    if (min_price || max_price) {
      const priceConditions = [];

      if (min_price && max_price) {
        priceConditions.push(
          { price: { [Op.between]: [parseFloat(min_price), parseFloat(max_price)] } },
          { monthly_rent: { [Op.between]: [parseFloat(min_price), parseFloat(max_price)] } }
        );
      } else if (min_price) {
        priceConditions.push(
          { price: { [Op.gte]: parseFloat(min_price) } },
          { monthly_rent: { [Op.gte]: parseFloat(min_price) } }
        );
      } else if (max_price) {
        priceConditions.push(
          { price: { [Op.lte]: parseFloat(max_price) } },
          { monthly_rent: { [Op.lte]: parseFloat(max_price) } }
        );
      }

      // Merge price filter with existing OR
      if (whereClause[Op.or]) {
        whereClause[Op.and] = [
          { [Op.or]: whereClause[Op.or] },
          { [Op.or]: priceConditions }
        ];
        delete whereClause[Op.or];
      } else {
        whereClause[Op.or] = priceConditions;
      }
    }

    // 📦 Include relations
    const includeOptions = [
      {
        model: PropertyCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug']
      },
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'phone']
      },
      {
        model: PropertyImage,
        as: 'images',
        limit: 3
      }
    ];

    // 🧩 Amenities filter
    if (amenities.length > 0) {
      includeOptions.push({
        model: Amenity,
        as: 'amenities',
        where: { id: { [Op.in]: amenities } },
        through: { attributes: [] }
      });
    }

    // 📊 Execute search query
    const { count, rows } = await Property.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('EnhancedPropertyService searchProperties error:', error);
    throw error;
  }
}


 static async getFeaturedProperties(filters = {}) {
  try {
    const { limit = 10, property_type = '', city = '' } = filters;

    const whereClause = {
      status: 'published',
      is_featured: true
    };

    if (property_type) {
      whereClause.property_type = property_type;
    }

    if (city) {
      whereClause.city = { [Op.iLike]: `%${city}%` };
    }

    const properties = await Property.findAll({
      where: whereClause,
      include: [
        {
          model: PropertyCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: PropertyImage,
          as: 'images',
          where: { is_primary: true },
          required: false,
          limit: 1
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    return properties;
  } catch (error) {
    logger.error('EnhancedPropertyService getFeaturedProperties error:', error);
    throw error;
  }
}


  static async getPropertyById(id, includeRelations = true) {
  try {
    const includeOptions = [];

    if (includeRelations) {
      includeOptions.push(
        {
          model: PropertyCategory,
          as: 'category'
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: PropertyImage,
          as: 'images',
          order: [['sort_order', 'ASC']]
        },
        {
          model: PropertyDocument,
          as: 'documents'
        },
        {
          model: PropertyFeature,
          as: 'features'
        },
        {
          model: Amenity,
          as: 'amenities',
          through: { attributes: [] }
        }
      );
    }

    const property = await Property.findByPk(id, {
      include: includeOptions
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Increment views count
    await property.increment('views_count');

    return property;
  } catch (error) {
    logger.error('EnhancedPropertyService getPropertyById error:', error);
    throw error;
  }
}


  static async createProperty(propertyData, files = {}) {
  const transaction = await sequelize.transaction();

  try {
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

    // Create property with all fields, including location
    const property = await Property.create({
      title,
      description,
      owner_id: owner_id ? parseInt(owner_id) : null,
      category_id: category_id ? parseInt(category_id) : null,
      property_type,
      listing_type,
      price: price ? parseFloat(price) : null,
      monthly_rent: monthly_rent ? parseFloat(monthly_rent) : null,
      security_deposit: security_deposit ? parseFloat(security_deposit) : null,
      area: parseFloat(area),
      area_unit,
      bedroom: parseInt(bedroom),
      bathroom: parseInt(bathroom),
      balcony: parseInt(balcony),
      bhk: parseInt(bhk),
      floor_no: floor_no ? parseInt(floor_no) : null,
      total_floors: total_floors ? parseInt(total_floors) : null,
      furnish_type,
      available_from: available_from || new Date(),
      available_for: Array.isArray(available_for) ? available_for : [available_for],
      status,
      is_featured: is_featured === 'true' || is_featured === true,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      map_location,
      meta_title,
      meta_description,
      meta_keywords,
      canonical_url,
      // New location fields directly in properties
      country,
      state,
      city,
      locality,
      landmark,
      zipcode,
      full_address
    }, { transaction });

    // Add features (through pivot table feature_property)
    if (features && features.length > 0) {
      const featureIds = features.map(id => parseInt(id));
      const featureData = featureIds.map(feature_id => ({
        property_id: property.id,
        feature_id
      }));
      await FeatureProperty.bulkCreate(featureData, { transaction });
    }

    // Add amenities
    if (amenities && amenities.length > 0) {
      const amenityIds = amenities.map(id => parseInt(id));
      await property.setAmenities(amenityIds, { transaction });
    }

    // Add property images
    if (files.images && files.images.length > 0) {
      const imageData = files.images.map((file, index) => ({
        property_id: property.id,
        image_path: `/uploads/properties/images/${file.filename}`,
        image_type: 'gallery',
        is_primary: index === 0,
        sort_order: index,
        alt_text: `${title} - Image ${index + 1}`
      }));
      await PropertyImage.bulkCreate(imageData, { transaction });
    }

    // Add property documents
    if (files.documents && files.documents.length > 0) {
      const documentData = files.documents.map(file => ({
        property_id: property.id,
        doc_path: `/uploads/properties/documents/${file.filename}`,
        doc_type: 'other',
        document_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype
      }));
      await PropertyDocument.bulkCreate(documentData, { transaction });
    }

    await transaction.commit();

    logger.info(`Property created successfully: ${property.id}`);
    return { propertyId: property.id, unique_id: property.unique_id };
  } catch (error) {
    await transaction.rollback();
    logger.error('EnhancedPropertyService createProperty error:', error);
    throw error;
  }
}

  static async updateProperty(id, propertyData, files = {}) {
  const transaction = await sequelize.transaction();

  try {
    const property = await Property.findByPk(id, { transaction });
    if (!property) {
      throw new Error('Property not found');
    }

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
      area_unit,
      bedroom,
      bathroom,
      balcony,
      bhk,
      floor_no,
      total_floors,
      furnish_type,
      available_from,
      available_for,
      status,
      is_featured,
      latitude,
      longitude,
      map_location,
      meta_title,
      meta_description,
      meta_keywords,
      canonical_url,
      // Location data
      country,
      state,
      city,
      locality,
      landmark,
      zipcode,
      full_address,
      // Features and amenities
      features,
      amenities
    } = propertyData;

    // Update property
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (owner_id !== undefined) updateData.owner_id = owner_id ? parseInt(owner_id) : null;
    if (category_id !== undefined) updateData.category_id = category_id ? parseInt(category_id) : null;
    if (property_type !== undefined) updateData.property_type = property_type;
    if (listing_type !== undefined) updateData.listing_type = listing_type;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (monthly_rent !== undefined) updateData.monthly_rent = monthly_rent ? parseFloat(monthly_rent) : null;
    if (security_deposit !== undefined) updateData.security_deposit = security_deposit ? parseFloat(security_deposit) : null;
    if (area !== undefined) updateData.area = parseFloat(area);
    if (area_unit !== undefined) updateData.area_unit = area_unit;
    if (bedroom !== undefined) updateData.bedroom = parseInt(bedroom);
    if (bathroom !== undefined) updateData.bathroom = parseInt(bathroom);
    if (balcony !== undefined) updateData.balcony = parseInt(balcony);
    if (bhk !== undefined) updateData.bhk = parseInt(bhk);
    if (floor_no !== undefined) updateData.floor_no = floor_no ? parseInt(floor_no) : null;
    if (total_floors !== undefined) updateData.total_floors = total_floors ? parseInt(total_floors) : null;
    if (furnish_type !== undefined) updateData.furnish_type = furnish_type;
    if (available_from !== undefined) updateData.available_from = available_from;
    if (available_for !== undefined) updateData.available_for = Array.isArray(available_for) ? available_for : [available_for];
    if (status !== undefined) updateData.status = status;
    if (is_featured !== undefined) updateData.is_featured = is_featured === 'true' || is_featured === true;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (map_location !== undefined) updateData.map_location = map_location;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;
    if (canonical_url !== undefined) updateData.canonical_url = canonical_url;

    // Location fields directly in properties table
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (locality !== undefined) updateData.locality = locality;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (zipcode !== undefined) updateData.zipcode = zipcode;
    if (full_address !== undefined) updateData.full_address = full_address;

    await property.update(updateData, { transaction });

    // Update features
    if (features !== undefined) {
      await FeatureProperty.destroy({ where: { property_id: property.id }, transaction });

      if (features.length > 0) {
        const featureIds = features.map(id => parseInt(id));
        const featureData = featureIds.map(feature_id => ({
          property_id: property.id,
          feature_id
        }));
        await FeatureProperty.bulkCreate(featureData, { transaction });
      }
    }

    // Update amenities
    if (amenities !== undefined) {
      const amenityIds = amenities.map(id => parseInt(id));
      await property.setAmenities(amenityIds, { transaction });
    }

    // Handle new images
    if (files.images && files.images.length > 0) {
      const existingImagesCount = await PropertyImage.count({ where: { property_id: property.id } });
      const imageData = files.images.map((file, index) => ({
        property_id: property.id,
        image_path: `/uploads/properties/images/${file.filename}`,
        image_type: 'gallery',
        is_primary: existingImagesCount === 0 && index === 0,
        sort_order: existingImagesCount + index,
        alt_text: `${property.title} - Image ${existingImagesCount + index + 1}`
      }));
      await PropertyImage.bulkCreate(imageData, { transaction });
    }

    // Handle new documents
    if (files.documents && files.documents.length > 0) {
      const documentData = files.documents.map(file => ({
        property_id: property.id,
        doc_path: `/uploads/properties/documents/${file.filename}`,
        doc_type: 'other',
        document_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype
      }));
      await PropertyDocument.bulkCreate(documentData, { transaction });
    }

    await transaction.commit();

    logger.info(`Property updated successfully: ${id}`);
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    logger.error('EnhancedPropertyService updateProperty error:', error);
    throw error;
  }
}


  static async updatePropertyStatus(id, status) {
    try {
      const property = await Property.findByPk(id);
      if (!property) {
        throw new Error('Property not found');
      }

      await property.update({ status });
      logger.info(`Property status updated to ${status}: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('EnhancedPropertyService updatePropertyStatus error:', error);
      throw error;
    }
  }

  static async deleteProperty(id) {
    try {
      const property = await Property.findByPk(id);
      if (!property) {
        throw new Error('Property not found');
      }

      await property.update({ status: 'blocked' });
      logger.info(`Property deleted successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('EnhancedPropertyService deleteProperty error:', error);
      throw error;
    }
  }

  static async verifyProperty(id, adminId) {
    try {
      const property = await Property.findByPk(id);
      if (!property) {
        throw new Error('Property not found');
      }

      await property.update({
        is_verified: true,
        verified_by: adminId,
        verified_at: new Date(),
        status: 'published'
      });

      logger.info(`Property verified successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('EnhancedPropertyService verifyProperty error:', error);
      throw error;
    }
  }

  static async rejectProperty(id, reason) {
    try {
      const property = await Property.findByPk(id);
      if (!property) {
        throw new Error('Property not found');
      }

      await property.update({
        status: 'rejected',
        is_verified: false
      });

      logger.info(`Property rejected successfully: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('EnhancedPropertyService rejectProperty error:', error);
      throw error;
    }
  }

  // ============ PROPERTY IMAGES OPERATIONS ============
  static async getPropertyImages(propertyId) {
    try {
      const images = await PropertyImage.findAll({
        where: { property_id: propertyId },
        order: [['sort_order', 'ASC']]
      });

      return images;
    } catch (error) {
      logger.error('EnhancedPropertyService getPropertyImages error:', error);
      throw error;
    }
  }

  static async uploadPropertyImages(propertyId, files, adminId) {
    try {
      const property = await Property.findByPk(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      const existingImagesCount = await PropertyImage.count({ where: { property_id: propertyId } });

      const imageData = files.map((file, index) => ({
        property_id: propertyId,
        image_path: `/uploads/properties/images/${file.filename}`,
        image_type: 'gallery',
        is_primary: existingImagesCount === 0 && index === 0,
        sort_order: existingImagesCount + index,
        alt_text: `${property.title} - Image ${existingImagesCount + index + 1}`,
        uploaded_by: adminId
      }));

      const images = await PropertyImage.bulkCreate(imageData);
      logger.info(`${images.length} images uploaded for property: ${propertyId}`);

      return { uploadedCount: images.length, images };
    } catch (error) {
      logger.error('EnhancedPropertyService uploadPropertyImages error:', error);
      throw error;
    }
  }

  static async deletePropertyImage(imageId) {
    try {
      const image = await PropertyImage.findByPk(imageId);
      if (!image) {
        throw new Error('Image not found');
      }

      // Delete file from filesystem
      const imagePath = path.join(process.cwd(), 'uploads', 'properties', 'images', path.basename(image.image_path));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      await image.destroy();
      logger.info(`Property image deleted successfully: ${imageId}`);
      return { success: true };
    } catch (error) {
      logger.error('EnhancedPropertyService deletePropertyImage error:', error);
      throw error;
    }
  }

  // ============ PROPERTY DOCUMENTS OPERATIONS ============
  static async getPropertyDocuments(propertyId) {
    try {
      const documents = await PropertyDocument.findAll({
        where: { property_id: propertyId },
        order: [['created_at', 'DESC']]
      });

      return documents;
    } catch (error) {
      logger.error('EnhancedPropertyService getPropertyDocuments error:', error);
      throw error;
    }
  }

  static async uploadPropertyDocument(propertyId, file, documentData) {
    try {
      const property = await Property.findByPk(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      const document = await PropertyDocument.create({
        property_id: propertyId,
        doc_path: `/uploads/properties/documents/${file.filename}`,
        doc_type: documentData.doc_type || 'other',
        document_name: documentData.document_name || file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: documentData.uploaded_by
      });

      logger.info(`Document uploaded for property: ${propertyId}`);
      return document;
    } catch (error) {
      logger.error('EnhancedPropertyService uploadPropertyDocument error:', error);
      throw error;
    }
  }

  static async deletePropertyDocument(docId) {
    try {
      const document = await PropertyDocument.findByPk(docId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Delete file from filesystem
      const docPath = path.join(process.cwd(), 'uploads', 'properties', 'documents', path.basename(document.doc_path));
      if (fs.existsSync(docPath)) {
        fs.unlinkSync(docPath);
      }

      await document.destroy();
      logger.info(`Property document deleted successfully: ${docId}`);
      return { success: true };
    } catch (error) {
      logger.error('EnhancedPropertyService deletePropertyDocument error:', error);
      throw error;
    }
  }

  // ============ OWNER-SPECIFIC OPERATIONS ============
 static async getOwnerProperties(ownerId, filters = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      status = '',
      property_type = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    const offset = (page - 1) * limit;
    const whereClause = { owner_id: parseInt(ownerId) };

    if (status) whereClause.status = status;
    if (property_type) whereClause.property_type = property_type;

    const { count, rows } = await Property.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PropertyCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: PropertyImage,
          as: 'images',
          where: { is_primary: true },
          required: false,
          limit: 1
        }
      ],
      order: [[sort_by, sort_order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('EnhancedPropertyService getOwnerProperties error:', error);
    throw error;
  }
}


  // ============ PROPERTY STATISTICS ============
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
      WHERE status != 'blocked'
    `);

    const propertyTypes = await query(`
      SELECT
        property_type,
        COUNT(*) as count
      FROM properties
      WHERE status != 'blocked'
      GROUP BY property_type
      ORDER BY count DESC
    `);

    const citiesStats = await query(`
      SELECT
        city,
        COUNT(*) as property_count,
        AVG(CASE WHEN price IS NOT NULL THEN price END) as avg_price
      FROM properties
      WHERE status != 'blocked' AND city IS NOT NULL
      GROUP BY city
      ORDER BY property_count DESC
      LIMIT 10
    `);

    const monthlyStats = await query(`
      SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as properties_added
      FROM properties
      WHERE status != 'blocked'
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
    logger.error('EnhancedPropertyService getPropertyStats error:', error);
    throw error;
  }
}

}