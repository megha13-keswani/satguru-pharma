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

export default function ShopOrdersMatrix() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    client.get('/admin/orders-matrix').then((res) => {
      setShops(res.data.shops);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Shop-wise Orders</h1>
      <p className="text-sm text-gray-500 mb-6">Click a shop to see all its orders</p>

      <div className="space-y-2">
        {shops.map((shop) => {
          const totalRevenue = shop.orders.reduce((s, o) => s + o.grandTotal, 0);
          const totalPending = shop.orders.reduce((s, o) => s + (o.grandTotal - o.amountPaid), 0);
          const isOpen = expanded === shop.id;

          return (
            <div key={shop.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : shop.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{shop.shopName}</p>
                  <p className="text-xs text-gray-400">{shop.orders.length} orders</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Revenue: <b className="text-[#1A3C6E]">₹{totalRevenue.toFixed(0)}</b></span>
                  {totalPending > 0 && (
                    <span className="text-red-500">Pending: <b>₹{totalPending.toFixed(0)}</b></span>
                  )}
                  <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="text-left px-4 py-2">Order #</th>
                        <th className="text-left px-4 py-2">Date</th>
                        <th className="text-right px-4 py-2">Total</th>
                        <th className="text-right px-4 py-2">Paid</th>
                        <th className="text-right px-4 py-2">Pending</th>
                        <th className="text-center px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shop.orders.map((o) => (
                        <tr key={o.id} className="border-t border-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">{o.orderNumber}</td>
                          <td className="px-4 py-2 text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-2 text-right">₹{o.grandTotal.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-green-600">₹{o.amountPaid.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right text-red-500">₹{(o.grandTotal - o.amountPaid).toFixed(2)}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 text-right">
                    <Link to={`/admin/shops/${shop.id}`} className="text-xs text-[#1A3C6E] font-semibold hover:underline">
                      View full shop profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}