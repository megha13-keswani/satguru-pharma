import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const STATUS_STYLE = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  DISPATCHED: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/orders').then((res) => {
      setOrders(res.data.orders);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-24 text-gray-400">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">No orders yet</h2>
        <Link to="/" className="text-[#1A3C6E] font-semibold text-sm">Browse Medicines</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order History</h1>

      <div className="space-y-3">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900 text-sm">{order.orderNumber}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.items.length} items</span>
              <span className="font-semibold text-[#1A3C6E]">₹{order.grandTotal.toFixed(2)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}