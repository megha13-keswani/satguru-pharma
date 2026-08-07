import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import SearchBar from '../components/SearchBar';
import CategoryPills from '../components/CategoryPills';
import MedicineCard from '../components/MedicineCard';
import ReorderSuggestions from '../components/ReorderSuggestions';

export default function MedicineListing() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    client.get('/medicines/categories').then((res) => setCategories(res.data.categories));
  }, []);

  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try {
      if (search.trim()) {
        const res = await client.get('/medicines/search', { params: { q: search } });
        setMedicines(res.data.items);
      } else {
        const res = await client.get('/medicines', {
          params: activeCategory ? { category: activeCategory } : {},
        });
        setMedicines(res.data.items);
      }
    } catch (err) {
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

  useEffect(() => {
    const timer = setTimeout(loadMedicines, 300);
    return () => clearTimeout(timer);
  }, [loadMedicines]);

  async function handleAddToCart(medicineId, quantityStrips) {
    try {
      await client.post('/cart/items', { medicineId, quantityStrips });
      setToast('Added to cart ✓');
      setTimeout(() => setToast(''), 1800);
    } catch (err) {
      setToast(err.response?.data?.error || 'Could not add to cart');
      setTimeout(() => setToast(''), 2500);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="-mx-4 px-4 mb-4">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="sticky top-[57px] z-40 bg-gray-50/95 backdrop-blur pt-2 pb-4 -mx-4 px-4">
        <CategoryPills categories={categories} active={activeCategory} onSelect={setActiveCategory} />
        <ReorderSuggestions onAddToCart={handleAddToCart} />
      </div>

      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-24 text-gray-400">No medicines found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {medicines.map((m) => (
            <MedicineCard key={m.id} medicine={m} onAddToCart={handleAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}