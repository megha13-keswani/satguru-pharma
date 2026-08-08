import { useEffect, useState, useRef } from 'react';
import client from '../api/client';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  async function load() {
    const res = await client.get('/notifications');
    setNotifications(res.data.notifications);
    setUnreadCount(res.data.unreadCount);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // poll every 8s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen(!open);
    if (!open && unreadCount > 0) {
      await client.post('/notifications/mark-all-read');
      setUnreadCount(0);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-1.5 text-gray-600 hover:text-[#1A3C6E]">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">Notifications</div>
          {notifications.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-50 last:border-0 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}