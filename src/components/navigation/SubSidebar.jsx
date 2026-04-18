import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { menuGroups, findGroupByPath } from "./menuConfig";

export default function SubSidebar({ activeKey, collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer explicit activeKey; otherwise derive from current route
  const routeGroup = findGroupByPath(location.pathname);
  const currentGroup =
    menuGroups.find((g) => g.key === activeKey) || routeGroup;

  // On homepage with no active group, don't show sidebar
  if (!currentGroup) return null;

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      <aside
        className={`fixed md:sticky top-0 md:top-[57px] left-0 md:h-[calc(100vh-57px)] h-full bg-white shadow-lg md:shadow-none border-r border-gray-200 z-30 transition-all duration-300 flex flex-col ${
          collapsed ? "-translate-x-full md:translate-x-0 md:w-12" : "w-60"
        }`}
      >
        {/* Group header */}
        <div
          className={`flex items-center justify-between px-3 py-3 bg-gradient-to-r ${currentGroup.gradient} text-white shrink-0`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentGroup.icon}</span>
              <span className="font-bold text-sm">{currentGroup.label}</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-auto"
          >
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-2">
          {currentGroup.items.map((item) => {
            const active = location.pathname === item.path;
            const icon = item.label.split(" ")[0];
            const text = item.label.split(" ").slice(1).join(" ");
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) setCollapsed(true);
                }}
                title={item.label}
                className={`w-full flex items-center py-2 text-sm transition-all hover:bg-gray-100 ${
                  collapsed ? "px-0 justify-center" : "px-4"
                } ${
                  active
                    ? `${currentGroup.bg} ${currentGroup.color} font-semibold border-r-4 ${currentGroup.border}`
                    : "text-gray-700"
                }`}
              >
                <span className="text-base">{icon}</span>
                {!collapsed && (
                  <span className="ml-2 text-left text-xs">{text}</span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}