import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function OrderPlacement() {
  const [cart, setCart] = useState(null);
  const [paymentTerm, setPaymentTerm] = useState('ADVANCE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/cart').then((res) => {
      setCart(res.data);
      setLoading(false);
    });
  }, []);

  async function handlePlaceOrder() {
    setError('');
    setPlacing(true);
    try {
      const res = await client.post('/orders', { paymentTerm, notes });
      navigate(`/orders/${res.data.order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <div className="text-center py-24 text-gray-400">Loading checkout...</div>;
  if (!cart || cart.items.length === 0) {
    return <div className="text-center py-24 text-gray-400">Your cart is empty.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Order summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Order Summary ({cart.items.length} items)</h2>
        <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600">
              <span className="truncate pr-2">{item.medicine.name} × {item.quantityStrips} strips</span>
              <span className="shrink-0 font-medium text-gray-900">₹{item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-500"><span>GST</span><span>₹{cart.gstTotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-1"><span>Grand Total</span><span>₹{cart.grandTotal.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Payment terms */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Payment Terms</h2>
        <div className="grid grid-cols-3 gap-2">
          {['ADVANCE', 'CREDIT', 'NET_30'].map((term) => (
            <button
              key={term}
              onClick={() => setPaymentTerm(term)}
              className={`text-sm font-medium py-2.5 rounded-lg border transition ${
                paymentTerm === term
                  ? 'bg-[#1A3C6E] text-white border-[#1A3C6E]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A3C6E]'
              }`}
            >
              {term.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Order Notes (optional)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any special instructions for this order..."
          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20 focus:border-[#1A3C6E]"
        />
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={placing}
        className="w-full bg-[#1A3C6E] text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-[#142f57] transition disabled:opacity-60"
      >
        {placing ? 'Placing Order...' : `Confirm Order — ₹${cart.grandTotal.toFixed(2)}`}
      </button>
    </div>
  );
}