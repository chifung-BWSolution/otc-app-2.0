import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColor = {
  "待審批": "bg-yellow-100 text-yellow-700",
  "已批准": "bg-green-100 text-green-700",
  "已拒絕": "bg-red-100 text-red-700",
};

export default function AppAccessRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState("待審批");
  const [reviewNote, setReviewNote] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u?.role !== "admin") navigate("/app/store");
    });
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await base44.entities.AppAccessRequest.list("-created_date", 200);
    setRequests(data);
    setLoading(false);
  };

  const handleDecision = async (req, decision) => {
    setProcessing(req.id);
    const now = new Date().toLocaleString("zh-HK");
    await base44.entities.AppAccessRequest.update(req.id, {
      status: decision,
      reviewed_by: currentUser?.full_name || currentUser?.email,
      reviewed_at: now,
      review_note: reviewNote[req.id] || "",
    });

    // Auto-assign license on approval
    if (decision === "已批准") {
      // Check not already assigned
      const existing = await base44.entities.AppLicenseAssignment.filter({
        app_id: req.app_id,
        user_email: req.user_email,
        status: "使用中",
      });
      if (existing.length === 0) {
        await base44.entities.AppLicenseAssignment.create({
          app_id: req.app_id,
          app_name: req.app_name,
          user_email: req.user_email,
          user_name: req.user_name,
          department: req.department,
          assigned_by: currentUser?.full_name || currentUser?.email,
          assigned_at: now,
          status: "使用中",
          note: `由申請自動分配 (${now})`,
        });
      }
    }

    setProcessing(null);
    setShowNoteFor(null);
    setReviewNote(prev => ({ ...prev, [req.id]: "" }));
    loadRequests();
  };

  const filtered = requests.filter(r => filter === "全部" || r.status === filter);
  const pendingCount = requests.filter(r => r.status === "待審批").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/store")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">App 使用申請管理</h1>
          <p className="text-xs text-gray-500">審批員工的 App 使用申請，批准後自動分配授權</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-yellow-600">{pendingCount}</div>
          <div className="text-xs text-gray-500">待審批</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-green-600">{requests.filter(r => r.status === "已批准").length}</div>
          <div className="text-xs text-gray-500">已批准</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-red-500">{requests.filter(r => r.status === "已拒絕").length}</div>
          <div className="text-xs text-gray-500">已拒絕</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {["待審批", "已批准", "已拒絕", "全部"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${filter === f ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Request List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-sm">沒有{filter}的申請</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {req.app_name?.[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{req.app_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[req.status]}`}>{req.status}</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      <span className="font-semibold">{req.user_name || req.user_email}</span>
                      {req.department && <span className="ml-1 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{req.department}</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{req.user_email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <Clock size={11} />
                  {req.created_date?.slice(0, 10)}
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-bold text-gray-500 mb-1">申請原因</div>
                <p className="text-sm text-gray-700">{req.reason}</p>
              </div>

              {/* Review info */}
              {req.reviewed_by && (
                <div className="text-xs text-gray-400">
                  審批人：{req.reviewed_by} · {req.reviewed_at}
                  {req.review_note && <div className="mt-0.5 text-orange-600">備注：{req.review_note}</div>}
                </div>
              )}

              {/* Actions for pending */}
              {req.status === "待審批" && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowNoteFor(showNoteFor === req.id ? null : req.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MessageSquare size={11} /> {showNoteFor === req.id ? "收起備注" : "加入審批備注（選填）"}
                  </button>
                  {showNoteFor === req.id && (
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      rows={2}
                      placeholder="審批備注（選填）..."
                      value={reviewNote[req.id] || ""}
                      onChange={e => setReviewNote(prev => ({ ...prev, [req.id]: e.target.value }))}
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(req, "已批准")}
                      disabled={processing === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors"
                    >
                      <CheckCircle size={15} /> {processing === req.id ? "處理中..." : "批准並分配授權"}
                    </button>
                    <button
                      onClick={() => handleDecision(req, "已拒絕")}
                      disabled={processing === req.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 disabled:opacity-60 transition-colors"
                    >
                      <XCircle size={15} /> 拒絕
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