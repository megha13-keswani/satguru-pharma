import { useEffect, useState } from 'react';
import client from '../../api/client';

const STATUS_STYLE = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  DISPATCHED: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function RevenueReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    client.get('/admin/revenue-by-date').then((res) => {
      setData(res.data.revenueByDate);
      setLoading(false);
    });
  }, []);

  async function handleDateClick(date) {
    if (expandedDate === date) {
      setExpandedDate(null);
      setDetail(null);
      return;
    }
    setExpandedDate(date);
    setDetailLoading(true);
    const res = await client.get(`/admin/revenue-by-date/${date}`);
    setDetail(res.data.shops);
    setDetailLoading(false);
  }

  if (loading) return <div className="text-center py-24 text-gray-400">Loading...</div>;

  const grandTotal = data.reduce((s, d) => s + d.totalRevenue, 0);
  const grandPending = data.reduce((s, d) => s + d.totalPending, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Revenue Report</h1>
      <p className="text-sm text-gray-500 mb-6">Click a date to see shop-wise breakdown</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Revenue (all time)</p>
          <p className="text-xl font-bold text-green-700">₹{grandTotal.toFixed(0)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total Pending</p>
          <p className="text-xl font-bold text-red-600">₹{grandPending.toFixed(0)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((d) => {
          const isOpen = expandedDate === d.date;
          return (
            <div key={d.date} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => handleDateClick(d.date)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400">{d.orderCount} orders</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-500">Billed: <b className="text-gray-900">₹{d.totalRevenue.toFixed(0)}</b></span>
                  <span className="text-green-600">Paid: <b>₹{d.totalPaid.toFixed(0)}</b></span>
                  {d.totalPending > 0 && <span className="text-red-500">Pending: <b>₹{d.totalPending.toFixed(0)}</b></span>}
                  <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-100">
                  {detailLoading ? (
                    <p className="text-center text-gray-400 py-6 text-sm">Loading...</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                          <th className="text-left px-4 py-2">Shop</th>
                          <th className="text-right px-4 py-2">Orders</th>
                          <th className="text-right px-4 py-2">Billed</th>
                          <th className="text-right px-4 py-2">Paid</th>
                          <th className="text-right px-4 py-2">Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail?.map((shop) => (
                          <tr key={shop.shopId} className="border-t border-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-900">{shop.shopName}</td>
                            <td className="px-4 py-2 text-right">{shop.orderCount}</td>
                            <td className="px-4 py-2 text-right">₹{shop.totalBilled.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-green-600">₹{shop.totalPaid.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right text-red-500">₹{shop.totalPending.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {data.length === 0 && <p className="text-center text-gray-400 py-12 bg-white rounded-xl">No revenue data yet.</p>}
      </div>
    </div>
  );
}