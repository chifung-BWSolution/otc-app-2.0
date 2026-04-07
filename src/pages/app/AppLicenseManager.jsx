import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, RotateCcw, Search, Users, ShieldCheck, AlertCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DEPTS = ["市場部", "銷售部", "IT部", "財務部", "人事部", "行政部"];

export default function AppLicenseManager() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedApp, setExpandedApp] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(null); // app object
  const [assignForm, setAssignForm] = useState({ user_email: "", user_name: "", department: "", note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [a, asn, u] = await Promise.all([
      base44.entities.CompanyApp.list("-created_date", 200),
      base44.entities.AppLicenseAssignment.filter({ status: "使用中" }, "-created_date", 500),
      base44.entities.User.list(),
    ]);
    setApps(a);
    setAssignments(asn);
    setUsers(u);
    setLoading(false);
  };

  const getAppStats = (appId, totalLicenses) => {
    const active = assignments.filter(a => a.app_id === appId && a.status === "使用中");
    const used = active.length;
    const total = totalLicenses || 0;
    const remaining = total > 0 ? Math.max(0, total - used) : null;
    return { used, total, remaining, active };
  };

  const handleAssign = async () => {
    if (!assignForm.user_email || !showAssignModal) return;
    setSaving(true);
    // Check if already assigned
    const existing = assignments.find(a => a.app_id === showAssignModal.id && a.user_email === assignForm.user_email && a.status === "使用中");
    if (existing) {
      alert("此用戶已有授權");
      setSaving(false);
      return;
    }
    await base44.entities.AppLicenseAssignment.create({
      app_id: showAssignModal.id,
      app_name: showAssignModal.name,
      user_email: assignForm.user_email,
      user_name: assignForm.user_name || assignForm.user_email,
      department: assignForm.department,
      note: assignForm.note,
      assigned_by: currentUser?.full_name || currentUser?.email,
      assigned_at: new Date().toLocaleString("zh-HK"),
      status: "使用中",
    });
    setSaving(false);
    setShowAssignModal(null);
    setAssignForm({ user_email: "", user_name: "", department: "", note: "" });
    loadAll();
  };

  const handleRevoke = async (assignment) => {
    if (!confirm(`確認回收 ${assignment.user_name || assignment.user_email} 的授權？`)) return;
    await base44.entities.AppLicenseAssignment.update(assignment.id, { status: "已回收" });
    loadAll();
  };

  const selectUser = (email) => {
    const u = users.find(u => u.email === email);
    setAssignForm(f => ({ ...f, user_email: email, user_name: u?.full_name || "", department: f.department }));
  };

  const filteredApps = apps.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.includes(search)
  );

  // Overall stats
  const totalAssigned = assignments.length;
  const appsWithLicense = apps.filter(a => a.total_licenses > 0);
  const overAllocated = appsWithLicense.filter(a => {
    const { used, total } = getAppStats(a.id, a.total_licenses);
    return used > total;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/store")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">App 授權管理</h1>
          <p className="text-xs text-gray-500">管理各 App 的授權分配與回收</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-blue-600">{apps.length}</div>
          <div className="text-xs text-gray-500">App 總數</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-green-600">{totalAssigned}</div>
          <div className="text-xs text-gray-500">已分配授權</div>
        </div>
        <div className={`border rounded-xl p-3 text-center ${overAllocated.length > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
          <div className={`text-2xl font-black ${overAllocated.length > 0 ? "text-red-500" : "text-gray-400"}`}>{overAllocated.length}</div>
          <div className="text-xs text-gray-500">超額分配</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
        <input
          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
          placeholder="搜尋 App..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* App List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">載入中...</div>
      ) : (
        <div className="space-y-2">
          {filteredApps.map(app => {
            const { used, total, remaining, active } = getAppStats(app.id, app.total_licenses);
            const isExpanded = expandedApp === app.id;
            const isOver = total > 0 && used > total;
            const usagePct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : null;

            return (
              <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* App Row */}
                <div className="flex items-center gap-3 p-3">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{app.name?.[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{app.name}</span>
                      {isOver && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><AlertCircle size={10} />超額</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {/* License stats */}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Users size={11} /> 已分配 <span className="font-bold text-gray-800">{used}</span>
                        {total > 0 && <> / <span className="font-bold text-gray-800">{total}</span> 授權</>}
                      </span>
                      {remaining !== null && (
                        <span className={`text-xs font-medium ${remaining === 0 ? "text-red-500" : remaining <= 3 ? "text-orange-500" : "text-green-600"}`}>
                          剩餘 {remaining}
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    {usagePct !== null && (
                      <div className="mt-1.5 bg-gray-100 rounded-full h-1.5 w-full">
                        <div
                          className={`h-1.5 rounded-full transition-all ${isOver ? "bg-red-500" : usagePct > 80 ? "bg-orange-400" : "bg-green-500"}`}
                          style={{ width: `${Math.min(100, usagePct)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setShowAssignModal(app)}
                      className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-200 font-semibold transition-colors"
                    >
                      <Plus size={12} /> 分配
                    </button>
                    <button
                      onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: Assignment List */}
                {isExpanded && (
                  <div className="border-t border-gray-50 bg-gray-50/50 p-3 space-y-2">
                    {active.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">尚未分配任何授權</p>
                    ) : (
                      active.map(asn => (
                        <div key={asn.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                              {(asn.user_name || asn.user_email)[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-gray-800 truncate">{asn.user_name || asn.user_email}</div>
                              <div className="text-xs text-gray-400 truncate">{asn.user_email} {asn.department && `· ${asn.department}`}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-400">{asn.assigned_at?.slice(0, 10)}</span>
                            <button
                              onClick={() => handleRevoke(asn)}
                              className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <RotateCcw size={10} /> 回收
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900">分配授權</h3>
                <p className="text-xs text-gray-500">{showAssignModal.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* License info */}
              {showAssignModal.total_licenses > 0 && (() => {
                const { used, total, remaining } = getAppStats(showAssignModal.id, showAssignModal.total_licenses);
                return (
                  <div className={`rounded-xl p-3 flex items-center gap-3 ${remaining === 0 ? "bg-red-50 border border-red-100" : "bg-blue-50 border border-blue-100"}`}>
                    <ShieldCheck size={20} className={remaining === 0 ? "text-red-400" : "text-blue-500"} />
                    <div className="text-sm">
                      <span className="font-bold">{used}</span> / <span className="font-bold">{total}</span> 已使用
                      {remaining !== null && <span className={`ml-2 font-semibold ${remaining === 0 ? "text-red-600" : "text-green-600"}`}>（剩餘 {remaining}）</span>}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">選擇用戶 *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={assignForm.user_email}
                  onChange={e => selectUser(e.target.value)}
                >
                  <option value="">-- 選擇用戶 --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.email}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">部門</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={assignForm.department}
                  onChange={e => setAssignForm(f => ({ ...f, department: e.target.value }))}
                >
                  <option value="">-- 選擇部門 --</option>
                  {DEPTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">備注（選填）</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="例如：臨時授權、試用..."
                  value={assignForm.note}
                  onChange={e => setAssignForm(f => ({ ...f, note: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAssign}
                  disabled={saving || !assignForm.user_email}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {saving ? "分配中..." : "✅ 確認分配"}
                </button>
                <button
                  onClick={() => setShowAssignModal(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}