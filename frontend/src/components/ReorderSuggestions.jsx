import { useEffect, useState, useRef } from 'react';
import client from '../api/client';

export default function ReorderSuggestions({ onAddToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    client.get('/medicines/reorder-suggestions').then((res) => {
      setItems(res.data.items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY <= 10) {
        setVisible(true); // back at top -> show
      } else if (currentY > lastScrollY.current) {
        setVisible(false); // scrolling down -> hide
      } else {
        setVisible(false); // scrolling up but not at top -> stay hidden until top
      }
      lastScrollY.current = currentY;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading || items.length === 0) return null;

  async function handleQuickAdd(medicineId) {
    setAdding(medicineId);
    await onAddToCart(medicineId, 1);
    setAdding(null);
  }

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{
        maxHeight: visible ? '260px' : '0px',
        opacity: visible ? 1 : 0,
        marginBottom: visible ? '1.5rem' : '0px',
      }}
    >
      <h2 className="text-sm font-semibold text-gray-700 mb-3">🔄 Reorder from your last order</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map(({ medicine, inStock, substitutes }) => (
          <div key={medicine.id} className="shrink-0 w-40 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
              {medicine.images?.[0]?.url ? (
                <img src={medicine.images[0].url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-gray-300">💊</span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-900 truncate">{medicine.name}</p>
            <p className="text-xs text-[#1A3C6E] font-bold mt-0.5">₹{medicine.wholesalePrice}</p>

            {inStock ? (
              <button
                onClick={() => handleQuickAdd(medicine.id)}
                disabled={adding === medicine.id}
                className="w-full mt-2 text-xs font-semibold bg-[#1A3C6E] text-white py-1.5 rounded-lg hover:bg-[#142f57] transition disabled:opacity-60"
              >
                {adding === medicine.id ? '...' : 'Reorder'}
              </button>
            ) : substitutes.length > 0 ? (
              <p className="text-[10px] text-amber-600 mt-2">Out of stock — {substitutes.length} alternatives available</p>
            ) : (
              <p className="text-[10px] text-gray-400 mt-2">Out of stock</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}