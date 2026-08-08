const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

const uploadDir = path.join(__dirname, '../../uploads/medicines');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Dashboard
router.get('/dashboard', ctrl.dashboard);

// Shop approvals
router.get('/shops/pending', requireSuperAdmin, ctrl.pendingShops);
router.get('/shops', requireSuperAdmin, ctrl.listShops);
router.get('/shops/:id/detail', requireSuperAdmin, ctrl.shopDetail);
router.post('/shops/:id/approve', requireSuperAdmin, ctrl.approveShop);
router.post('/shops/:id/reject', requireSuperAdmin, ctrl.rejectShop);
router.post('/shops/:id/toggle-enabled', requireSuperAdmin, ctrl.toggleShopEnabled);

// Medicine management
router.get('/medicines', requireSuperAdmin, ctrl.listMedicines);
router.post('/medicines', requireSuperAdmin, ctrl.createMedicine);
router.put('/medicines/:id', requireSuperAdmin, ctrl.updateMedicine);
router.delete('/medicines/:id', requireSuperAdmin, ctrl.deleteMedicine);
router.post('/medicines/:id/images', requireSuperAdmin, upload.array('images', 6), ctrl.uploadMedicineImages);
router.post('/medicines/:id/substitutes', requireSuperAdmin, ctrl.setSubstitutes);
router.patch('/medicines/:id/stock-override', requireSuperAdmin, ctrl.overrideStock);
router.put('/medicines/:id/image-url', requireSuperAdmin, ctrl.setImageUrl);
router.get('/orders-matrix', requireSuperAdmin, ctrl.ordersMatrix);
router.get('/revenue-by-date', requireSuperAdmin, ctrl.revenueByDate);
router.get('/revenue-by-date/:date', requireSuperAdmin, ctrl.revenueByDateDetail);

// Notification log
router.get('/notifications', ctrl.notificationLog);

module.exports = router;