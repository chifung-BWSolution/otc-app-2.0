import { useState, useMemo } from "react";
import { Search, BarChart2 } from "lucide-react";
import { filterBalancesByRole } from "@/lib/leavePermissions";

export default function LeaveBalancesTab({ balances, loading, user, userRole, userDept }) {
  const [search, setSearch] = useState("");

  const filtered = filterBalancesByRole(balances, userRole, user?.email, userDept);
  const displayed = filtered.filter(b => {
    if (!search) return true;
    return b.user_name?.includes(search) || b.leave_type_name?.includes(search) || b.leave_type_code?.includes(search);
  });

  // Group by user
  const grouped = useMemo(() => {
    const map = {};
    for (const b of displayed) {
      const key = b.user_email;
      if (!map[key]) map[key] = { name: b.user_name || b.user_email, dept: b.dept, items: [] };
      map[key].items.push(b);
    }
    return Object.values(map);
  }, [displayed]);

  // Summary stats
  const totalEntitlement = filtered.reduce((s, b) => s + (b.entitlement || 0), 0);
  const totalUsed = filtered.reduce((s, b) => s + (b.used || 0), 0);
  const totalRemaining = filtered.reduce((s, b) => s + (b.remaining || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalEntitlement}</div>
          <div className="text-xs text-gray-500">總額度（天）</div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{totalUsed}</div>
          <div className="text-xs text-gray-500">已使用（天）</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalRemaining}</div>
          <div className="text-xs text-gray-500">剩餘（天）</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="搜尋員工/假期類型..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Balance Tables */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-3xl mb-2">📊</div>
          <p>暫無假期餘額資料</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group, gi) => (
            <div key={gi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-gray-900">{group.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{group.dept}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <BarChart2 size={12} />
                  {group.items.length} 項
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="text-left px-4 py-2 font-semibold">假期類型</th>
                      <th className="text-center px-3 py-2 font-semibold">額度</th>
                      <th className="text-center px-3 py-2 font-semibold">已用</th>
                      <th className="text-center px-3 py-2 font-semibold">剩餘</th>
                      <th className="px-4 py-2 font-semibold">使用率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((b, i) => {
                      const pct = b.entitlement > 0 ? Math.round((b.used / b.entitlement) * 100) : 0;
                      return (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-gray-800">{b.leave_type_name}</span>
                            <span className="text-xs text-gray-400 ml-1">({b.leave_type_code})</span>
                          </td>
                          <td className="text-center px-3 py-2.5 font-bold text-blue-600">{b.entitlement}</td>
                          <td className="text-center px-3 py-2.5 font-bold text-orange-600">{b.used}</td>
                          <td className="text-center px-3 py-2.5 font-bold text-green-600">{b.remaining}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-orange-400" : "bg-green-400"}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}