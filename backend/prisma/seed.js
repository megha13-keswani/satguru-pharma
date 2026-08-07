require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Category fallback images (used when a medicine has no specific real photo below)
const CATEGORY_IMAGES = {
  Antibiotics: 'https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?auto=format&fit=crop&w=400&q=80',
  Painkillers: 'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=400&q=80',
  Vitamins: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=400&q=80',
  Cardiac: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80',
  Diabetic: 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=400&q=80',
  Syrup: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80',
  Injection: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80',
};

// Real product photos — matched by exact base medicine name.
// Files must exist in frontend/public/medicines/
const REAL_IMAGES = {
  'Amlodipine 5mg': 'amlodipine-5mg.jpg',
  'Amoxicillin 500mg': 'amoxicillin-500mg.jpg',
  'Antacid Syrup 200ml': 'antacid-syrup-200ml.jpg',
  'Atorvastatin 10mg': 'atorvastatin-10mg.jpg',
  'Azithromycin 250mg': 'azithromycin-250mg.jpg',
  'Ceftriaxone Injection 1g': 'ceftriaxone-injection.jpg',
  'Ciprofloxacin 500mg': 'ciprofloxacin-500mg.jpg',
  'Cough Syrup 100ml': 'cough-syrup-100ml.jpg',
  'Diclofenac 50mg': 'diclofenac-50mg.jpg',
  'Diclofenac Injection': 'diclofenac-injection.jpg',
  'Glimepiride 2mg': 'glimepiride-2mg.jpg',
  'Ibuprofen 400mg': 'ibuprofen-400mg.jpg',
  'Metformin 500mg': 'metformin-500mg.jpg',
  'Multivitamin Tablets': 'multivitamin-tablets.jpg',
  'Ondansetron Injection': 'ondansetron-injection.jpg',
  'Paracetamol 650mg': 'paracetamol-650mg.jpg',
  'Paracetamol Syrup 60ml': 'paracetamol-syrup-60ml.jpg',
  'Sitagliptin 100mg': 'sitagliptin-100mg.jpg',
  'Telmisartan 40mg': 'telmisartan-40mg.jpg',
  'Vitamin B12 1500mcg': 'vitamin-b12-1500mcg.jpg',
  'Vitamin D3 60K': 'vitamin-d3-60k.jpg',
  'Doxycycline 100mg': 'doxycycline-100mg.jpg',
  'Cefixime 200mg': 'cefixime-200mg.jpg',
  'Amoxiclav 625mg': 'amoxiclav-625mg.jpg',
  'Levofloxacin 500mg': 'levofloxacin-500mg.jpg',
  'Metronidazole 400mg': 'metronidazole-400mg.jpg',
  'Aceclofenac 100mg': 'aceclofenac-100mg.jpg',
  'Tramadol 50mg': 'tramadol-50mg.jpg',
  'Naproxen 500mg': 'naproxen-500mg.jpg',
  'Mefenamic Acid 500mg': 'mefenamic-acid-500mg.jpg',
  'Calcium + D3': 'calcium-d3.jpg',
  'Vitamin C 500mg': 'vitamin-c-500mg.jpg',
  'Folic Acid 5mg': 'folic-acid-5mg.jpg',
  'Zinc Sulphate Tablets': 'zinc-sulphate-tablets.jpg',
  'Metoprolol 25mg': 'metoprolol-25mg.jpg',
  'Clopidogrel 75mg': 'clopidogrel-75mg.jpg',
  'Rosuvastatin 10mg': 'rosuvastatin-10mg.jpg',
  'Losartan 50mg': 'losartan-50mg.jpg',
  'Voglibose 0.3mg': 'voglibose-0.3mg.jpg',
  'Insulin Glargine': 'insulin-glargine.jpg',
  'Pioglitazone 15mg': 'pioglitazone-15mg.jpg',
  'Iron Tonic Syrup 200ml': 'iron-tonic-syrup-200ml.jpg',
  'Multivitamin Syrup 200ml': 'multivitamin-syrup-200ml.jpg',
  'Tetanus Toxoid Injection': 'tetanus-toxoid-injection.jpg',
  'Dexamethasone Injection': 'dexamethasone-injection.jpg',
};

function getImageForMedicine(namePrefix, category) {
  if (REAL_IMAGES[namePrefix]) {
    return `${FRONTEND_URL}/medicines/${REAL_IMAGES[namePrefix]}`;
  }
  return CATEGORY_IMAGES[category];
}

const BRANDS = ['Cipla', 'Sun Pharma', 'Zydus', 'Mankind', 'Abbott', 'GSK', 'USV', 'Alkem', 'Lupin', 'Dr Reddy\'s', 'Torrent', 'Intas'];

const TEMPLATES = [
  ['Amoxicillin 500mg', 'Amoxicillin', 'Antibiotics'],
  ['Azithromycin 250mg', 'Azithromycin', 'Antibiotics'],
  ['Ciprofloxacin 500mg', 'Ciprofloxacin', 'Antibiotics'],
  ['Doxycycline 100mg', 'Doxycycline', 'Antibiotics'],
  ['Cefixime 200mg', 'Cefixime', 'Antibiotics'],
  ['Amoxiclav 625mg', 'Amoxicillin+Clavulanate', 'Antibiotics'],
  ['Levofloxacin 500mg', 'Levofloxacin', 'Antibiotics'],
  ['Metronidazole 400mg', 'Metronidazole', 'Antibiotics'],
  ['Paracetamol 650mg', 'Paracetamol', 'Painkillers'],
  ['Ibuprofen 400mg', 'Ibuprofen', 'Painkillers'],
  ['Diclofenac 50mg', 'Diclofenac Sodium', 'Painkillers'],
  ['Aceclofenac 100mg', 'Aceclofenac', 'Painkillers'],
  ['Tramadol 50mg', 'Tramadol', 'Painkillers'],
  ['Naproxen 500mg', 'Naproxen', 'Painkillers'],
  ['Mefenamic Acid 500mg', 'Mefenamic Acid', 'Painkillers'],
  ['Vitamin D3 60K', 'Cholecalciferol', 'Vitamins'],
  ['Vitamin B12 1500mcg', 'Methylcobalamin', 'Vitamins'],
  ['Multivitamin Tablets', 'Multivitamin+Minerals', 'Vitamins'],
  ['Calcium + D3', 'Calcium Carbonate+D3', 'Vitamins'],
  ['Vitamin C 500mg', 'Ascorbic Acid', 'Vitamins'],
  ['Folic Acid 5mg', 'Folic Acid', 'Vitamins'],
  ['Zinc Sulphate Tablets', 'Zinc Sulphate', 'Vitamins'],
  ['Atorvastatin 10mg', 'Atorvastatin', 'Cardiac'],
  ['Amlodipine 5mg', 'Amlodipine', 'Cardiac'],
  ['Telmisartan 40mg', 'Telmisartan', 'Cardiac'],
  ['Metoprolol 25mg', 'Metoprolol', 'Cardiac'],
  ['Clopidogrel 75mg', 'Clopidogrel', 'Cardiac'],
  ['Rosuvastatin 10mg', 'Rosuvastatin', 'Cardiac'],
  ['Losartan 50mg', 'Losartan', 'Cardiac'],
  ['Metformin 500mg', 'Metformin', 'Diabetic'],
  ['Glimepiride 2mg', 'Glimepiride', 'Diabetic'],
  ['Sitagliptin 100mg', 'Sitagliptin', 'Diabetic'],
  ['Voglibose 0.3mg', 'Voglibose', 'Diabetic'],
  ['Insulin Glargine', 'Insulin Glargine', 'Diabetic'],
  ['Pioglitazone 15mg', 'Pioglitazone', 'Diabetic'],
  ['Cough Syrup 100ml', 'Dextromethorphan', 'Syrup'],
  ['Paracetamol Syrup 60ml', 'Paracetamol', 'Syrup'],
  ['Antacid Syrup 200ml', 'Aluminium+Magnesium Hydroxide', 'Syrup'],
  ['Iron Tonic Syrup 200ml', 'Ferrous Ascorbate', 'Syrup'],
  ['Multivitamin Syrup 200ml', 'Multivitamin', 'Syrup'],
  ['Diclofenac Injection', 'Diclofenac', 'Injection'],
  ['Ceftriaxone Injection 1g', 'Ceftriaxone', 'Injection'],
  ['Ondansetron Injection', 'Ondansetron', 'Injection'],
  ['Tetanus Toxoid Injection', 'Tetanus Toxoid', 'Injection'],
  ['Dexamethasone Injection', 'Dexamethasone', 'Injection'],
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

async function main() {
  // ---------- Admin ----------
  const hashed = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@satgurupharma.com' },
    update: {},
    create: { email: 'admin@satgurupharma.com', password: hashed, name: 'Satguru Admin', role: 'ADMIN' },
  });
  console.log('Admin ready:', admin.email);

  // ---------- Test wholesaler (pre-approved) ----------
  const shopPass = await bcrypt.hash('Test@1234', 10);
  const existingShopUser = await prisma.user.findUnique({ where: { email: 'rajesh@sharmamedical.com' } });
  if (!existingShopUser) {
    await prisma.user.create({
      data: {
        email: 'rajesh@sharmamedical.com',
        password: shopPass,
        name: 'Rajesh Sharma',
        phone: '9876543210',
        role: 'WHOLESALER',
        shop: {
          create: {
            shopName: 'Sharma Medical Store',
            ownerName: 'Rajesh Sharma',
            gstNumber: '27ABCDE1234F1Z5',
            drugLicenseNumber: 'DL-2026-001',
            phone: '9876543210',
            address: '123 MG Road, Mumbai',
            approvalStatus: 'APPROVED',
          },
        },
      },
    });
    console.log('Test wholesaler ready: rajesh@sharmamedical.com | password: Test@1234');
  }

  // ---------- Categories ----------
  const categoryNames = Object.keys(CATEGORY_IMAGES);
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('Categories ready:', categoryNames.join(', '));

  // ---------- Generate medicines ----------
  const gstByCategory = { Antibiotics: 12, Painkillers: 5, Vitamins: 12, Cardiac: 12, Diabetic: 12, Syrup: 12, Injection: 12 };
  const hsnByCategory = { Antibiotics: '30041020', Painkillers: '30049099', Vitamins: '30045090', Cardiac: '30049099', Diabetic: '30049099', Syrup: '30049011', Injection: '30049013' };

  let created = 0;
  let batchCounter = 1000;

  for (const [namePrefix, salt, category] of TEMPLATES) {
    const variantCount = 3;
    const imageForThisMedicine = getImageForMedicine(namePrefix, category);

    for (let v = 0; v < variantCount; v++) {
      const brand = BRANDS[(created + v) % BRANDS.length];
      const name = v === 0 ? namePrefix : `${namePrefix} (${brand})`;
      const mrp = rand(30, 250);
      const wholesalePrice = Math.round(mrp * (rand(65, 80) / 100));
      const stockStrips = pick([0, rand(1, 40), rand(60, 400)]);
      const lowStockThreshold = 50;

      const data = {
        name,
        brand,
        composition: salt,
        manufacturer: `${brand} Ltd`,
        categoryId: categories[category].id,
        hsnCode: hsnByCategory[category],
        gstPercent: gstByCategory[category],
        mrp,
        wholesalePrice,
        stripsPerPack: pick([1, 4, 6, 10, 15]),
        unitsPerStrip: pick([1, 4, 6, 10, 15]),
        stockStrips,
        lowStockThreshold,
        stockStatus: stockStrips <= 0 ? 'OUT_OF_STOCK' : stockStrips < lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
        batchNumber: `B${batchCounter++}`,
        expiryDate: new Date(2027, rand(0, 11), rand(1, 28)),
      };

      const existing = await prisma.medicine.findFirst({ where: { name: data.name, brand: data.brand } });
      let medicine;
      if (existing) {
        medicine = await prisma.medicine.update({ where: { id: existing.id }, data });
      } else {
        medicine = await prisma.medicine.create({ data });
      }

      // Always refresh the image (so re-running seed picks up newly added real photos)
      await prisma.medicineImage.deleteMany({ where: { medicineId: medicine.id } });
      await prisma.medicineImage.create({
        data: { medicineId: medicine.id, url: imageForThisMedicine, isPrimary: true },
      });

      created++;
    }
  }

  console.log(`${created} medicines ready.`);
  console.log(`${Object.keys(REAL_IMAGES).length} medicines using real product photos.`);
  console.log('Seed complete.');
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());