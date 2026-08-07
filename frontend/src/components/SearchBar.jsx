export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f1b2e] via-[#1A3C6E] to-[#0f1b2e] px-6 py-6">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none text-white text-3xl leading-none">
        <span className="absolute top-3 left-6">💊</span>
        <span className="absolute top-4 right-10 -rotate-12">🩺</span>
        <span className="absolute bottom-3 left-1/3 rotate-6">💉</span>
        <span className="absolute bottom-2 right-1/4">📦</span>
      </div>

      <div className="relative z-10 max-w-lg mx-auto text-center">
        <h1 className="text-white text-base sm:text-lg font-semibold mb-3 tracking-tight">
          Search Medicines / Products
        </h1>

        <div className="flex items-center bg-white rounded-full shadow-md overflow-hidden">
          <svg className="w-4 h-4 text-gray-400 ml-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Search for... name, salt, brand'}
            className="w-full px-3 py-2.5 text-sm text-gray-800 focus:outline-none"
          />
          <button
            type="button"
            className="shrink-0 m-1 w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}