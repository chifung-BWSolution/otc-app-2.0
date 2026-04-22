const colorMap = {
  blue: "bg-blue-50 border-blue-100 text-blue-600",
  green: "bg-green-50 border-green-100 text-green-600",
  purple: "bg-purple-50 border-purple-100 text-purple-600",
  orange: "bg-orange-50 border-orange-100 text-orange-600",
  red: "bg-red-50 border-red-100 text-red-600",
  teal: "bg-teal-50 border-teal-100 text-teal-600",
  indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
  pink: "bg-pink-50 border-pink-100 text-pink-600",
};

export default function ReportStatCard({ label, value, sub, color = "blue", icon }) {
  return (
    <div className={`rounded-xl p-3 border text-center ${colorMap[color] || colorMap.blue}`}>
      {icon && <div className="text-lg mb-0.5">{icon}</div>}
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}