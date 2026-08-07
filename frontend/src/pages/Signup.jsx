import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({
    shopName: '', ownerName: '', gstNumber: '', drugLicenseNumber: '',
    phone: '', email: '', address: '', password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md border border-gray-100 text-center">
          <h1 className="text-xl font-bold text-[#1A3C6E] mb-2">Signup Successful! 🎉</h1>
          <p className="text-sm text-gray-600 mb-6">
            Your account is pending admin approval. You'll be able to login once approved.
          </p>
          <Link to="/login" className="text-[#1A3C6E] font-medium text-sm">Go to Login</Link>
        </div>
      </div>
    );
  }

  const fields = [
    { name: 'shopName', label: 'Shop Name' },
    { name: 'ownerName', label: 'Owner Name' },
    { name: 'gstNumber', label: 'GST Number' },
    { name: 'drugLicenseNumber', label: 'Drug License Number' },
    { name: 'phone', label: 'Phone' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Address' },
    { name: 'password', label: 'Password', type: 'password' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-[#1A3C6E] mb-1">Register your shop</h1>
        <p className="text-sm text-gray-500 mb-6">Create a wholesaler account — subject to admin approval</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                name={f.name}
                required
                value={form[f.name]}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C6E]"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1A3C6E] text-white py-2 rounded-md text-sm font-medium hover:bg-[#142f57] disabled:opacity-60 mt-2"
          >
            {loading ? 'Submitting...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-[#1A3C6E] font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}