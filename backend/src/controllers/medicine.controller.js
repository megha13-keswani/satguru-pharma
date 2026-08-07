const prisma = require('../lib/prisma');

function computeStockStatus(stockStrips, threshold) {
  if (stockStrips <= 0) return 'OUT_OF_STOCK';
  if (stockStrips < threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

// GET /api/medicines  (filters: category, brand, composition, minPrice, maxPrice, stock, prescription)
exports.list = async (req, res, next) => {
  try {
    const {
      category, brand, composition, minPrice, maxPrice,
      stock, prescriptionRequired, page = 1, pageSize = 24,
    } = req.query;

    const where = { active: true };
    if (category) where.categoryId = category;
    if (brand) where.brand = { equals: brand, mode: 'insensitive' };
    if (composition) where.composition = { contains: composition, mode: 'insensitive' };
    if (prescriptionRequired !== undefined) where.prescriptionRequired = prescriptionRequired === 'true';
    if (minPrice || maxPrice) {
      where.wholesalePrice = {};
      if (minPrice) where.wholesalePrice.gte = Number(minPrice);
      if (maxPrice) where.wholesalePrice.lte = Number(maxPrice);
    }
    if (stock === 'IN_STOCK') where.stockStrips = { gte: 1 };
    if (stock === 'OUT_OF_STOCK') where.stockStrips = { lte: 0 };

    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      prisma.medicine.findMany({
        where, skip, take: Number(pageSize),
        include: { images: true, category: true },
        orderBy: { name: 'asc' },
      }),
      prisma.medicine.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) { next(err); }
};

// GET /api/medicines/search?q=
exports.search = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ items: [] });

    const items = await prisma.medicine.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { composition: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: { images: true, category: true },
      take: 30,
    });

    res.json({ items });
  } catch (err) { next(err); }
};

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json({ categories });
  } catch (err) { next(err); }
};

exports.detail = async (req, res, next) => {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id: req.params.id },
      include: { images: true, category: true },
    });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ medicine });
  } catch (err) { next(err); }
};

// Same-salt alternatives, ranked by price
exports.substitutes = async (req, res, next) => {
  try {
    const links = await prisma.substitute.findMany({
      where: { medicineId: req.params.id },
      include: { substituteMedicine: { include: { images: true } } },
    });
    const items = links
      .map((l) => l.substituteMedicine)
      .filter((m) => m.active)
      .sort((a, b) => a.wholesalePrice - b.wholesalePrice);
    res.json({ items });
  } catch (err) { next(err); }
};

exports.related = async (req, res, next) => {
  try {
    const medicine = await prisma.medicine.findUnique({ where: { id: req.params.id } });
    if (!medicine) return res.status(404).json({ error: 'Medicine not found' });

    const items = await prisma.medicine.findMany({
      where: {
        active: true,
        id: { not: medicine.id },
        OR: [{ brand: medicine.brand }, { categoryId: medicine.categoryId }],
      },
      include: { images: true },
      take: 12,
    });
    res.json({ items });
  } catch (err) { next(err); }
};

// Items commonly appearing in the same order as this medicine
exports.frequentlyBoughtTogether = async (req, res, next) => {
  try {
    const medicineId = req.params.id;
    const orderItems = await prisma.orderItem.findMany({
      where: { medicineId },
      select: { orderId: true },
    });
    const orderIds = orderItems.map((o) => o.orderId);
    if (orderIds.length === 0) return res.json({ items: [] });

    const companions = await prisma.orderItem.groupBy({
      by: ['medicineId'],
      where: { orderId: { in: orderIds }, medicineId: { not: medicineId } },
      _count: { medicineId: true },
      orderBy: { _count: { medicineId: 'desc' } },
      take: 6,
    });

    const medicines = await prisma.medicine.findMany({
      where: { id: { in: companions.map((c) => c.medicineId) } },
      include: { images: true },
    });
    res.json({ items: medicines });
  } catch (err) { next(err); }
};

// "Reorder suggestions": medicines from shop's last order, ranked by order frequency,
// with substitutes surfaced for anything now out of stock.
exports.reorderSuggestions = async (req, res, next) => {
  try {
    const shopId = req.user.shop.id;

    const lastOrder = await prisma.order.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { medicine: { include: { images: true } } } } },
    });

    if (!lastOrder) return res.json({ items: [] });

    // frequency across all past orders for this shop
    const freq = await prisma.orderItem.groupBy({
      by: ['medicineId'],
      where: { order: { shopId } },
      _count: { medicineId: true },
    });
    const freqMap = Object.fromEntries(freq.map((f) => [f.medicineId, f._count.medicineId]));

    const items = await Promise.all(
      lastOrder.items
        .sort((a, b) => (freqMap[b.medicineId] || 0) - (freqMap[a.medicineId] || 0))
        .slice(0, 5)
        .map(async (item) => {
          let substitutes = [];
          if (item.medicine.stockStrips <= 0) {
            const links = await prisma.substitute.findMany({
              where: { medicineId: item.medicineId },
              include: { substituteMedicine: true },
            });
            substitutes = links.map((l) => l.substituteMedicine).filter((m) => m.stockStrips > 0);
          }
          return {
            medicine: item.medicine,
            orderFrequency: freqMap[item.medicineId] || 1,
            inStock: item.medicine.stockStrips > 0,
            substitutes,
          };
        })
    );

    res.json({ items });
  } catch (err) { next(err); }
};

module.exports.computeStockStatus = computeStockStatus;