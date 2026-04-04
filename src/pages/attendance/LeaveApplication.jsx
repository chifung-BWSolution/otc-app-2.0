import { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const leaveTypes = ["年假", "病假", "事假", "婚假", "喪假", "侍產假", "哺乳假"];

const statusIcon = {
  "已批准": <CheckCircle size={14} className="text-green-500" />,
  "待審批": <Clock size={14} className="text-yellow-500" />,
  "已拒絕": <XCircle size={14} className="text-red-500" />,
};
const statusColor = {
  "已批准": "bg-green-100 text-green-700",
  "待審批": "bg-yellow-100 text-yellow-700",
  "已拒絕": "bg-red-100 text-red-700",
};

function calcDays(from, to) {
  if (!from || !to) return 0;
  const diff = (new Date(to) - new Date(from)) / 86400000;
  return diff < 0 ? 0 : diff + 1;
}

export default function LeaveApplication() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ leave_type: "年假", from_date: "", to_date: "", reason: "" });

  const balance = { 年假: 8, 病假: 14, 事假: 2 };

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u) loadRecords(u.email);
    });
  }, []);

  const loadRecords = async (email) => {
    setLoading(true);
    const data = await base44.entities.LeaveRequest.filter({ user_email: email }, "-created_date", 20);
    setRecords(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.from_date || !form.to_date || !form.reason.trim()) return;
    setSubmitting(true);
    const days = calcDays(form.from_date, form.to_date);
    await base44.entities.LeaveRequest.create({
      user_email: user.email,
      user_name: user.full_name,
      dept: user.dept || "未設定",
      leave_type: form.leave_type,
      from_date: form.from_date,
      to_date: form.to_date,
      days,
      reason: form.reason,
      status: "待審批",
    });
    setSubmitting(false);
    setSubmitted(true);
    setShowForm(false);
    setForm({ leave_type: "年假", from_date: "", to_date: "", reason: "" });
    setTimeout(() => setSubmitted(false), 3000);
    loadRecords(user.email);
  };

  return (
    <div className="space-y-4">
      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(balance).map(([type, days]) => (
          <div key={type} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-blue-500">{days}</div>
            <div className="text-xs text-gray-500 mt-1">剩餘{type}</div>
          </div>
        ))}
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle size={16} /> 假期申請已提交，等待上司審批！
        </div>
      )}

      {/* Apply Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
      >
        <Plus size={20} /> 申請假期
      </button>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-700">📋 填寫申請</h3>
          <div>
            <label className="text-sm text-gray-600 block mb-1">假期類型</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              value={form.leave_type}
              onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            >
              {leaveTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">開始日期</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">結束日期</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
            </div>
          </div>
          {form.from_date && form.to_date && (
            <p className="text-sm text-blue-600 font-medium">共 {calcDays(form.from_date, form.to_date)} 天</p>
          )}
          <div>
            <label className="text-sm text-gray-600 block mb-1">請假原因 *</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
              rows={3}
              placeholder="請填寫請假原因..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              {submitting ? "提交中..." : "提交申請"}
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">📊 申請記錄</h3>
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-4">載入中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-4">暫無申請記錄</p>
        ) : (
          <div className="space-y-3">
            {records.map((leave) => (
              <div key={leave.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌴</span>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{leave.leave_type} · {leave.days}天</div>
                      <div className="text-xs text-gray-500">{leave.from_date} {leave.from_date !== leave.to_date ? `至 ${leave.to_date}` : ""}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${statusColor[leave.status]}`}>
                    {statusIcon[leave.status]} {leave.status}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 pl-7">原因：{leave.reason}</p>
                {leave.review_note && (
                  <p className="text-xs text-orange-600 mt-1 pl-7">審批備注：{leave.review_note}</p>
                )}
                {leave.reviewed_by && (
                  <p className="text-xs text-gray-400 mt-0.5 pl-7">審批人：{leave.reviewed_by} · {leave.reviewed_at}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}