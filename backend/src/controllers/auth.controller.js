const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { notifyAdminsNewSignup } = require('../services/notification.service');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      shopName, ownerName, gstNumber, drugLicenseNumber,
      phone, email, address, password,
    } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: ownerName,
        phone,
        role: 'WHOLESALER',
        shop: {
          create: {
            shopName,
            ownerName,
            gstNumber,
            drugLicenseNumber,
            phone,
            address,
            approvalStatus: 'PENDING',
          },
        },
      },
      include: { shop: true },
    });

    notifyAdminsNewSignup(user).catch((e) => console.error('Admin notify failed:', e.message));

    res.status(201).json({
      message: 'Signup successful. Your account is pending admin approval.',
      shop: user.shop,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email }, include: { shop: true } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.role === 'WHOLESALER') {
      if (!user.shop) return res.status(403).json({ error: 'No shop profile found' });
      if (user.shop.approvalStatus === 'PENDING') {
        return res.status(403).json({ error: 'Your account is pending admin approval.' });
      }
      if (user.shop.approvalStatus === 'REJECTED') {
        return res.status(403).json({
          error: `Your registration was rejected. Reason: ${user.shop.rejectionReason || 'Not specified'}`,
        });
      }
      if (user.shop.approvalStatus === 'DISABLED') {
        return res.status(403).json({ error: 'Your account has been disabled. Contact admin.' });
      }
    }

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role, shop: user.shop,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  const { password, ...safe } = req.user;
  res.json(safe);
};