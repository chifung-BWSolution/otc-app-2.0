import { useState, useEffect } from "react";
import { Send, CalendarDays } from "lucide-react";
import { base44 } from "@/api/base44Client";

function calcDays(from, to, slot) {
  if (!from || !to) return 0;
  const diff = (new Date(to) - new Date(from)) / 86400000;
  const totalDays = diff < 0 ? 0 : diff + 1;
  if (slot !== "全日" && totalDays === 1) return 0.5;
  return totalDays;
}

export default function LeaveApplicationForm({ user, leaveTypes, onSubmitted }) {
  const [form, setForm] = useState({
    leave_type: "",
    from_date: "",
    to_date: "",
    time_slot: "全日",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (leaveTypes.length > 0 && !form.leave_type) {
      setForm(f => ({ ...f, leave_type: leaveTypes[0].full_label }));
    }
  }, [leaveTypes]);

  const days = calcDays(form.from_date, form.to_date, form.time_slot);

  const handleSubmit = async () => {
    if (!form.from_date || !form.to_date || !form.leave_type) return;
    setSubmitting(true);
    await base44.entities.LeaveRequest.create({
      user_email: user.email,
      user_name: user.full_name,
      dept: user.department || "未設定",
      leave_type: form.leave_type,
      from_date: form.from_date,
      to_date: form.to_date,
      time_slot: form.time_slot,
      days,
      reason: form.reason,
      status: "審查中",
    });
    setSubmitting(false);
    setForm({ leave_type: leaveTypes[0]?.full_label || "", from_date: "", to_date: "", time_slot: "全日", reason: "" });
    onSubmitted?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays size={18} className="text-blue-600" />
        <h3 className="font-bold text-gray-900">假期申請表</h3>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">假期類型 *</label>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          value={form.leave_type}
          onChange={e => setForm({ ...form, leave_type: e.target.value })}
        >
          {leaveTypes.map(t => (
            <option key={t.code} value={t.full_label}>{t.full_label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">開始日期 *</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={form.from_date}
            onChange={e => setForm({ ...form, from_date: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">結束日期 *</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={form.to_date}
            onChange={e => setForm({ ...form, to_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">時段</label>
        <div className="flex gap-2">
          {["全日", "上午", "下午"].map(slot => (
            <button
              key={slot}
              onClick={() => setForm({ ...form, time_slot: slot })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                form.time_slot === slot
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {days > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700 font-semibold">
          共 {days} 天
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">請假原因</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
          rows={3}
          placeholder="請填寫請假原因..."
          value={form.reason}
          onChange={e => setForm({ ...form, reason: e.target.value })}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !form.from_date || !form.to_date || days <= 0}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send size={15} /> {submitting ? "提交中..." : "提交申請"}
      </button>
    </div>
  );
}