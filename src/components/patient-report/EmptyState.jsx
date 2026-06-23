export default function EmptyState({ title, description, icon = '📋' }) {
  return (
    <div className="text-center py-10 px-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{description}</p>}
    </div>
  );
}
