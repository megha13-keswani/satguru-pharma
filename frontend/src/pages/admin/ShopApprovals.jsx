import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';

const STATUS_STYLE = {
  APPROVED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
  DISABLED: 'bg-gray-200 text-gray-600',
};

export default function ShopApprovals() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    client.get('/admin/shops').then((res) => {
      setShops(res.data.shops);
      setLoading(false);
    });
  }, []);

  const filtered = shops.filter((s) =>
    s.shopName.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    s.gstNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-24 text-gray-400">Loading shops...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">All Shops</h1>
      <p className="text-sm text-gray-500 mb-6">{shops.length} registered shops</p>

      <input
        type="text"
        placeholder="Search by shop name, owner, or GST number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20"
      />

      <div className="space-y-3">
        {filtered.map((shop) => (
          <Link
            key={shop.id}
            to={`/admin/shops/${shop.id}`}
            className="block bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{shop.shopName}</h3>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[shop.approvalStatus]}`}>
                {shop.approvalStatus}
              </span>
            </div>
            <p className="text-sm text-gray-500">{shop.ownerName} · {shop.phone}</p>
            <p className="text-xs text-gray-400 mt-1">GST: {shop.gstNumber} · License: {shop.drugLicenseNumber}</p>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">No shops match your search.</p>
        )}
      </div>
    </div>
  );
}