import { useState } from "react";
import { CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { canApproveReject, canEditCancel, filterRecordsByRole } from "@/lib/leavePermissions";

const STATUS_CONFIG = {
  "審查中": { icon: Clock, color: "bg-yellow-100 text-yellow-700", iconColor: "text-yellow-500" },
  "已批核": { icon: CheckCircle, color: "bg-green-100 text-green-700", iconColor: "text-green-500" },
  "不批核": { icon: XCircle, color: "bg-red-100 text-red-700", iconColor: "text-red-500" },
};

export default function LeaveRecordsTab({ records, loading, user, userRole, userDept, onRefresh }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  const filtered = filterRecordsByRole(records, userRole, user?.email, userDept);
  const displayed = filtered.filter(r => {
    const matchSearch = !search || r.user_name?.includes(search) || r.leave_type?.includes(search) || r.dept?.includes(search);
    const matchStatus = statusFilter === "全部" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = async (record, action) => {
    await base44.entities.LeaveRequest.update(record.id, {
      status: action,
      approver_email: user.email,
      approver_name: user.full_name,
      reviewed_at: new Date().toISOString(),
      review_note: reviewNote,
    });
    setReviewingId(null);
    setReviewNote("");
    onRefresh?.();
  };

  const handleCancel = async (record) => {
    await base44.entities.LeaveRequest.delete(record.id);
    onRefresh?.();
  };

  const pendingCount = filtered.filter(r => r.status === "審查中").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-xs text-gray-500">審查中</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{filtered.filter(r => r.status === "已批核").length}</div>
          <div className="text-xs text-gray-500">已批核</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-600">{filtered.filter(r => r.status === "不批核").length}</div>
          <div className="text-xs text-gray-500">不批核</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="搜尋員工/假期類型..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {["全部", "審查中", "已批核", "不批核"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <div className="text-3xl mb-2">📋</div>
          <p>暫無假期記錄</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(r => {
            const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG["審查中"];
            const Icon = cfg.icon;
            const showApproval = r.status === "審查中" && canApproveReject(userRole, userDept, r.dept);
            const showCancel = canEditCancel(userRole);

            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{r.user_name || r.user_email}</span>
                      <span className="text-xs text-gray-400">{r.dept}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                        <Icon size={11} className={cfg.iconColor} /> {r.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{r.leave_type}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {r.from_date} {r.from_date !== r.to_date ? `至 ${r.to_date}` : ""} · {r.time_slot || "全日"} · {r.days}天
                    </div>
                    {r.reason && <p className="text-xs text-gray-500 mt-1">原因：{r.reason}</p>}
                    {r.approver_name && (
                      <p className="text-xs text-gray-400 mt-1">審批人：{r.approver_name} · {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("zh-HK") : ""}</p>
                    )}
                    {r.review_note && <p className="text-xs text-orange-600 mt-0.5">備注：{r.review_note}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-gray-800">{r.days}</div>
                    <div className="text-[10px] text-gray-400">天</div>
                  </div>
                </div>

                {/* Approval actions */}
                {showApproval && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {reviewingId === r.id ? (
                      <div className="space-y-2">
                        <textarea
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                          rows={2}
                          placeholder="審批備注（選填）..."
                          value={reviewNote}
                          onChange={e => setReviewNote(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(r, "已批核")} className="flex-1 bg-green-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-600">✓ 批核</button>
                          <button onClick={() => handleApprove(r, "不批核")} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-600">✕ 不批核</button>
                          <button onClick={() => { setReviewingId(null); setReviewNote(""); }} className="px-3 bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-200">取消</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReviewingId(r.id)} className="text-xs text-blue-600 font-semibold hover:underline">審批此申請</button>
                    )}
                  </div>
                )}

                {/* Admin cancel */}
                {showCancel && r.status === "審查中" && (
                  <div className="mt-2">
                    <button onClick={() => handleCancel(r)} className="text-xs text-red-500 hover:underline">🗑️ 取消此申請</button>
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