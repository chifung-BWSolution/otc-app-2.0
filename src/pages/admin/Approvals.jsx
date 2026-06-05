import { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const typeIcons = { "假期申請": "🌴", "費用報銷": "💰", "特別批核": "✅", "加班申請": "⚡", "物資借用": "📦", "個人資料": "📝" };
const typeColors = { "假期申請": "bg-green-100 text-green-700", "費用報銷": "bg-yellow-100 text-yellow-700", "特別批核": "bg-red-100 text-red-700", "加班申請": "bg-orange-100 text-orange-700", "物資借用": "bg-blue-100 text-blue-700", "個人資料": "bg-purple-100 text-purple-700" };
const statusColor = { "待審批": "bg-yellow-100 text-yellow-700", "已批准": "bg-green-100 text-green-700", "已拒絕": "bg-red-100 text-red-700" };

export default function Approvals() {
  const [filter, setFilter] = useState("待審批");
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const requests = await base44.entities.ProfileUpdateRequest.list("-created_date", 200);
      const mapped = requests.map(r => ({
        id: r.id,
        type: "個人資料",
        requester: r.staff_name || r.requested_by_name || "—",
        dept: "",
        detail: `${r.field_name || "欄位"}: ${r.old_value || ""} → ${r.new_value || ""}`,
        submittedAt: r.created_date ? new Date(r.created_date).toLocaleString("zh-HK") : "—",
        status: r.request_status === "approved" ? "已批准" : r.request_status === "rejected" ? "已拒絕" : "待審批",
        urgent: false,
      }));
      setApprovals(mapped);
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = approvals.filter((a) => filter === "全部" || a.status === filter);
  const pending = approvals.filter((a) => a.status === "待審批").length;

  const handleApprove = async (id) => {
    try {
      await base44.entities.ProfileUpdateRequest.update(id, { request_status: "approved" });
      setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status: "已批准" } : a));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id) => {
    try {
      await base44.entities.ProfileUpdateRequest.update(id, { request_status: "rejected" });
      setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status: "已拒絕" } : a));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          <div className="text-xs text-gray-500 mt-0.5">待審批</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{approvals.filter((a) => a.status === "已批准").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">已批准</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-500">{approvals.filter((a) => a.status === "已拒絕").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">已拒絕</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {["待審批", "已批准", "已拒絕", "全部"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${filter === f ? "bg-white shadow text-red-600" : "text-gray-500"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">⏳</div>
            <p>載入中...</p>
          </div>
        ) : filtered.map((item) => (
          <div key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${item.urgent ? "border-l-4 border-l-red-400" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{typeIcons[item.type] || "📋"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.type] || "bg-gray-100 text-gray-700"}`}>{item.type}</span>
                  {item.urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🔴 緊急</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[item.status] || "bg-gray-100 text-gray-600"}`}>{item.status}</span>
                </div>
                <div className="font-semibold text-gray-800 mt-1 text-sm">{item.requester}{item.dept ? ` · ${item.dept}` : ""}</div>
                <div className="text-xs text-gray-600 mt-0.5">{item.detail}</div>
                <div className="text-xs text-gray-400 mt-0.5">提交時間：{item.submittedAt}</div>
              </div>
            </div>
            {item.status === "待審批" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApprove(item.id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  <CheckCircle size={16} /> 批准
                </button>
                <button
                  onClick={() => handleReject(item.id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  <XCircle size={16} /> 拒絕
                </button>
              </div>
            )}
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p>沒有{filter === "全部" ? "" : filter + "的"}申請</p>
          </div>
        )}
      </div>
    </div>
  );
}