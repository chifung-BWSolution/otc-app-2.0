import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown, Shield } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function UserMenu({ currentUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { logout } = useAuth();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout(true);
  };

  const initials = currentUser?.full_name?.[0] || currentUser?.email?.[0] || "?";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
          {initials.toUpperCase()}
        </div>
        <ChevronDown size={12} className={`text-gray-400 transition-transform hidden sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                {initials.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {currentUser?.full_name || "—"}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {currentUser?.email || ""}
                </div>
                {currentUser?.role && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Shield size={10} className="text-indigo-500" />
                    <span className="text-[10px] text-indigo-600 font-medium">{currentUser.role}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="px-2 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={15} />
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
}