import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { menuGroups, findGroupByPath } from "./menuConfig";

export default function TopNavBar({ activeKey, setActiveKey, isMGT, userRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentGroup = findGroupByPath(location.pathname);

  const isAdmin = userRole === 'admin' || userRole === 'management';

  const isActive = (key) => {
    return activeKey === key || (activeKey == null && currentGroup?.key === key);
  };

  // Non-admin users can only access "work" group
  const isGroupEnabled = (key) => {
    if (isAdmin) return true;
    return key === "work";
  };

  const isHome = location.pathname === "/";

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm overflow-x-auto">
      <div className="flex items-center gap-1 px-3 py-2 min-w-max">
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

        {menuGroups.filter(g => g.key !== "superadmin" || isMGT).map((g) => {
          const active = isActive(g.key);
          const enabled = isGroupEnabled(g.key);
          return (
            <button
              key={g.key}
              onClick={() => {
                if (!enabled) return;
                setActiveKey(g.key);
                if (g.items[0]) navigate(g.items[0].path);
              }}
              disabled={!enabled}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                !enabled
                  ? "text-gray-300 cursor-not-allowed"
                  : active
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