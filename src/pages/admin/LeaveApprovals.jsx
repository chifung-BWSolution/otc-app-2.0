import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColor = {
  "已批核": "bg-green-100 text-green-700",
  "approved": "bg-green-100 text-green-700",
  "審查中": "bg-yellow-100 text-yellow-700",
  "pending": "bg-yellow-100 text-yellow-700",
  "不批核": "bg-red-100 text-red-700",
  "rejected": "bg-red-100 text-red-700",
};

export default function LeaveApprovals() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("審查中");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const data = await base44.entities.BubbleLeave.list("-created_date", 100);
    setRecords(data);
    setLoading(false);
  };

  const handleDecision = async (record, decision) => {
    const now = new Date().toLocaleString("zh-HK");
    await base44.entities.BubbleLeave.update(record.id, {
      status: decision,
      reviewed_by: user?.full_name || user?.email || "管理員",
      reviewed_at: now,
      review_note: reviewNote[record.id] || "",
    });
    setShowNoteFor(null);
    setReviewNote((prev) => ({ ...prev, [record.id]: "" }));
    loadAll();
  };

  const filtered = records.filter((r) => filter === "全部" || r.status === filter || (filter === "審查中" && r.status === "pending") || (filter === "已批核" && r.status === "approved") || (filter === "不批核" && r.status === "rejected"));
  const pending = records.filter((r) => r.status === "審查中" || r.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          <div className="text-xs text-gray-500 mt-0.5">審查中</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-2xl font-bold text-green-600">{records.filter((r) => r.status === "已批核" || r.status === "approved").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">已批核</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <div className="text-2xl font-bold text-red-500">{records.filter((r) => r.status === "不批核" || r.status === "rejected").length}</div>
          <div className="text-xs text-gray-500 mt-0.5">不批核</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {["審查中", "已批核", "不批核", "全部"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${filter === f ? "bg-white shadow text-green-600" : "text-gray-500"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-gray-400 py-8">載入中...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <p>沒有{filter}的申請</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌴</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{item.user_name || item.user_email}</span>
                      {item.dept && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{item.dept}</span>}
                    </div>
                    <div className="text-sm text-gray-700 mt-0.5">{item.leave_type} · {item.days}天</div>
                    <div className="text-xs text-gray-500">{item.from_date} {item.from_date !== item.to_date ? `至 ${item.to_date}` : ""}</div>
                    <div className="text-xs text-gray-500 mt-1">原因：{item.reason}</div>
                    {item.reviewed_by && (
                      <div className="text-xs text-gray-400 mt-1">審批人：{item.reviewed_by} · {item.reviewed_at}</div>
                    )}
                    {item.review_note && (
                      <div className="text-xs text-orange-600 mt-0.5">備注：{item.review_note}</div>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusColor[item.status]}`}>
                  {item.status}
                </span>
              </div>

              {(item.status === "審查中" || item.status === "pending") && (
                <div className="mt-3 space-y-2">
                  {/* Note toggle */}
                  <button
                    onClick={() => setShowNoteFor(showNoteFor === item.id ? null : item.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MessageSquare size={12} /> {showNoteFor === item.id ? "收起備注" : "加入審批備注（選填）"}
                  </button>
                  {showNoteFor === item.id && (
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                      rows={2}
                      placeholder="審批備注（選填）..."
                      value={reviewNote[item.id] || ""}
                      onChange={(e) => setReviewNote((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(item, "已批核")}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      <CheckCircle size={16} /> 批核
                    </button>
                    <button
                      onClick={() => handleDecision(item, "不批核")}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      <XCircle size={16} /> 不批核
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}