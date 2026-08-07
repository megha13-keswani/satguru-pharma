import { useState } from 'react';
import { Link } from 'react-router-dom';
import StockBadge from './StockBadge';

export default function MedicineCard({ medicine, onAddToCart }) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const image = medicine.images?.[0]?.url;
  const outOfStock = medicine.stockStrips <= 0;

  async function handleAdd(e) {
    e.preventDefault();
    setAdding(true);
    await onAddToCart(medicine.id, qty);
    setAdding(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      <Link to={`/medicines/${medicine.id}`}>
        <div className="aspect-square bg-gradient-to-br from-blue-50 to-gray-50 relative flex items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={medicine.name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className={`${image ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-gray-300 text-5xl`}>💊</div>
          <div className="absolute top-2 left-2">
            <StockBadge status={medicine.stockStatus} />
          </div>
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link to={`/medicines/${medicine.id}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{medicine.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{medicine.brand} · {medicine.composition}</p>
        </Link>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold text-[#1A3C6E]">₹{medicine.wholesalePrice}</span>
          <span className="text-xs text-gray-400 line-through">MRP ₹{medicine.mrp}</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {medicine.stripsPerPack} strips × {medicine.unitsPerStrip} units · {medicine.stockStrips} strips in stock
        </p>

        <div className="mt-auto pt-3">
          {outOfStock ? (
            <button
              disabled
              className="w-full text-sm font-semibold bg-gray-100 text-gray-400 py-2 rounded-lg cursor-not-allowed"
            >
              Out of Stock
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={qty}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-14 text-center border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20"
              />
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 text-sm font-semibold bg-[#1A3C6E] text-white py-2 rounded-lg hover:bg-[#142f57] transition disabled:opacity-60"
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}