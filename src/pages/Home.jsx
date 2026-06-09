import { useNavigate } from "react-router-dom";
import { menuGroups } from "@/components/navigation/menuConfig";
import { usePagePermissions } from "@/hooks/usePagePermissions";

// Map menuGroups to home page card colors
const groupColors = {
  company: "bg-blue-500",
  app: "bg-purple-500",
  work: "bg-green-500",
  attendance: "bg-orange-500",
  course: "bg-teal-500",
  business: "bg-pink-500",
  leader: "bg-yellow-500",
  events: "bg-amber-500",
  adminfollow: "bg-red-500",
  settings: "bg-slate-500",
  superadmin: "bg-indigo-500",
};

export default function Home() {
  const navigate = useNavigate();
  const { isPathAllowed, isGroupAllowed, filterAllowedItems, loading } = usePagePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Filter groups: only show groups that have at least one allowed item
  const visibleModules = menuGroups
    .filter(g => isGroupAllowed(g.key))
    .map(g => ({
      ...g,
      color: groupColors[g.key] || "bg-gray-500",
      allowedItems: filterAllowedItems(g.items),
    }))
    .filter(g => g.allowedItems.length > 0);

  return (
    <div className="space-y-3 pb-6">
      {visibleModules.map((mod) => (
        <div key={mod.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-4 pb-2">
          <h3 className="text-sm font-bold text-gray-700 mb-3">{mod.icon} {mod.label}</h3>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {mod.allowedItems.map((item) => {
              const icon = item.label.split(" ")[0];
              const text = item.label.split(" ").slice(1).join(" ");
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl transition-all shadow-sm group-hover:bg-gray-100 group-active:scale-95">
                    {icon}
                  </div>
                  <span className="text-xs text-gray-600 text-center leading-tight w-full truncate px-0.5">{text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}