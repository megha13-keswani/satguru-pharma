import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function BottomNav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (user?.role === 'WHOLESALER') {
      client.get('/cart').then((res) => {
        setCartCount(res.data.items?.length || 0);
      }).catch(() => {});
    }
  }, [user, location]);

  if (!user || user.role !== 'WHOLESALER') return null;

  const tabs = [
    { icon: '🏠', label: 'Home', path: '/' },
    { icon: '🔍', label: 'Search', path: '/', isSearch: true },
    { icon: '📦', label: 'Orders', path: '/orders' },
    { icon: '🛒', label: 'Cart', path: '/cart', badge: cartCount },
    { icon: '👤', label: 'Chat', path: '/chat' },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex pb-safe">
      {tabs.map((tab) => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative"
          >
            <span className={`text-xl ${active ? 'opacity-100' : 'opacity-50'}`}>{tab.icon}</span>
            <span className={`text-[10px] font-medium ${active ? 'text-[#1A3C6E]' : 'text-gray-400'}`}>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="absolute top-1 right-6 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}