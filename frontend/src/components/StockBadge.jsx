export default function StockBadge({ status }) {
  const config = {
    IN_STOCK: { label: 'In Stock', class: 'bg-green-100 text-green-700' },
    LOW_STOCK: { label: 'Low Stock', class: 'bg-yellow-100 text-yellow-700' },
    OUT_OF_STOCK: { label: 'Out of Stock', class: 'bg-red-100 text-red-700' },
  };
  const c = config[status] || config.IN_STOCK;

  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.class}`}>
      {c.label}
    </span>
  );
}