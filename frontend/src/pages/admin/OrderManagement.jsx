import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';

const STATUS_STYLE = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  DISPATCHED: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUSES = ['PLACED', 'CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  async function loadOrders() {
    setLoading(true);
    const res = await client.get('/orders/admin/all', { params: filter ? { status: filter } : {} });
    setOrders(res.data.orders);
    setLoading(false);
  }

  useEffect(() => { loadOrders(); }, [filter]);

  async function updateStatus(orderId, status) {
    setUpdating(orderId);
    await client.patch(`/orders/${orderId}/status`, { status });
    await loadOrders();
    setUpdating(null);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Order Management</h1>
      <p className="text-sm text-gray-500 mb-6">{orders.length} orders</p>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter('')}
          className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border ${!filter ? 'bg-[#1A3C6E] text-white border-[#1A3C6E]' : 'bg-white text-gray-600 border-gray-200'}`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border ${filter === s ? 'bg-[#1A3C6E] text-white border-[#1A3C6E]' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                  <Link to={`/admin/shops/${order.shop.id}`} className="text-xs text-gray-500 hover:text-[#1A3C6E]">
                    {order.shop.shopName}
                  </Link>
                </div>
                <span className="font-semibold text-[#1A3C6E]">₹{order.grandTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.items.length} items
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>{order.status}</span>
                <select
                  value={order.status}
                  disabled={updating === order.id}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="ml-auto text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]/20"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}