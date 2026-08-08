const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// Verifies JWT and attaches req.user
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { shop: true },
    });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Only allow ADMIN role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN' || !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Only the main admin can perform this action' });
  }
  next();
}

// Only allow WHOLESALER role with an APPROVED shop
function requireApprovedWholesaler(req, res, next) {
  if (!req.user || req.user.role !== 'WHOLESALER') {
    return res.status(403).json({ error: 'Wholesaler access required' });
  }
  if (!req.user.shop || req.user.shop.approvalStatus !== 'APPROVED') {
    return res.status(403).json({
      error: 'Your shop account is not approved yet. Please wait for admin approval.',
    });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireApprovedWholesaler, requireSuperAdmin };