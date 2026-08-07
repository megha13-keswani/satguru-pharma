import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  } 

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-[#1A3C6E]">
          Satguru Pharma
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline truncate max-w-[140px]">
              {user.shop?.shopName || user.name}
            </span>
            {user.role === 'WHOLESALER' && (
              <div className="hidden sm:flex items-center gap-4">
                <Link to="/" className="text-sm font-medium text-gray-700 hover:text-[#1A3C6E]">Home</Link>
                <Link to="/cart" className="text-sm font-medium text-gray-700 hover:text-[#1A3C6E]">Cart</Link>
                <Link to="/orders" className="text-sm font-medium text-gray-700 hover:text-[#1A3C6E]">Orders</Link>
                <Link to="/chat" className="text-sm font-medium text-gray-700 hover:text-[#1A3C6E]">Chat</Link>
              </div>
            )}
            {user.role === 'ADMIN' && (
              <>
                <Link to="/admin" className="text-sm font-medium text-gray-700 hover:text-[#1A3C6E]">Admin Panel</Link>
                <Link to="/admin/inbox" className="text-sm font-medium text-gray-700 hover:text-[#1A3C6E]">Messages</Link>
              </>
            )}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-white bg-[#1A3C6E] px-3 py-1.5 rounded-md hover:bg-[#142f57]"
            >
              Logout
            </button>
          </div>
        ) : (
          
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-[#1A3C6E]">Login</Link>
            <Link
              to="/signup"
              className="text-sm font-medium text-white bg-[#1A3C6E] px-3 py-1.5 rounded-md hover:bg-[#142f57]"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}