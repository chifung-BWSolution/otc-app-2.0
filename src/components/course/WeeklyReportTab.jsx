import { useState, useEffect } from "react";
import { Plus, CheckCircle, Clock, AlertTriangle, MessageSquare, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColor = {
  "草稿": "bg-gray-100 text-gray-600",
  "已提交": "bg-blue-100 text-blue-700",
  "已審核": "bg-green-100 text-green-700",
  "需修改": "bg-red-100 text-red-600",
};

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

export default function WeeklyReportTab({ currentUser }) {
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);
  const isAdmin = currentUser?.role === "admin";
  const week = getWeekRange();

  const [form, setForm] = useState({
    work_progress: "", learning_notes: "", completed_courses: "",
    training_hours: 0, next_week_plan: "", issues: ""
  });

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  const loadReports = async () => {
    setLoading(true);
    if (isAdmin) {
      const data = await base44.entities.WeeklyReport.list("-created_date", 100);
      setAllReports(data);
    }
    if (currentUser?.email) {
      const data = await base44.entities.WeeklyReport.filter({ user_email: currentUser.email }, "-created_date", 20);
      setReports(data);
    }
    setLoading(false);
  };

  const thisWeekReport = reports.find(r => r.week_start === week.start);

  const handleSubmit = async (asDraft = false) => {
    setSubmitting(true);
    const payload = {
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      week_start: week.start,
      week_end: week.end,
      work_progress: form.work_progress,
      learning_notes: form.learning_notes,
      completed_courses: form.completed_courses.split("\n").filter(Boolean),
      training_hours: Number(form.training_hours),
      next_week_plan: form.next_week_plan,
      issues: form.issues,
      status: asDraft ? "草稿" : "已提交",
    };
    if (thisWeekReport) {
      await base44.entities.WeeklyReport.update(thisWeekReport.id, payload);
    } else {
      await base44.entities.WeeklyReport.create(payload);
    }
    setSubmitting(false);
    setShowForm(false);
    loadReports();
  };

  const handleReview = async (report, status) => {
    await base44.entities.WeeklyReport.update(report.id, {
      status,
      reviewed_by: currentUser?.full_name,
      reviewed_at: new Date().toLocaleString("zh-HK"),
      review_note: reviewNote[report.id] || "",
    });
    setShowNoteFor(null);
    loadReports();
  };

  return (
    <div className="space-y-4">
      {/* My Weekly Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-800">本週匯報</h3>
            <p className="text-xs text-gray-500">{week.start} 至 {week.end}</p>
          </div>
          {thisWeekReport ? (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[thisWeekReport.status]}`}>{thisWeekReport.status}</span>
          ) : (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1"><AlertTriangle size={11} /> 未提交</span>
          )}
        </div>
        <button
          onClick={() => { if (thisWeekReport) { setForm({ work_progress: thisWeekReport.work_progress || "", learning_notes: thisWeekReport.learning_notes || "", completed_courses: (thisWeekReport.completed_courses || []).join("\n"), training_hours: thisWeekReport.training_hours || 0, next_week_plan: thisWeekReport.next_week_plan || "", issues: thisWeekReport.issues || "" }); } setShowForm(true); }}
          className="w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} /> {thisWeekReport ? "修改匯報" : "提交本週匯報"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">📝 每週學習匯報</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">工作進度 *</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={3} placeholder="本週工作進度..." value={form.work_progress} onChange={e => setForm({...form, work_progress: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">學習心得</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={3} placeholder="本週學習心得與反思..." value={form.learning_notes} onChange={e => setForm({...form, learning_notes: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">完成課程（每行一個）</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={2} placeholder="課程名稱..." value={form.completed_courses} onChange={e => setForm({...form, completed_courses: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">培訓時數</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.training_hours} onChange={e => setForm({...form, training_hours: e.target.value})} min={0} step={0.5} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">下週計劃</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.next_week_plan} onChange={e => setForm({...form, next_week_plan: e.target.value})} placeholder="下週計劃..." />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">遇到的問題</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.issues} onChange={e => setForm({...form, issues: e.target.value})} placeholder="如有問題請填寫..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleSubmit(false)} disabled={submitting || !form.work_progress} className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors">
              {submitting ? "提交中..." : "✅ 正式提交"}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={submitting} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              💾 儲存草稿
            </button>
          </div>
        </div>
      )}

      {/* Admin: All Reports */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3">🔍 所有匯報審核</h3>
          <div className="space-y-3">
            {allReports.filter(r => r.status === "已提交").map(r => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{r.user_name || r.user_email}</div>
                    <div className="text-xs text-gray-500">{r.week_start} 至 {r.week_end} · 培訓 {r.training_hours}h</div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.work_progress}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor[r.status]}`}>{r.status}</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <button onClick={() => setShowNoteFor(showNoteFor === r.id ? null : r.id)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <MessageSquare size={11} /> 加入審核備注
                  </button>
                  {showNoteFor === r.id && (
                    <textarea className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none" rows={2} placeholder="審核備注..." value={reviewNote[r.id] || ""} onChange={e => setReviewNote(p => ({...p, [r.id]: e.target.value}))} />
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(r, "已審核")} className="flex-1 text-xs bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 transition-colors">✓ 批准</button>
                    <button onClick={() => handleReview(r, "需修改")} className="flex-1 text-xs bg-red-100 text-red-600 py-1.5 rounded-lg hover:bg-red-200 transition-colors">↩ 需修改</button>
                  </div>
                </div>
              </div>
            ))}
            {allReports.filter(r => r.status === "已提交").length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">暫無待審核匯報</p>
            )}
          </div>
        </div>
      )}

      {/* My History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-3">📊 我的匯報記錄</h3>
        {loading ? <p className="text-xs text-gray-400 text-center py-4">載入中...</p> : (
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 border-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-800">{r.week_start} 至 {r.week_end}</div>
                  <div className="text-xs text-gray-500">培訓 {r.training_hours}h · {(r.completed_courses || []).length} 個課程</div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[r.status]}`}>{r.status}</span>
                  {r.review_note && <p className="text-xs text-orange-600 mt-0.5">{r.review_note}</p>}
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-xs text-gray-400 text-center py-4">暫無記錄</p>}
          </div>
        )}
      </div>
    </div>
  );
}