import express from 'express';
import { EnhancedPropertyController } from '../controllers/EnhancedPropertyController.js';
import { verifyAdminJWT, requirePermission } from '../middleware/auth.js';
import { uploadPropertyData, uploadPropertyImages, uploadPropertyDocuments } from '../middleware/upload.js';

const router = express.Router();

// ============ ENHANCED PROPERTY ROUTES (Using Sequelize) ============
router.get('/', EnhancedPropertyController.getAllProperties);
router.get('/search', EnhancedPropertyController.searchProperties);
router.get('/featured', EnhancedPropertyController.getFeaturedProperties);
router.get('/stats', verifyAdminJWT, requirePermission('property', 'view'), EnhancedPropertyController.getPropertyStats);
router.get('/:id', EnhancedPropertyController.getPropertyById);
router.post('/', verifyAdminJWT, requirePermission('property', 'create'), uploadPropertyData, EnhancedPropertyController.createProperty);
router.put('/:id', verifyAdminJWT, requirePermission('property', 'edit'), uploadPropertyData, EnhancedPropertyController.updateProperty);
router.patch('/:id/status', verifyAdminJWT, requirePermission('property', 'edit'), EnhancedPropertyController.updatePropertyStatus);
router.delete('/:id', verifyAdminJWT, requirePermission('property', 'delete'), EnhancedPropertyController.deleteProperty);

// ============ PROPERTY VERIFICATION ROUTES ============
router.post('/:id/verify', verifyAdminJWT, requirePermission('property', 'verify'), EnhancedPropertyController.verifyProperty);
router.post('/:id/reject', verifyAdminJWT, requirePermission('property', 'verify'), EnhancedPropertyController.rejectProperty);

// ============ PROPERTY IMAGES ROUTES ============
router.get('/:id/images', EnhancedPropertyController.getPropertyImages);
router.post('/:id/images', verifyAdminJWT, requirePermission('property', 'edit'), uploadPropertyImages, EnhancedPropertyController.uploadPropertyImages);
router.delete('/images/:imageId', verifyAdminJWT, requirePermission('property', 'edit'), EnhancedPropertyController.deletePropertyImage);

// ============ PROPERTY DOCUMENTS ROUTES ============
router.get('/:id/documents', EnhancedPropertyController.getPropertyDocuments);
router.post('/:id/documents', verifyAdminJWT, requirePermission('property', 'edit'), uploadPropertyDocuments, EnhancedPropertyController.uploadPropertyDocument);
router.delete('/documents/:docId', verifyAdminJWT, requirePermission('property', 'edit'), EnhancedPropertyController.deletePropertyDocument);

export default router;