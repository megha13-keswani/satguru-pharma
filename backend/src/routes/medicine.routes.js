const express = require('express');
const ctrl = require('../controllers/medicine.controller');
const { requireAuth, requireApprovedWholesaler } = require('../middleware/auth');

const router = express.Router();

// Public-ish (still requires login) browsing endpoints for wholesalers
router.get('/', requireAuth, requireApprovedWholesaler, ctrl.list);
router.get('/search', requireAuth, requireApprovedWholesaler, ctrl.search);
router.get('/categories', requireAuth, requireApprovedWholesaler, ctrl.listCategories);
router.get('/reorder-suggestions', requireAuth, requireApprovedWholesaler, ctrl.reorderSuggestions);
router.get('/:id', requireAuth, requireApprovedWholesaler, ctrl.detail);
router.get('/:id/substitutes', requireAuth, requireApprovedWholesaler, ctrl.substitutes);
router.get('/:id/related', requireAuth, requireApprovedWholesaler, ctrl.related);
router.get('/:id/frequently-bought-together', requireAuth, requireApprovedWholesaler, ctrl.frequentlyBoughtTogether);

module.exports = router;