import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../../api/client';
import StockBadge from '../../components/StockBadge';

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const filter = searchParams.get('filter') || '';

  useEffect(() => {
    setLoading(true);
    client.get('/admin/medicines').then((res) => {
      setMedicines(res.data.medicines);
      setLoading(false);
    });
  }, []);

  const filtered = filter ? medicines.filter((m) => m.stockStatus === filter) : medicines;

  if (loading) return <div className="text-center py-24 text-gray-400">Loading inventory...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Inventory</h1>
      <p className="text-sm text-gray-500 mb-6">{filtered.length} medicines{filter ? ` — ${filter.replace('_', ' ')}` : ''}</p>

      <div className="flex gap-2 mb-6">
        {['', 'LOW_STOCK', 'OUT_OF_STOCK', 'IN_STOCK'].map((f) => (
          <button
            key={f}
            onClick={() => setSearchParams(f ? { filter: f } : {})}
            className={`text-sm font-medium px-4 py-1.5 rounded-full border ${filter === f ? 'bg-[#1A3C6E] text-white border-[#1A3C6E]' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {f ? f.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Medicine</th>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-right px-4 py-3">Stock</th>
              <th className="text-right px-4 py-3">Threshold</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                <td className="px-4 py-3 text-gray-500">{m.brand}</td>
                <td className="px-4 py-3 text-right">{m.stockStrips} strips</td>
                <td className="px-4 py-3 text-right text-gray-400">{m.lowStockThreshold}</td>
                <td className="px-4 py-3 text-center"><StockBadge status={m.stockStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-12">No medicines in this category.</p>}
      </div>
    </div>
  );
}