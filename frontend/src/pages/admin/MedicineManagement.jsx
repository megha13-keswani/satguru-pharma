import { useEffect, useState } from 'react';
import client from '../../api/client';
import StockBadge from '../../components/StockBadge';

const EMPTY_FORM = {
  name: '', brand: '', composition: '', manufacturer: '', categoryId: '',
  hsnCode: '', gstPercent: 12, mrp: '', wholesalePrice: '',
  stripsPerPack: 10, unitsPerStrip: 10, stockStrips: 0, lowStockThreshold: 50,
  batchNumber: '', expiryDate: '', prescriptionRequired: false,
};

export default function MedicineManagement() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [medRes, catRes] = await Promise.all([
      client.get('/admin/medicines'),
      client.get('/medicines/categories').catch(() => ({ data: { categories: [] } })),
    ]);
    setMedicines(medRes.data.medicines);
    setCategories(catRes.data.categories);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openAddForm() {
    setForm(EMPTY_FORM);
    setImageUrl('');
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(m) {
    setForm({
      name: m.name, brand: m.brand, composition: m.composition, manufacturer: m.manufacturer,
      categoryId: m.categoryId, hsnCode: m.hsnCode, gstPercent: m.gstPercent, mrp: m.mrp,
      wholesalePrice: m.wholesalePrice, stripsPerPack: m.stripsPerPack, unitsPerStrip: m.unitsPerStrip,
      stockStrips: m.stockStrips, lowStockThreshold: m.lowStockThreshold,
      batchNumber: m.batchNumber || '', expiryDate: m.expiryDate ? m.expiryDate.slice(0, 10) : '',
      prescriptionRequired: m.prescriptionRequired,
    });
    setImageUrl(m.images?.[0]?.url || '');
    setEditingId(m.id);
    setShowForm(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        gstPercent: Number(form.gstPercent),
        mrp: Number(form.mrp),
        wholesalePrice: Number(form.wholesalePrice),
        stripsPerPack: Number(form.stripsPerPack),
        unitsPerStrip: Number(form.unitsPerStrip),
        stockStrips: Number(form.stockStrips),
        lowStockThreshold: Number(form.lowStockThreshold),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
      };

      let medicineId = editingId;
      if (editingId) {
        await client.put(`/admin/medicines/${editingId}`, payload);
      } else {
        const res = await client.post('/admin/medicines', payload);
        medicineId = res.data.medicine.id;
      }

      if (imageUrl.trim()) {
        await client.put(`/admin/medicines/${medicineId}/image-url`, { url: imageUrl.trim() });
      }

      setShowForm(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id) {
    if (!window.confirm('Deactivate this medicine? It will be hidden from wholesalers.')) return;
    await client.delete(`/admin/medicines/${id}`);
    await loadData();
  }

  const filtered = medicines.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.brand.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-24 text-gray-400">Loading medicines...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicine Management</h1>
          <p className="text-sm text-gray-500">{medicines.length} medicines</p>
        </div>
        <button
          onClick={openAddForm}
          className="bg-[#1A3C6E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#142f57] transition"
        >
          + Add Medicine
        </button>
      </div>

      <input
        type="text"
        placeholder="Search medicines..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20"
      />

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Medicine</th>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Stock</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.brand}</td>
                <td className="px-4 py-3 text-right">₹{m.wholesalePrice}</td>
                <td className="px-4 py-3 text-right">{m.stockStrips}</td>
                <td className="px-4 py-3 text-center"><StockBadge status={m.stockStatus} /></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openEditForm(m)} className="text-[#1A3C6E] font-semibold text-xs hover:underline">Edit</button>
                  <button onClick={() => handleDeactivate(m.id)} className="text-red-500 font-semibold text-xs hover:underline">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h2>

            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
              <Field label="Name"><input name="name" required value={form.name} onChange={handleChange} className="input" /></Field>
              <Field label="Brand"><input name="brand" required value={form.brand} onChange={handleChange} className="input" /></Field>
              <Field label="Composition / Salt"><input name="composition" required value={form.composition} onChange={handleChange} className="input" /></Field>
              <Field label="Manufacturer"><input name="manufacturer" required value={form.manufacturer} onChange={handleChange} className="input" /></Field>

              <Field label="Category">
                <select name="categoryId" required value={form.categoryId} onChange={handleChange} className="input">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="HSN Code"><input name="hsnCode" required value={form.hsnCode} onChange={handleChange} className="input" /></Field>

              <Field label="GST %"><input type="number" name="gstPercent" required value={form.gstPercent} onChange={handleChange} className="input" /></Field>
              <Field label="MRP (₹)"><input type="number" name="mrp" required value={form.mrp} onChange={handleChange} className="input" /></Field>
              <Field label="Wholesale Price (₹)"><input type="number" name="wholesalePrice" required value={form.wholesalePrice} onChange={handleChange} className="input" /></Field>
              <Field label="Stock (strips)"><input type="number" name="stockStrips" required value={form.stockStrips} onChange={handleChange} className="input" /></Field>

              <Field label="Strips per Pack"><input type="number" name="stripsPerPack" value={form.stripsPerPack} onChange={handleChange} className="input" /></Field>
              <Field label="Units per Strip"><input type="number" name="unitsPerStrip" value={form.unitsPerStrip} onChange={handleChange} className="input" /></Field>
              <Field label="Low Stock Threshold"><input type="number" name="lowStockThreshold" value={form.lowStockThreshold} onChange={handleChange} className="input" /></Field>
              <Field label="Batch Number"><input name="batchNumber" value={form.batchNumber} onChange={handleChange} className="input" /></Field>

              <Field label="Expiry Date"><input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className="input" /></Field>
              <Field label="Image URL (optional)">
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/medicines/xyz.jpg" className="input" />
              </Field>

              <label className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                <input type="checkbox" name="prescriptionRequired" checked={form.prescriptionRequired} onChange={handleChange} />
                Prescription required for this medicine
              </label>

              <div className="sm:col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#1A3C6E] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#142f57] disabled:opacity-60">
                  {saving ? 'Saving...' : editingId ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}