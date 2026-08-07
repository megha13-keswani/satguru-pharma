const express = require('express');
const ctrl = require('../controllers/order.controller');
const { requireAuth, requireApprovedWholesaler, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, requireApprovedWholesaler, ctrl.placeOrder);
router.get('/', requireAuth, requireApprovedWholesaler, ctrl.listMyOrders);
router.get('/:id', requireAuth, ctrl.getOrder); // wholesaler (own) or admin — checked in controller
router.get('/:id/track', requireAuth, ctrl.trackOrder);

// Admin order management
router.get('/admin/all', requireAuth, requireAdmin, ctrl.adminListAll);
router.patch('/:id/status', requireAuth, requireAdmin, ctrl.updateStatus);

module.exports = router;