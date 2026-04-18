import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { menuGroups, findGroupByPath } from "./menuConfig";

export default function TopNavBar({ activeKey, setActiveKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentGroup = findGroupByPath(location.pathname);

  const isActive = (key) => {
    // Active if explicitly selected by user, OR matches current route's group
    return activeKey === key || (activeKey == null && currentGroup?.key === key);
  };

  const isHome = location.pathname === "/";

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-1 px-3 py-2 min-w-max">
        {/* Home button */}
        <button
          onClick={() => { navigate("/"); setActiveKey(null); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
            isHome
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Home size={15} />
          <span>主頁</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {menuGroups.map((g) => {
          const active = isActive(g.key);
          return (
            <button
              key={g.key}
              onClick={() => {
                setActiveKey(g.key);
                // 如果該分類第一個 item 存在，直接導航到它
                if (g.items[0]) navigate(g.items[0].path);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                active
                  ? `bg-gradient-to-r ${g.gradient} text-white shadow-md`
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{g.icon}</span>
              <span>{g.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}