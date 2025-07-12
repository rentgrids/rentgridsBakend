import { PropertyService } from '../services/PropertyService.js';
import { formatResponse } from '../utils/helpers.js';
import { validateRequest } from '../middleware/validation.js';
import { createPropertySchema, updatePropertySchema, updateStatusSchema } from '../utils/validators/propertyValidators.js';
import { verifyAdminJWT, requirePermission } from '../middleware/auth.js';
import logger from '../utils/logger.js';

export class PropertyController {
  // ============ PROPERTY CRUD OPERATIONS ============
  static getAllProperties = async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search || '',
        property_type: req.query.property_type || '',
        listing_type: req.query.listing_type || '',
        status: req.query.status || '',
        city: req.query.city || '',
        min_price: req.query.min_price || '',
        max_price: req.query.max_price || '',
        bedrooms: req.query.bedrooms || '',
        is_featured: req.query.is_featured || '',
        is_verified: req.query.is_verified || '',
        owner_id: req.query.owner_id || '',
        sort_by: req.query.sort_by || 'created_at',
        sort_order: req.query.sort_order || 'desc'
      };

      const result = await PropertyService.getAllProperties(filters);
      res.json(formatResponse(true, 'Properties retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getAllProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve properties'));
    }
  };

  static getPropertyById = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const result = await PropertyService.getPropertyById(propertyId);
      res.json(formatResponse(true, 'Property retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getPropertyById error:', error);
      if (error.message === 'Property not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to retrieve property'));
      }
    }
  };

  static createProperty = async (req, res) => {
    try {
      const propertyData = req.body;
      const files = req.files || {};

      const result = await PropertyService.createProperty(propertyData, files);
      res.status(201).json(formatResponse(true, 'Property created successfully', result));
    } catch (error) {
      logger.error('PropertyController createProperty error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static updateProperty = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const propertyData = req.body;
      const files = req.files || {};

      await PropertyService.updateProperty(propertyId, propertyData, files);
      res.json(formatResponse(true, 'Property updated successfully'));
    } catch (error) {
      logger.error('PropertyController updateProperty error:', error);
      if (error.message === 'Property not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(400).json(formatResponse(false, error.message));
      }
    }
  };

  static updatePropertyStatus = [
    validateRequest(updateStatusSchema),
    async (req, res) => {
      try {
        const propertyId = req.params.id;
        const { status } = req.body;
        await PropertyService.updatePropertyStatus(propertyId, status);
        res.json(formatResponse(true, `Property status updated to ${status}`));
      } catch (error) {
        logger.error('PropertyController updatePropertyStatus error:', error);
        if (error.message === 'Property not found') {
          res.status(404).json(formatResponse(false, error.message));
        } else {
          res.status(500).json(formatResponse(false, 'Failed to update property status'));
        }
      }
    }
  ];

  static deleteProperty = async (req, res) => {
    try {
      const propertyId = req.params.id;
      await PropertyService.deleteProperty(propertyId);
      res.json(formatResponse(true, 'Property deleted successfully'));
    } catch (error) {
      logger.error('PropertyController deleteProperty error:', error);
      if (error.message === 'Property not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to delete property'));
      }
    }
  };

  static bulkDeleteProperties = async (req, res) => {
    try {
      const { propertyIds } = req.body;

      if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
        return res.status(400).json(formatResponse(false, 'Property IDs array is required'));
      }

      const result = await PropertyService.bulkDeleteProperties(propertyIds);
      res.json(formatResponse(true, `${result.deletedCount} properties deleted successfully`, result));
    } catch (error) {
      logger.error('PropertyController bulkDeleteProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to delete properties'));
    }
  };

  // ============ PROPERTY VERIFICATION OPERATIONS ============
  static verifyProperty = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const adminId = req.admin.id;
      await PropertyService.verifyProperty(propertyId, adminId);
      res.json(formatResponse(true, 'Property verified successfully'));
    } catch (error) {
      logger.error('PropertyController verifyProperty error:', error);
      if (error.message === 'Property not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to verify property'));
      }
    }
  };

  static rejectProperty = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const { reason } = req.body;
      await PropertyService.rejectProperty(propertyId, reason);
      res.json(formatResponse(true, 'Property rejected successfully'));
    } catch (error) {
      logger.error('PropertyController rejectProperty error:', error);
      if (error.message === 'Property not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to reject property'));
      }
    }
  };

  // ============ PROPERTY IMAGES OPERATIONS ============
  static getPropertyImages = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const result = await PropertyService.getPropertyImages(propertyId);
      res.json(formatResponse(true, 'Property images retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getPropertyImages error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve property images'));
    }
  };

  static uploadPropertyImages = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const files = req.files || [];
      const adminId = req.admin?.id;

      if (!files || files.length === 0) {
        return res.status(400).json(formatResponse(false, 'No images provided'));
      }

      const result = await PropertyService.uploadPropertyImages(propertyId, files, adminId);
      res.json(formatResponse(true, 'Images uploaded successfully', result));
    } catch (error) {
      logger.error('PropertyController uploadPropertyImages error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static deletePropertyImage = async (req, res) => {
    try {
      const imageId = req.params.imageId;
      await PropertyService.deletePropertyImage(imageId);
      res.json(formatResponse(true, 'Image deleted successfully'));
    } catch (error) {
      logger.error('PropertyController deletePropertyImage error:', error);
      if (error.message === 'Image not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to delete image'));
      }
    }
  };

  // ============ PROPERTY DOCUMENTS OPERATIONS ============
  static getPropertyDocuments = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const result = await PropertyService.getPropertyDocuments(propertyId);
      res.json(formatResponse(true, 'Property documents retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getPropertyDocuments error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve property documents'));
    }
  };

  static uploadPropertyDocument = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const file = req.file;
      const { doc_type, document_name } = req.body;
      const adminId = req.admin?.id;

      if (!file) {
        return res.status(400).json(formatResponse(false, 'No document provided'));
      }

      const result = await PropertyService.uploadPropertyDocument(propertyId, file, {
        doc_type,
        document_name,
        uploaded_by: adminId
      });
      res.json(formatResponse(true, 'Document uploaded successfully', result));
    } catch (error) {
      logger.error('PropertyController uploadPropertyDocument error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static deletePropertyDocument = async (req, res) => {
    try {
      const docId = req.params.docId;
      await PropertyService.deletePropertyDocument(docId);
      res.json(formatResponse(true, 'Document deleted successfully'));
    } catch (error) {
      logger.error('PropertyController deletePropertyDocument error:', error);
      if (error.message === 'Document not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to delete document'));
      }
    }
  };

  // ============ PROPERTY CATEGORIES OPERATIONS ============
  static getAllCategories = async (req, res) => {
    try {
      const result = await PropertyService.getAllCategories();
      res.json(formatResponse(true, 'Categories retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getAllCategories error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve categories'));
    }
  };

  static getCategoryById = async (req, res) => {
    try {
      const categoryId = req.params.id;
      const result = await PropertyService.getCategoryById(categoryId);
      res.json(formatResponse(true, 'Category retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getCategoryById error:', error);
      if (error.message === 'Category not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to retrieve category'));
      }
    }
  };

  static createCategory = async (req, res) => {
    try {
      const categoryData = req.body;
      const result = await PropertyService.createCategory(categoryData);
      res.status(201).json(formatResponse(true, 'Category created successfully', result));
    } catch (error) {
      logger.error('PropertyController createCategory error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static updateCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      const categoryData = req.body;
      await PropertyService.updateCategory(categoryId, categoryData);
      res.json(formatResponse(true, 'Category updated successfully'));
    } catch (error) {
      logger.error('PropertyController updateCategory error:', error);
      if (error.message === 'Category not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(400).json(formatResponse(false, error.message));
      }
    }
  };

  static deleteCategory = async (req, res) => {
    try {
      const categoryId = req.params.id;
      await PropertyService.deleteCategory(categoryId);
      res.json(formatResponse(true, 'Category deleted successfully'));
    } catch (error) {
      logger.error('PropertyController deleteCategory error:', error);
      if (error.message === 'Category not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to delete category'));
      }
    }
  };

  // ============ AMENITIES OPERATIONS ============
  static getAllAmenities = async (req, res) => {
    try {
      const result = await PropertyService.getAllAmenities();
      res.json(formatResponse(true, 'Amenities retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getAllAmenities error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve amenities'));
    }
  };

  static getAmenityById = async (req, res) => {
    try {
      const amenityId = req.params.id;
      const result = await PropertyService.getAmenityById(amenityId);
      res.json(formatResponse(true, 'Amenity retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getAmenityById error:', error);
      if (error.message === 'Amenity not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to retrieve amenity'));
      }
    }
  };

  static createAmenity = async (req, res) => {
    try {
      const amenityData = req.body;
      const result = await PropertyService.createAmenity(amenityData);
      res.status(201).json(formatResponse(true, 'Amenity created successfully', result));
    } catch (error) {
      logger.error('PropertyController createAmenity error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static updateAmenity = async (req, res) => {
    try {
      const amenityId = req.params.id;
      const amenityData = req.body;
      await PropertyService.updateAmenity(amenityId, amenityData);
      res.json(formatResponse(true, 'Amenity updated successfully'));
    } catch (error) {
      logger.error('PropertyController updateAmenity error:', error);
      if (error.message === 'Amenity not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(400).json(formatResponse(false, error.message));
      }
    }
  };

  static deleteAmenity = async (req, res) => {
    try {
      const amenityId = req.params.id;
      await PropertyService.deleteAmenity(amenityId);
      res.json(formatResponse(true, 'Amenity deleted successfully'));
    } catch (error) {
      logger.error('PropertyController deleteAmenity error:', error);
      if (error.message === 'Amenity not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to delete amenity'));
      }
    }
  };

  // ============ PROPERTY STATISTICS AND REPORTS ============
  static getPropertyStats = async (req, res) => {
    try {
      const result = await PropertyService.getPropertyStats();
      res.json(formatResponse(true, 'Property statistics retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getPropertyStats error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve property statistics'));
    }
  };

  static getVacantProperties = async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        property_type: req.query.property_type || '',
        city: req.query.city || ''
      };

      const result = await PropertyService.getVacantProperties(filters);
      res.json(formatResponse(true, 'Vacant properties retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getVacantProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve vacant properties'));
    }
  };

  static getOccupiedProperties = async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        property_type: req.query.property_type || '',
        city: req.query.city || ''
      };

      const result = await PropertyService.getOccupiedProperties(filters);
      res.json(formatResponse(true, 'Occupied properties retrieved successfully', result));
    } catch (error) {
      logger.error('PropertyController getOccupiedProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve occupied properties'));
    }
  };

  static exportProperties = async (req, res) => {
    try {
      const filters = {
        property_type: req.query.property_type || '',
        listing_type: req.query.listing_type || '',
        status: req.query.status || '',
        city: req.query.city || '',
        is_featured: req.query.is_featured || '',
        is_verified: req.query.is_verified || ''
      };

      const result = await PropertyService.exportProperties(filters);
      res.json(formatResponse(true, 'Properties exported successfully', result));
    } catch (error) {
      logger.error('PropertyController exportProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to export properties'));
    }
  };
}