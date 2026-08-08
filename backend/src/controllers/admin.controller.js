const prisma = require('../lib/prisma');
const { pushCustomerRecord } = require('../integrations/marg.adapter');

exports.dashboard = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersToday, revenueAgg, pendingApprovals, lowStockCount, outOfStockCount] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.aggregate({ _sum: { grandTotal: true }, where: { createdAt: { gte: startOfDay } } }),
      prisma.shop.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.medicine.count({ where: { stockStatus: 'LOW_STOCK', active: true } }),
      prisma.medicine.count({ where: { stockStatus: 'OUT_OF_STOCK', active: true } }),
    ]);

    res.json({
      ordersToday,
      revenueToday: revenueAgg._sum.grandTotal || 0,
      pendingApprovals,
      lowStockCount,
      outOfStockCount,
    });
  } catch (err) { next(err); }
};

// ---------- Shop approvals ----------
exports.pendingShops = async (req, res, next) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { approvalStatus: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ shops });
  } catch (err) { next(err); }
};

exports.listShops = async (req, res, next) => {
  try {
    const { status } = req.query;
    const shops = await prisma.shop.findMany({
      where: status ? { approvalStatus: status } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ shops });
  } catch (err) { next(err); }
};

exports.approveShop = async (req, res, next) => {
  try {
    const shop = await prisma.shop.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'APPROVED', rejectionReason: null },
    });
    pushCustomerRecord(shop).catch((e) => console.error('MARG customer push failed:', e.message));
    res.json({ shop });
  } catch (err) { next(err); }
};

exports.rejectShop = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const shop = await prisma.shop.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'REJECTED', rejectionReason: reason || null },
    });
    res.json({ shop });
  } catch (err) { next(err); }
};

exports.toggleShopEnabled = async (req, res, next) => {
  try {
    const shop = await prisma.shop.findUnique({ where: { id: req.params.id } });
    const newStatus = shop.approvalStatus === 'DISABLED' ? 'APPROVED' : 'DISABLED';
    const updated = await prisma.shop.update({ where: { id: req.params.id }, data: { approvalStatus: newStatus } });
    res.json({ shop: updated });
  } catch (err) { next(err); }
};

// ---------- Medicine management ----------
exports.listMedicines = async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: { images: true, category: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ medicines });
  } catch (err) { next(err); }
};

exports.createMedicine = async (req, res, next) => {
  try {
    const medicine = await prisma.medicine.create({ data: req.body });
    res.status(201).json({ medicine });
  } catch (err) { next(err); }
};

exports.updateMedicine = async (req, res, next) => {
  try {
    const medicine = await prisma.medicine.update({ where: { id: req.params.id }, data: req.body });
    res.json({ medicine });
  } catch (err) { next(err); }
};

exports.deleteMedicine = async (req, res, next) => {
  try {
    await prisma.medicine.update({ where: { id: req.params.id }, data: { active: false } });
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.uploadMedicineImages = async (req, res, next) => {
  try {
    const files = req.files || [];
    const created = await prisma.$transaction(
      files.map((f, idx) => prisma.medicineImage.create({
        data: {
          medicineId: req.params.id,
          url: `http://localhost:5000/uploads/medicines/${f.filename}`,
          isPrimary: idx === 0,
        },
      }))
    );
    res.status(201).json({ images: created });
  } catch (err) { next(err); }
};

exports.setSubstitutes = async (req, res, next) => {
  try {
    const { substituteMedicineIds = [] } = req.body;
    const medicineId = req.params.id;

    await prisma.substitute.deleteMany({ where: { medicineId } });
    await prisma.substitute.createMany({
      data: substituteMedicineIds.map((subId) => ({ medicineId, substituteMedicineId: subId })),
      skipDuplicates: true,
    });

    const links = await prisma.substitute.findMany({ where: { medicineId }, include: { substituteMedicine: true } });
    res.json({ substitutes: links.map((l) => l.substituteMedicine) });
  } catch (err) { next(err); }
};

exports.overrideStock = async (req, res, next) => {
  try {
    const { stockStrips, stockStatus } = req.body;
    const data = { stockOverride: true };
    if (stockStrips !== undefined) data.stockStrips = Number(stockStrips);
    if (stockStatus) data.stockStatus = stockStatus;

    const medicine = await prisma.medicine.update({ where: { id: req.params.id }, data });
    res.json({ medicine });
  } catch (err) { next(err); }
};

exports.notificationLog = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user: { role: 'ADMIN' } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ notifications });
  } catch (err) { next(err); }
};

exports.setImageUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Image URL is required' });

    await prisma.medicineImage.deleteMany({ where: { medicineId: req.params.id } });
    const image = await prisma.medicineImage.create({
      data: { medicineId: req.params.id, url, isPrimary: true },
    });
    res.status(201).json({ image });
  } catch (err) { next(err); }
};

exports.shopDetail = async (req, res, next) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: req.params.id },
      include: { user: true, addresses: true },
    });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const orders = await prisma.order.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
    const lastOrderDate = orders[0]?.createdAt || null;

    res.json({ shop, orders, stats: { totalOrders: orders.length, totalRevenue, lastOrderDate } });
  } catch (err) { next(err); }
};

// Shop x Orders matrix — every approved shop with all its orders (date, amount, paid, pending, status)
exports.ordersMatrix = async (req, res, next) => {
  try {
    const shops = await prisma.shop.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, orderNumber: true, createdAt: true, status: true,
            grandTotal: true, amountPaid: true,
          },
        },
      },
      orderBy: { shopName: 'asc' },
    });
    res.json({ shops });
  } catch (err) { next(err); }
};

// Date-wise revenue breakdown (for clicking "Today's Revenue" card)
exports.revenueByDate = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { createdAt: true, grandTotal: true, amountPaid: true },
    });

    const byDate = {};
    orders.forEach((o) => {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (!byDate[key]) byDate[key] = { date: key, totalRevenue: 0, totalPaid: 0, totalPending: 0, orderCount: 0 };
      byDate[key].totalRevenue += o.grandTotal;
      byDate[key].totalPaid += o.amountPaid;
      byDate[key].totalPending += (o.grandTotal - o.amountPaid);
      byDate[key].orderCount += 1;
    });

    const result = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
    res.json({ revenueByDate: result });
  } catch (err) { next(err); }
};

// Shop-wise breakdown for a specific date
exports.revenueByDateDetail = async (req, res, next) => {
  try {
    const { date } = req.params; // format: YYYY-MM-DD
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
      include: { shop: true },
      orderBy: { createdAt: 'desc' },
    });

    const byShop = {};
    orders.forEach((o) => {
      if (!byShop[o.shopId]) {
        byShop[o.shopId] = {
          shopId: o.shopId,
          shopName: o.shop.shopName,
          orderCount: 0,
          totalBilled: 0,
          totalPaid: 0,
          totalPending: 0,
          orders: [],
        };
      }
      byShop[o.shopId].orderCount += 1;
      byShop[o.shopId].totalBilled += o.grandTotal;
      byShop[o.shopId].totalPaid += o.amountPaid;
      byShop[o.shopId].totalPending += (o.grandTotal - o.amountPaid);
      byShop[o.shopId].orders.push({
        id: o.id, orderNumber: o.orderNumber, grandTotal: o.grandTotal,
        amountPaid: o.amountPaid, status: o.status,
      });
    });

    res.json({ date, shops: Object.values(byShop) });
  } catch (err) { next(err); }
};