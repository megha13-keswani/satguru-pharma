const express = require('express');
const ctrl = require('../controllers/cart.controller');
const { requireAuth, requireApprovedWholesaler } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireApprovedWholesaler);

router.get('/', ctrl.getCart);
router.post('/items', ctrl.addItem);
router.patch('/items/:medicineId', ctrl.updateItem);
router.delete('/items/:medicineId', ctrl.removeItem);
router.post('/save-draft', ctrl.saveDraft);

module.exports = router;