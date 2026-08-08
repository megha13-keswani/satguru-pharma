import { useEffect, useState } from 'react';
import client from '../../api/client';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { user } = useAuth();

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, shopsRes] = await Promise.all([
        client.get('/admin/dashboard'),
        client.get('/admin/shops/pending'),
      ]);
      setStats(statsRes.data);
      setShops(shopsRes.data.shops);
    } catch (err) {
      console.error('Dashboard load failed:', err);
      setStats({ ordersToday: 0, revenueToday: 0, pendingApprovals: 0, lowStockCount: 0, outOfStockCount: 0 });
      setShops([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleApprove(shopId) {
    setActionLoading(shopId);
    await client.post(`/admin/shops/${shopId}/approve`);
    await loadData();
    setActionLoading(null);
  }

  async function handleReject(shopId) {
    const reason = window.prompt('Reason for rejection (optional):') || '';
    setActionLoading(shopId);
    await client.post(`/admin/shops/${shopId}/reject`, { reason });
    await loadData();
    setActionLoading(null);
  }

  if (loading) {
    return <div className="text-center py-24 text-gray-400">Loading dashboard...</div>;
  }

  const statCards = [
    { label: "Today's Orders", value: stats.ordersToday, color: 'bg-blue-50 text-[#1A3C6E]', link: '/admin/orders' },
    { label: "Today's Revenue", value: `₹${stats.revenueToday.toLocaleString('en-IN')}`, color: 'bg-green-50 text-green-700', link: '/admin/revenue' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, color: 'bg-amber-50 text-amber-700', link: null },
    { label: 'Low Stock Items', value: stats.lowStockCount, color: 'bg-orange-50 text-orange-700', link: '/admin/inventory?filter=LOW_STOCK' },
    { label: 'Out of Stock', value: stats.outOfStockCount, color: 'bg-red-50 text-red-700', link: '/admin/inventory?filter=OUT_OF_STOCK' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Overview of today's activity across Satguru Pharma</p>

      {user.isSuperAdmin && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <Link to="/admin/medicines" className="text-sm font-semibold bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-[#1A3C6E] transition">
            💊 Manage Medicines
          </Link>
          <Link to="/admin/shops" className="text-sm font-semibold bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-[#1A3C6E] transition">
            🏪 All Shops
          </Link>
          <Link to="/admin/shop-orders" className="text-sm font-semibold bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-[#1A3C6E] transition">
            📊 Shop-wise Orders
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {statCards.map((s) => {
          const Card = (
            <div className={`rounded-xl p-4 ${s.color} border border-black/5 h-full ${s.link ? 'hover:opacity-80 transition cursor-pointer' : ''}`}>
              <p className="text-xs font-medium opacity-70 mb-1">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          );
          return s.link ? <Link key={s.label} to={s.link}>{Card}</Link> : <div key={s.label}>{Card}</div>;
        })}
      </div>

      {/* Pending shop approvals */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Pending Shop Approvals</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {shops.length} pending
        </span>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No pending approvals right now 🎉
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/admin/shops/${shop.id}`} className="font-semibold text-gray-900 hover:text-[#1A3C6E]">{shop.shopName}</Link>
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500">{shop.ownerName} · {shop.phone}</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-gray-400 mt-2">
                  <span>GST: {shop.gstNumber}</span>
                  <span>Drug License: {shop.drugLicenseNumber}</span>
                  <span className="col-span-2">{shop.address}</span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(shop.id)}
                  disabled={actionLoading === shop.id}
                  className="text-sm font-semibold bg-[#1A3C6E] text-white px-4 py-2 rounded-lg hover:bg-[#142f57] transition disabled:opacity-50"
                >
                  {actionLoading === shop.id ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(shop.id)}
                  disabled={actionLoading === shop.id}
                  className="text-sm font-semibold bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}