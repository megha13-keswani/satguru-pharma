export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] px-6 py-8">
      {/* Wavy line pattern background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" preserveAspectRatio="none" viewBox="0 0 800 200">
        <path d="M0,60 Q200,20 400,60 T800,60" stroke="white" strokeWidth="1" fill="none" />
        <path d="M0,100 Q200,140 400,100 T800,100" stroke="white" strokeWidth="1" fill="none" />
        <path d="M0,140 Q200,100 400,140 T800,140" stroke="white" strokeWidth="1" fill="none" />
        <path d="M0,20 Q200,60 400,20 T800,20" stroke="white" strokeWidth="1" fill="none" />
      </svg>

      {/* Medical icon pattern */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none select-none text-white">
        <svg className="absolute top-3 left-4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
        <svg className="absolute top-8 left-24 -rotate-45" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="9" y="2" width="6" height="6" rx="1" />
          <line x1="12" y1="8" x2="12" y2="20" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
        <svg className="absolute top-2 right-16" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="7" x2="12" y2="17" />
          <line x1="7" y1="12" x2="17" y2="12" />
        </svg>
        <svg className="absolute bottom-3 left-10" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="9" width="16" height="11" rx="2" />
          <path d="M8 9V6a4 4 0 018 0v3" />
        </svg>
        <svg className="absolute bottom-4 right-24" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="8" cy="8" rx="5" ry="5" transform="rotate(-45 8 8)" />
          <line x1="12" y1="12" x2="20" y2="20" />
          <line x1="15" y1="9" x2="17" y2="11" />
        </svg>
        <svg className="absolute bottom-2 right-4" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 21C7 17 3 13.5 3 9.5 3 6.5 5.5 4 8.5 4c1.7 0 3 .8 3.5 2 .5-1.2 1.8-2 3.5-2C18.5 4 21 6.5 21 9.5c0 4-4 7.5-9 11.5z" />
        </svg>
        <svg className="absolute top-1/2 left-1/3 -translate-y-1/2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <line x1="9" y1="8" x2="15" y2="8" />
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto text-center">
        <h1 className="text-white text-base sm:text-lg font-semibold mb-3 tracking-tight">
          Search Medicines / General Products
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
