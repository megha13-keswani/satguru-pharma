import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/orders/${id}`).then((res) => {
      setOrder(res.data.order);
      setLoading(false);
    });
    client.get(`/invoices/${id}`).then((res) => {
      setInvoiceUrl(res.data.invoice?.pdfUrl);
    }).catch(() => {});
  }, [id]);

  if (loading) {
    return <div className="text-center py-24 text-gray-400">Loading order...</div>;
  }

  if (!order) {
    return <div className="text-center py-24 text-gray-400">Order not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
          {order.status}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Items</h2>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600 py-1 border-b border-gray-50 last:border-0">
              <span>{item.medicineName} x {item.quantityStrips} strips</span>
              <span className="font-medium text-gray-900">Rs.{item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3 mt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span>Rs.{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>GST</span>
            <span>Rs.{order.gstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-1">
            <span>Grand Total</span>
            <span>Rs.{order.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Invoice</h2>
        {invoiceUrl ? (<a href={invoiceUrl} target="_blank" rel="noreferrer" className="inline-block bg-[#1A3C6E] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#142f57] transition">Download Invoice PDF</a>) : (<p className="text-sm text-gray-400">Invoice is being generated - refresh in a moment.</p>)}
      </div>

      <Link to="/orders" className="text-[#1A3C6E] font-semibold text-sm">
        Back to Orders
      </Link>
    </div>
    );
}