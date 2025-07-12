import { EnhancedPropertyService } from '../services/EnhancedPropertyService.js';
import { formatResponse } from '../utils/helpers.js';
import { validateRequest } from '../middleware/validation.js';
import { createPropertySchema, updatePropertySchema, updateStatusSchema } from '../utils/validators/propertyValidators.js';
import logger from '../utils/logger.js';

export class EnhancedPropertyController {
  // ============ ENHANCED PROPERTY OPERATIONS (Using Sequelize) ============
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
        bedroom: req.query.bedroom || '',
        is_featured: req.query.is_featured || '',
        is_verified: req.query.is_verified || '',
        owner_id: req.query.owner_id || '',
        sort_by: req.query.sort_by || 'created_at',
        sort_order: req.query.sort_order || 'desc'
      };
      
      const result = await EnhancedPropertyService.getAllProperties(filters);
      res.json(formatResponse(true, 'Properties retrieved successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController getAllProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve properties'));
    }
  };

  static searchProperties = async (req, res) => {
    try {
      const searchParams = {
        query: req.query.q || '',
        property_type: req.query.property_type || '',
        listing_type: req.query.listing_type || '',
        city: req.query.city || '',
        locality: req.query.locality || '',
        min_price: req.query.min_price || '',
        max_price: req.query.max_price || '',
        bedroom: req.query.bedroom || '',
        bathroom: req.query.bathroom || '',
        furnish_type: req.query.furnish_type || '',
        amenities: req.query.amenities ? req.query.amenities.split(',') : [],
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort_by: req.query.sort_by || 'created_at',
        sort_order: req.query.sort_order || 'desc'
      };
      
      const result = await EnhancedPropertyService.searchProperties(searchParams);
      res.json(formatResponse(true, 'Properties search completed successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController searchProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to search properties'));
    }
  };

  static getFeaturedProperties = async (req, res) => {
    try {
      const filters = {
        limit: parseInt(req.query.limit) || 10,
        property_type: req.query.property_type || '',
        city: req.query.city || ''
      };
      
      const result = await EnhancedPropertyService.getFeaturedProperties(filters);
      res.json(formatResponse(true, 'Featured properties retrieved successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController getFeaturedProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve featured properties'));
    }
  };

  static getPropertyById = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const includeRelations = req.query.include === 'true';
      
      const result = await EnhancedPropertyService.getPropertyById(propertyId, includeRelations);
      res.json(formatResponse(true, 'Property retrieved successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController getPropertyById error:', error);
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
      
      const result = await EnhancedPropertyService.createProperty(propertyData, files);
      res.status(201).json(formatResponse(true, 'Property created successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController createProperty error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static updateProperty = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const propertyData = req.body;
      const files = req.files || {};
      
      await EnhancedPropertyService.updateProperty(propertyId, propertyData, files);
      res.json(formatResponse(true, 'Property updated successfully'));
    } catch (error) {
      logger.error('EnhancedPropertyController updateProperty error:', error);
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
        await EnhancedPropertyService.updatePropertyStatus(propertyId, status);
        res.json(formatResponse(true, `Property status updated to ${status}`));
      } catch (error) {
        logger.error('EnhancedPropertyController updatePropertyStatus error:', error);
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
      await EnhancedPropertyService.deleteProperty(propertyId);
      res.json(formatResponse(true, 'Property deleted successfully'));
    } catch (error) {
      logger.error('EnhancedPropertyController deleteProperty error:', error);
      if (error.message === 'Property not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to delete property'));
      }
    }
  };

  // ============ PROPERTY VERIFICATION OPERATIONS ============
  static verifyProperty = async (req, res) => {
    try {
      const propertyId = req.params.id;
      const adminId = req.admin.id;
      await EnhancedPropertyService.verifyProperty(propertyId, adminId);
      res.json(formatResponse(true, 'Property verified successfully'));
    } catch (error) {
      logger.error('EnhancedPropertyController verifyProperty error:', error);
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
      await EnhancedPropertyService.rejectProperty(propertyId, reason);
      res.json(formatResponse(true, 'Property rejected successfully'));
    } catch (error) {
      logger.error('EnhancedPropertyController rejectProperty error:', error);
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
      const result = await EnhancedPropertyService.getPropertyImages(propertyId);
      res.json(formatResponse(true, 'Property images retrieved successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController getPropertyImages error:', error);
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

      const result = await EnhancedPropertyService.uploadPropertyImages(propertyId, files, adminId);
      res.json(formatResponse(true, 'Images uploaded successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController uploadPropertyImages error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static deletePropertyImage = async (req, res) => {
    try {
      const imageId = req.params.imageId;
      await EnhancedPropertyService.deletePropertyImage(imageId);
      res.json(formatResponse(true, 'Image deleted successfully'));
    } catch (error) {
      logger.error('EnhancedPropertyController deletePropertyImage error:', error);
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
      const result = await EnhancedPropertyService.getPropertyDocuments(propertyId);
      res.json(formatResponse(true, 'Property documents retrieved successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController getPropertyDocuments error:', error);
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

      const result = await EnhancedPropertyService.uploadPropertyDocument(propertyId, file, {
        doc_type,
        document_name,
        uploaded_by: adminId
      });
      res.json(formatResponse(true, 'Document uploaded successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController uploadPropertyDocument error:', error);
      res.status(400).json(formatResponse(false, error.message));
    }
  };

  static deletePropertyDocument = async (req, res) => {
    try {
      const docId = req.params.docId;
      await EnhancedPropertyService.deletePropertyDocument(docId);
      res.json(formatResponse(true, 'Document deleted successfully'));
    } catch (error) {
      logger.error('EnhancedPropertyController deletePropertyDocument error:', error);
      if (error.message === 'Document not found') {
        res.status(404).json(formatResponse(false, error.message));
      } else {
        res.status(500).json(formatResponse(false, 'Failed to delete document'));
      }
    }
  };

  // ============ OWNER-SPECIFIC OPERATIONS ============
  static getOwnerProperties = async (req, res) => {
    try {
      const ownerId = req.params.ownerId;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status || '',
        property_type: req.query.property_type || '',
        sort_by: req.query.sort_by || 'created_at',
        sort_order: req.query.sort_order || 'desc'
      };
      
      const result = await EnhancedPropertyService.getOwnerProperties(ownerId, filters);
      res.json(formatResponse(true, 'Owner properties retrieved successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController getOwnerProperties error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve owner properties'));
    }
  };

  // ============ PROPERTY STATISTICS ============
  static getPropertyStats = async (req, res) => {
    try {
      const result = await EnhancedPropertyService.getPropertyStats();
      res.json(formatResponse(true, 'Property statistics retrieved successfully', result));
    } catch (error) {
      logger.error('EnhancedPropertyController getPropertyStats error:', error);
      res.status(500).json(formatResponse(false, 'Failed to retrieve property statistics'));
    }
  };
}