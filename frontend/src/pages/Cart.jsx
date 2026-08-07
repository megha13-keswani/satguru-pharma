import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();

  async function loadCart() {
    setLoading(true);
    const res = await client.get('/cart');
    setCart(res.data);
    setLoading(false);
  }

  useEffect(() => { loadCart(); }, []);

  async function updateQty(medicineId, quantityStrips) {
    setUpdating(medicineId);
    await client.patch(`/cart/items/${medicineId}`, { quantityStrips });
    await loadCart();
    setUpdating(null);
  }

  async function removeItem(medicineId) {
    setUpdating(medicineId);
    await client.delete(`/cart/items/${medicineId}`);
    await loadCart();
    setUpdating(null);
  }

  if (loading) return <div className="text-center py-24 text-gray-400">Loading cart...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-400 mb-6">Add some medicines to get started.</p>
        <Link to="/" className="inline-block bg-[#1A3C6E] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#142f57]">
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      <div className="space-y-3 mb-6">
        {cart.items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden shrink-0">
              {item.medicine.images?.[0]?.url ? (
                <img src={item.medicine.images[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">💊</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{item.medicine.name}</h3>
              <p className="text-xs text-gray-400">₹{item.pricePerStrip} / strip · GST {item.gstPercent}%</p>
            </div>

            <input
  type="number"
  min="1"
  value={item.quantityStrips}
  disabled={updating === item.medicine.id}
  onFocus={(e) => e.target.select()}
  onChange={(e) => updateQty(item.medicine.id, Math.max(1, Number(e.target.value) || 1))}
  className="w-16 text-center border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20"
/>

            <div className="w-24 text-right font-semibold text-[#1A3C6E] text-sm">₹{item.lineTotal.toFixed(2)}</div>

            <button
              onClick={() => removeItem(item.medicine.id)}
              disabled={updating === item.medicine.id}
              className="text-gray-400 hover:text-red-500 transition text-lg px-2"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Subtotal</span>
          <span>₹{cart.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span>GST</span>
          <span>₹{cart.gstTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-3 mb-4">
          <span>Grand Total</span>
          <span>₹{cart.grandTotal.toFixed(2)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-[#1A3C6E] text-white py-3 rounded-lg text-sm font-semibold hover:bg-[#142f57] transition"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}