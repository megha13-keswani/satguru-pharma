import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import StockBadge from '../components/StockBadge';

export default function MedicineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [substitutes, setSubstitutes] = useState([]);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('substitutes');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      client.get(`/medicines/${id}`),
      client.get(`/medicines/${id}/substitutes`),
      client.get(`/medicines/${id}/related`),
    ]).then(([mRes, sRes, rRes]) => {
      setMedicine(mRes.data.medicine);
      setSubstitutes(sRes.data.items);
      setRelated(rRes.data.items);
      setLoading(false);
    });
  }, [id]);

  async function handleAddToCart() {
    setAdding(true);
    try {
      await client.post('/cart/items', { medicineId: id, quantityStrips: qty });
      setToast('Added to cart ✓');
      setTimeout(() => setToast(''), 1800);
    } catch (err) {
      setToast(err.response?.data?.error || 'Could not add to cart');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="text-center py-24 text-gray-400">Loading medicine...</div>;
  if (!medicine) return <div className="text-center py-24 text-gray-400">Medicine not found.</div>;

  const image = medicine.images?.[0]?.url;
  const outOfStock = medicine.stockStrips <= 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-[#1A3C6E] mb-4">
        ← Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Image */}
        <div className="aspect-square bg-gradient-to-br from-blue-50 to-gray-50 rounded-2xl relative flex items-center justify-center overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={medicine.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className={`${image ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-gray-300 text-7xl`}>💊</div>
          <div className="absolute top-3 left-3">
            <StockBadge status={medicine.stockStatus} />
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-xs font-semibold text-[#1A3C6E] uppercase tracking-wide mb-1">{medicine.category?.name}</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{medicine.name}</h1>
          <p className="text-sm text-gray-500 mb-4">{medicine.brand} · {medicine.manufacturer}</p>

          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-bold text-[#1A3C6E]">₹{medicine.wholesalePrice}</span>
            <span className="text-sm text-gray-400 line-through">MRP ₹{medicine.mrp}</span>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              GST {medicine.gstPercent}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-6">per strip</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Composition / Salt</span><span className="font-medium text-gray-900">{medicine.composition}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Pack Size</span><span className="font-medium text-gray-900">{medicine.stripsPerPack} strips × {medicine.unitsPerStrip} units</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Stock Available</span><span className="font-medium text-gray-900">{medicine.stockStrips} strips</span></div>
            <div className="flex justify-between"><span className="text-gray-500">HSN Code</span><span className="font-medium text-gray-900">{medicine.hsnCode}</span></div>
            {medicine.batchNumber && (
              <div className="flex justify-between"><span className="text-gray-500">Batch No.</span><span className="font-medium text-gray-900">{medicine.batchNumber}</span></div>
            )}
            {medicine.expiryDate && (
              <div className="flex justify-between"><span className="text-gray-500">Expiry</span><span className="font-medium text-gray-900">{new Date(medicine.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span></div>
            )}
            {medicine.prescriptionRequired && (
              <div className="flex justify-between"><span className="text-gray-500">Prescription</span><span className="font-medium text-amber-600">Required</span></div>
            )}
          </div>

          {medicine.storageInstructions && (
            <p className="text-xs text-gray-400 mb-6">📦 {medicine.storageInstructions}</p>
          )}

          {outOfStock ? (
            <button disabled className="w-full bg-gray-100 text-gray-400 py-3 rounded-xl text-sm font-semibold cursor-not-allowed">
              Out of Stock — see substitutes below
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={qty}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 text-center border border-gray-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20"
              />
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 bg-[#1A3C6E] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#142f57] transition disabled:opacity-60"
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-6 mb-6">
        <button
          onClick={() => setTab('substitutes')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${tab === 'substitutes' ? 'border-[#1A3C6E] text-[#1A3C6E]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Substitute Medicines ({substitutes.length})
        </button>
        <button
          onClick={() => setTab('related')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${tab === 'related' ? 'border-[#1A3C6E] text-[#1A3C6E]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Related Medicines ({related.length})
        </button>
      </div>

      {tab === 'substitutes' && (
        substitutes.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No substitutes linked for this medicine yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {substitutes.map((m) => (
              <MiniCard key={m.id} medicine={m} />
            ))}
          </div>
        )
      )}

      {tab === 'related' && (
        related.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No related medicines found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((m) => (
              <MiniCard key={m.id} medicine={m} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function MiniCard({ medicine }) {
  const image = medicine.images?.[0]?.url;
  return (
    <Link to={`/medicines/${medicine.id}`} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition">
      <div className="aspect-square bg-gray-50 flex items-center justify-center">
        {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl text-gray-300">💊</span>}
      </div>
      <div className="p-3">
        <h4 className="text-xs font-semibold text-gray-900 truncate">{medicine.name}</h4>
        <p className="text-sm font-bold text-[#1A3C6E] mt-1">₹{medicine.wholesalePrice}</p>
      </div>
    </Link>
  );
}