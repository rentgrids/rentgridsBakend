import express from 'express';
import { PropertyController } from '../controllers/PropertyController.js';
import { verifyAdminJWT, requirePermission } from '../middleware/auth.js';
import { uploadPropertyData, uploadPropertyImages, uploadPropertyDocuments } from '../middleware/upload.js';

const router = express.Router();

// ============ PROPERTY CRUD ROUTES ============
router.get('/', PropertyController.getAllProperties);
router.get('/stats', verifyAdminJWT, requirePermission('property', 'view'), PropertyController.getPropertyStats);
router.get('/export', verifyAdminJWT, requirePermission('property', 'view'), PropertyController.exportProperties);
router.get('/vacancies', verifyAdminJWT, requirePermission('property', 'view'), PropertyController.getVacantProperties);
router.get('/occupancy', verifyAdminJWT, requirePermission('property', 'view'), PropertyController.getOccupiedProperties);
router.get('/:id', PropertyController.getPropertyById);
router.post('/', verifyAdminJWT, requirePermission('property', 'create'), uploadPropertyData, PropertyController.createProperty);
router.put('/:id', verifyAdminJWT, requirePermission('property', 'edit'), uploadPropertyData, PropertyController.updateProperty);
router.patch('/:id/status', verifyAdminJWT, requirePermission('property', 'edit'), PropertyController.updatePropertyStatus);
router.delete('/:id', verifyAdminJWT, requirePermission('property', 'delete'), PropertyController.deleteProperty);
router.post('/bulk-delete', verifyAdminJWT, requirePermission('property', 'delete'), PropertyController.bulkDeleteProperties);

// ============ PROPERTY VERIFICATION ROUTES ============
router.post('/:id/verify', verifyAdminJWT, requirePermission('property', 'verify'), PropertyController.verifyProperty);
router.post('/:id/reject', verifyAdminJWT, requirePermission('property', 'verify'), PropertyController.rejectProperty);

// ============ PROPERTY IMAGES ROUTES ============
router.get('/:id/images', PropertyController.getPropertyImages);
router.post('/:id/images', verifyAdminJWT, requirePermission('property', 'edit'), uploadPropertyImages, PropertyController.uploadPropertyImages);
router.delete('/images/:imageId', verifyAdminJWT, requirePermission('property', 'edit'), PropertyController.deletePropertyImage);

// ============ PROPERTY DOCUMENTS ROUTES ============
router.get('/:id/documents', PropertyController.getPropertyDocuments);
router.post('/:id/documents', verifyAdminJWT, requirePermission('property', 'edit'), uploadPropertyDocuments, PropertyController.uploadPropertyDocument);
router.delete('/documents/:docId', verifyAdminJWT, requirePermission('property', 'edit'), PropertyController.deletePropertyDocument);

// ============ PROPERTY CATEGORIES ROUTES ============
router.get('/categories/list', PropertyController.getAllCategories);
router.post('/categories', verifyAdminJWT, requirePermission('category', 'create'), PropertyController.createCategory);
router.get('/categories/:id', PropertyController.getCategoryById);
router.put('/categories/:id', verifyAdminJWT, requirePermission('category', 'edit'), PropertyController.updateCategory);
router.delete('/categories/:id', verifyAdminJWT, requirePermission('category', 'delete'), PropertyController.deleteCategory);

// ============ AMENITIES ROUTES ============
router.get('/amenities/list', PropertyController.getAllAmenities);
router.post('/amenities', verifyAdminJWT, requirePermission('category', 'create'), PropertyController.createAmenity);
router.get('/amenities/:id', PropertyController.getAmenityById);
router.put('/amenities/:id', verifyAdminJWT, requirePermission('category', 'edit'), PropertyController.updateAmenity);
router.delete('/amenities/:id', verifyAdminJWT, requirePermission('category', 'delete'), PropertyController.deleteAmenity);

export default router;