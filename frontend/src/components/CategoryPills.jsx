export default function CategoryPills({ categories, active, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect('')}
        className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition ${
          active === ''
            ? 'bg-[#1A3C6E] text-white border-[#1A3C6E]'
            : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A3C6E]'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 text-sm font-medium px-4 py-1.5 rounded-full border transition ${
            active === cat.id
              ? 'bg-[#1A3C6E] text-white border-[#1A3C6E]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A3C6E]'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}