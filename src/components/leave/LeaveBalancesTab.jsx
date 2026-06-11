import { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, ChevronDown, ChevronRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LeaveBalancesTab({ user, userRole }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState([]);
  const [expandedStaff, setExpandedStaff] = useState({});
  const [error, setError] = useState(null);

  const loadBalances = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.functions.invoke("leaveBalanceCalc", {});
      console.log("[LeaveBalancesTab] Response:", JSON.stringify(data));
      if (data?.error) {
        setError(`Edge Function 錯誤: ${JSON.stringify(data)}`);
        return;
      }
      setBalanceData(data?.results || []);
    } catch (err) {
      console.error("Failed to load balances:", err);
      setError(`載入失敗: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return balanceData;
    const s = search.toLowerCase();
    return balanceData.filter(b => b.staff_name?.toLowerCase().includes(s));
  }, [balanceData, search]);

  // Summary stats
  const totalQuota = filtered.reduce((s, b) => s + (b.total_quota || 0), 0);
  const totalUsed = filtered.reduce((s, b) => s + (b.total_approved_used || 0), 0);
  const totalPending = filtered.reduce((s, b) => s + (b.total_pending_used || 0), 0);
  const totalBalance = filtered.reduce((s, b) => s + (b.balance_excluding_pending || b.balance || 0), 0);

  const toggleExpand = (name) => {
    setExpandedStaff(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalQuota}</div>
          <div className="text-xs text-gray-500">總額度（天）</div>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{totalUsed}</div>
          <div className="text-xs text-gray-500">已批核使用</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
          <div className="text-xs text-gray-500">待批核（未扣）</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalBalance}</div>
          <div className="text-xs text-gray-500">可用餘額（天）</div>
          {totalPending > 0 && (
            <div className="text-[10px] text-yellow-600 mt-1">（待批核 {totalPending} 天另計）</div>
          )}
        </div>
      </div>

      {/* Search + Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="搜尋員工..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={loadBalances}
          disabled={loading}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Balance List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">
          <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
          計算中...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-3xl mb-2">📊</div>
          <p>暫無假期餘額資料</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((staff) => {
            const isExpanded = expandedStaff[staff.staff_name];
            const balanceDisplay = staff.balance_excluding_pending ?? staff.balance ?? 0;
            const pct = staff.total_quota > 0
              ? Math.round((staff.total_approved_used / staff.total_quota) * 100)
              : 0;

            return (
              <div key={staff.staff_name} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Staff Header */}
                <button
                  onClick={() => toggleExpand(staff.staff_name)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                  
                  <span className="font-bold text-sm text-gray-900 flex-1 text-left">{staff.staff_name}</span>
                  
                  {/* Balance display */}
                  <div className="flex items-center gap-3">
                    {staff.total_pending_used > 0 && (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={10} />
                        −{staff.total_pending_used}日待批核
                      </span>
                    )}
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">{balanceDisplay}</span>
                      <span className="text-xs text-gray-400 ml-1">/ {staff.total_quota}日</span>
                    </div>
                  </div>
                </button>

                {/* Progress bar */}
                <div className="px-4 pb-2">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    {/* Approved used */}
                    <div
                      className="h-full bg-orange-400 transition-all"
                      style={{ width: `${staff.total_quota > 0 ? (staff.total_approved_used / staff.total_quota) * 100 : 0}%` }}
                    />
                    {/* Pending used */}
                    <div
                      className="h-full bg-yellow-300 transition-all"
                      style={{ width: `${staff.total_quota > 0 ? (staff.total_pending_used / staff.total_quota) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                    <span>已批 {staff.total_approved_used}日{staff.total_pending_used > 0 ? ` + 待批 ${staff.total_pending_used}日` : ''}</span>
                    <span>{pct}% 已用</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {staff.year_details?.map((yd) => {
                      const ydBalanceDisplay = yd.balance_excluding_pending ?? (yd.total_quota - yd.approved_used);
                      return (
                        <div key={yd.count_year} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">
                              年度 {yd.count_year_label}
                            </span>
                            <span className="text-xs text-gray-400">
                              到期：{yd.expiry_date}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-blue-50 rounded-lg p-2">
                              <div className="font-bold text-blue-600">{yd.total_quota}</div>
                              <div className="text-gray-400">額度</div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2">
                              <div className="font-bold text-orange-600">{yd.approved_used}</div>
                              <div className="text-gray-400">已批</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-2">
                              <div className="font-bold text-yellow-600">{yd.pending_used}</div>
                              <div className="text-gray-400">待批</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                              <div className="font-bold text-green-600">{ydBalanceDisplay}</div>
                              <div className="text-gray-400">餘額</div>
                              {yd.pending_used > 0 && (
                                <div className="text-[10px] text-yellow-600 mt-0.5">−{yd.pending_used}待批</div>
                              )}
                            </div>
                          </div>

                          {/* Leave details */}
                          {(yd.approved_leaves?.length > 0 || yd.pending_leaves?.length > 0) && (
                            <div className="space-y-1 mt-2">
                              {yd.approved_leaves?.map((l, i) => (
                                <div key={`a-${i}`} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                  <CheckCircle2 size={10} className="text-green-500 shrink-0" />
                                  <span className="flex-1">{l.leave_type}</span>
                                  <span className="text-gray-400">{l.days}日</span>
                                  <span className="text-gray-400 text-[10px] truncate max-w-[120px]">{l.start?.split(",")[0]}</span>
                                </div>
                              ))}
                              {yd.pending_leaves?.map((l, i) => (
                                <div key={`p-${i}`} className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                                  <Clock size={10} className="text-yellow-500 shrink-0" />
                                  <span className="flex-1">{l.leave_type}</span>
                                  <span className="text-yellow-600">{l.days}日</span>
                                  <span className="text-yellow-400 text-[10px] truncate max-w-[120px]">{l.start?.split(",")[0]}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}