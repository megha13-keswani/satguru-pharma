const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

router.post(
  '/signup',
  authLimiter,
  [
    body('shopName').notEmpty(),
    body('ownerName').notEmpty(),
    body('gstNumber').matches(/^[0-9A-Z]{15}$/).withMessage('Invalid GST number format'),
    body('drugLicenseNumber').notEmpty(),
    body('phone').isMobilePhone('any'),
    body('email').isEmail(),
    body('address').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  ctrl.signup
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail(), body('password').notEmpty()],
  ctrl.login
);

router.get('/me', requireAuth, ctrl.me);

module.exports = router;