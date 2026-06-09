import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { menuGroups, findGroupByPath } from "./menuConfig";

export default function SubSidebar({ activeKey, collapsed, setCollapsed, userRole, isPathAllowed }) {
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
        className={`fixed md:relative top-0 left-0 h-full bg-white shadow-lg md:shadow-none border-r border-gray-200 z-30 md:z-auto transition-all duration-300 flex flex-col ${
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
          {currentGroup.sections ? (
            // Render items grouped by sections
            currentGroup.sections.map((section, sIdx) => {
              const filteredItems = section.items.filter(item => isPathAllowed ? isPathAllowed(item.path) : true);
              if (filteredItems.length === 0) return null;
              return (
                <div key={sIdx}>
                  {!collapsed && (
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{section.title}</span>
                    </div>
                  )}
                  {collapsed && sIdx > 0 && (
                    <div className="mx-2 my-1 border-t border-gray-200" />
                  )}
                  {filteredItems.map((item) => {
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
                        className={`w-full flex items-center py-2 text-sm transition-all ${
                          collapsed ? "px-0 justify-center" : "px-4"
                        } ${
                          active
                            ? `${currentGroup.bg} ${currentGroup.color} font-semibold border-r-4 ${currentGroup.border}`
                            : "text-gray-700 hover:bg-gray-100"
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
              );
            })
          ) : (
            // Render flat items list
            currentGroup.items
              .filter((item) => isPathAllowed ? isPathAllowed(item.path) : true)
              .map((item) => {
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
                  className={`w-full flex items-center py-2 text-sm transition-all ${
                    collapsed ? "px-0 justify-center" : "px-4"
                  } ${
                    active
                      ? `${currentGroup.bg} ${currentGroup.color} font-semibold border-r-4 ${currentGroup.border}`
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {!collapsed && (
                    <span className="ml-2 text-left text-xs">{text}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}