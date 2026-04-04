export default function Placeholder({ title, icon, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center p-8">
      <div className="text-6xl mb-4">{icon || "🚧"}</div>
      <h2 className="text-xl font-bold text-gray-700">{title || "頁面建設中"}</h2>
      <p className="text-gray-500 mt-2 text-sm">{description || "此功能正在開發中，敬請期待！"}</p>
    </div>
  );
}