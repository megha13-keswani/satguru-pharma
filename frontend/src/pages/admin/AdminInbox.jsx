import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';

export default function AdminInbox() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/chat/admin/inbox').then((res) => {
      setShops(res.data.shops);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-24 text-gray-400">Loading inbox...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="space-y-2">
        {shops.map((shop) => {
          const lastMsg = shop.messages[0];
          const unread = shop._count.messages;
          return (
            <Link
              key={shop.id}
              to={`/admin/chat/${shop.id}`}
              className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">{shop.shopName}</h3>
                {unread > 0 && (
                  <span className="bg-[#1A3C6E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">
                {lastMsg ? lastMsg.body : 'No messages yet'}
              </p>
            </Link>
          );
        })}
        {shops.length === 0 && <p className="text-center text-gray-400 py-12">No approved shops yet.</p>}
      </div>
    </div>
  );
}