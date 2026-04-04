import { useState } from "react";
import { CheckCircle, XCircle, Clock, Filter } from "lucide-react";

const sampleApprovals = [
  { id: 1, type: "假期申請", requester: "陳大文", dept: "市場部", detail: "年假 2026-04-18 (1天)", submittedAt: "2026-04-01 10:23", status: "待審批", urgent: false },
  { id: 2, type: "費用報銷", requester: "李小明", dept: "銷售部", detail: "客戶招待費 HK$1,280", submittedAt: "2026-04-02 14:05", status: "待審批", urgent: false },
  { id: 3, type: "特別批核", requester: "張美麗", dept: "IT部", detail: "購買軟件授權 HK$5,500", submittedAt: "2026-04-03 09:30", status: "待審批", urgent: true },
  { id: 4, type: "加班申請", requester: "王志偉", dept: "財務部", detail: "2026-04-05 加班4小時", submittedAt: "2026-04-03 16:00", status: "待審批", urgent: false },
  { id: 5, type: "假期申請", requester: "林曉琳", dept: "人事部", detail: "病假 2026-04-04 (1天)", submittedAt: "2026-04-04 08:10", status: "已批准", urgent: false },
  { id: 6, type: "物資借用", requester: "黃俊傑", dept: "市場部", detail: "投影儀 2026-04-07", submittedAt: "2026-04-03 11:00", status: "已拒絕", urgent: false },
];

const typeIcons = { "假期申請": "🌴", "費用報銷": "💰", "特別批核": "✅", "加班申請": "⚡", "物資借用": "📦" };
const typeColors = { "假期申請": "bg-green-100 text-green-700", "費用報銷": "bg-yellow-100 text-yellow-700", "特別批核": "bg-red-100 text-red-700", "加班申請": "bg-orange-100 text-orange-700", "物資借用": "bg-blue-100 text-blue-700" };
const statusColor = { "待審批": "bg-yellow-100 text-yellow-700", "已批准": "bg-green-100 text-green-700", "已拒絕": "bg-red-100 text-red-700" };

export default function Approvals() {
  const [filter, setFilter] = useState("待審批");
  const [approvals, setApprovals] = useState(sampleApprovals);

  const filtered = approvals.filter((a) => filter === "全部" || a.status === filter);
  const pending = approvals.filter((a) => a.status === "待審批").length;

  const handleApprove = (id) => setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status: "已批准" } : a));
  const handleReject = (id) => setApprovals((prev) => prev.map((a) => a.id === id ? { ...a, status: "已拒絕" } : a));

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
        {filtered.map((item) => (
          <div key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${item.urgent ? "border-l-4 border-l-red-400" : ""}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{typeIcons[item.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.type]}`}>{item.type}</span>
                  {item.urgent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🔴 緊急</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[item.status]}`}>{item.status}</span>
                </div>
                <div className="font-semibold text-gray-800 mt-1 text-sm">{item.requester} · {item.dept}</div>
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p>沒有{filter}的申請</p>
          </div>
        )}
      </div>
    </div>
  );
}