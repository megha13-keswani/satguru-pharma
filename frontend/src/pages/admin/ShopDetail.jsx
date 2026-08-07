import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';

const STATUS_STYLE = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  DISPATCHED: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function ShopDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/admin/shops/${id}/detail`).then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-center py-24 text-gray-400">Loading shop...</div>;
  if (!data) return <div className="text-center py-24 text-gray-400">Shop not found.</div>;

  const { shop, orders, stats } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/admin/shops" className="text-sm text-gray-500 hover:text-[#1A3C6E]">← All Shops</Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{shop.shopName}</h1>
        <Link
          to={`/admin/chat/${shop.id}`}
          className="bg-[#1A3C6E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#142f57] transition"
        >
          💬 Message Shop
        </Link>
      </div>

      {/* Contact + license details */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Shop Details</h2>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Detail label="Owner Name" value={shop.ownerName} />
          <Detail label="Phone" value={shop.phone} />
          <Detail label="Email" value={shop.user?.email} />
          <Detail label="GST Number" value={shop.gstNumber} />
          <Detail label="Drug License" value={shop.drugLicenseNumber} />
          <Detail label="Payment Term" value={shop.paymentTerm} />
          <Detail label="Address" value={shop.address} full />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-xl font-bold text-[#1A3C6E]">{stats.totalOrders}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-700">₹{stats.totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Last Order</p>
          <p className="text-sm font-semibold text-gray-800">
            {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString('en-IN') : 'No orders yet'}
          </p>
        </div>
      </div>

      {/* Order history */}
      <h2 className="font-semibold text-gray-900 mb-3">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center bg-gray-50 rounded-xl">No orders placed yet.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.items.length} items</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>{order.status}</span>
                <span className="font-semibold text-[#1A3C6E] text-sm">₹{order.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <span className="text-gray-400">{label}:</span>{' '}
      <span className="font-medium text-gray-900">{value || '—'}</span>
    </div>
  );
}