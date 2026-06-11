import { useAuth } from "@/lib/AuthContext";
import { Eye, XCircle } from "lucide-react";

export default function ImpersonationBanner() {
  const { isImpersonating, user, realUser, stopImpersonating } = useAuth();

  if (!isImpersonating) return null;

  return (
    <div className="bg-amber-400 text-amber-900 px-4 py-2 flex items-center justify-between gap-3 text-xs font-semibold sticky top-0 z-[100] shadow-md">
      <div className="flex items-center gap-2">
        <Eye size={14} className="shrink-0" />
        <span>
          正在模擬用戶：<strong>{user?.full_name || user?.email}</strong>
          {user?.role && <span className="ml-1 opacity-70">({user.role})</span>}
        </span>
        <span className="opacity-60 ml-2">
          管理員：{realUser?.full_name || realUser?.email}
        </span>
      </div>
      <button
        onClick={stopImpersonating}
        className="flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs font-bold"
      >
        <XCircle size={13} />
        返回管理員
      </button>
    </div>
  );
}
