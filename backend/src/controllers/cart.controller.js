const prisma = require('../lib/prisma');

async function getOrCreateActiveCart(shopId) {
  let cart = await prisma.cart.findFirst({ where: { shopId, isDraft: true }, orderBy: { updatedAt: 'desc' } });
  if (!cart) cart = await prisma.cart.create({ data: { shopId } });
  return cart;
}

function withTotals(cart) {
  let subtotal = 0;
  let gstTotal = 0;
  const items = cart.items.map((item) => {
    const lineSubtotal = item.medicine.wholesalePrice * item.quantityStrips;
    const lineGst = (lineSubtotal * item.medicine.gstPercent) / 100;
    subtotal += lineSubtotal;
    gstTotal += lineGst;
    return {
      id: item.id,
      medicine: item.medicine,
      quantityStrips: item.quantityStrips,
      pricePerStrip: item.medicine.wholesalePrice,
      lineSubtotal,
      gstPercent: item.medicine.gstPercent,
      lineGst,
      lineTotal: lineSubtotal + lineGst,
    };
  });
  return { items, subtotal, gstTotal, grandTotal: subtotal + gstTotal };
}

exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateActiveCart(req.user.shop.id);
    const full = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { medicine: { include: { images: true } } } } },
    });
    res.json(withTotals(full));
  } catch (err) { next(err); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { medicineId, quantityStrips = 1 } = req.body;
    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine || !medicine.active) return res.status(404).json({ error: 'Medicine not found' });
    if (medicine.stockStrips <= 0) return res.status(400).json({ error: 'Medicine is out of stock' });

    const cart = await getOrCreateActiveCart(req.user.shop.id);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_medicineId: { cartId: cart.id, medicineId } },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantityStrips: existing.quantityStrips + Number(quantityStrips) },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, medicineId, quantityStrips: Number(quantityStrips) },
      });
    }

    const full = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { medicine: { include: { images: true } } } } },
    });
    res.status(201).json(withTotals(full));
  } catch (err) { next(err); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const { medicineId } = req.params;
    const { quantityStrips } = req.body;
    const cart = await getOrCreateActiveCart(req.user.shop.id);

    if (Number(quantityStrips) <= 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id, medicineId } });
    } else {
      await prisma.cartItem.updateMany({
        where: { cartId: cart.id, medicineId },
        data: { quantityStrips: Number(quantityStrips) },
      });
    }

    const full = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { medicine: { include: { images: true } } } } },
    });
    res.json(withTotals(full));
  } catch (err) { next(err); }
};

exports.removeItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateActiveCart(req.user.shop.id);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, medicineId: req.params.medicineId } });
    res.status(204).send();
  } catch (err) { next(err); }
};

exports.saveDraft = async (req, res, next) => {
  try {
    const cart = await getOrCreateActiveCart(req.user.shop.id);
    res.json({ message: 'Cart saved as draft', cartId: cart.id });
  } catch (err) { next(err); }
};

module.exports.getOrCreateActiveCart = getOrCreateActiveCart;
module.exports.withTotals = withTotals;
