const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

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
router.get('/shops/pending', ctrl.pendingShops);
router.get('/shops', ctrl.listShops);
router.get('/shops/:id/detail', ctrl.shopDetail);
router.post('/shops/:id/approve', ctrl.approveShop);
router.post('/shops/:id/reject', ctrl.rejectShop);
router.post('/shops/:id/toggle-enabled', ctrl.toggleShopEnabled);

// Medicine management
router.get('/medicines', ctrl.listMedicines);
router.post('/medicines', ctrl.createMedicine);
router.put('/medicines/:id', ctrl.updateMedicine);
router.delete('/medicines/:id', ctrl.deleteMedicine);
router.post('/medicines/:id/images', upload.array('images', 6), ctrl.uploadMedicineImages);
router.put('/medicines/:id/image-url', ctrl.setImageUrl);
router.post('/medicines/:id/substitutes', ctrl.setSubstitutes);
router.patch('/medicines/:id/stock-override', ctrl.overrideStock);

// Notification log
router.get('/notifications', ctrl.notificationLog);

module.exports = router;