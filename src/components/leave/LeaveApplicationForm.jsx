import { useState, useEffect, useMemo } from "react";
import { Send, CalendarDays, AlertCircle, User } from "lucide-react";
import { base44 } from "@/api/base44Client";

function calcDays(from, to, slot) {
  if (!from || !to) return 0;
  const diff = (new Date(to) - new Date(from)) / 86400000;
  const totalDays = diff < 0 ? 0 : diff + 1;
  if (slot !== "全日" && totalDays === 1) return 0.5;
  return totalDays;
}

export default function LeaveApplicationForm({ user, userRole, leaveTypes, allUsers, balances, onSubmitted }) {
  const isAdmin = userRole === "admin";

  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [form, setForm] = useState({
    leave_type: "",
    from_date: "",
    to_date: "",
    time_slot: "全日",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Set default selected user when user loads
  useEffect(() => {
    if (user?.email && !selectedUserEmail) {
      setSelectedUserEmail(user.email);
    }
  }, [user]);

  // Set default leave type
  useEffect(() => {
    if (leaveTypes.length > 0 && !form.leave_type) {
      setForm(f => ({ ...f, leave_type: leaveTypes[0].full_label }));
    }
  }, [leaveTypes]);

  const days = calcDays(form.from_date, form.to_date, form.time_slot);

  // Find selected leave type code from full_label
  const selectedTypeCode = useMemo(() => {
    const found = leaveTypes.find(t => t.full_label === form.leave_type);
    return found?.code || "";
  }, [form.leave_type, leaveTypes]);

  // Get remaining balance for the selected user + leave type
  const remainingBalance = useMemo(() => {
    if (!selectedUserEmail || !selectedTypeCode || !balances?.length) return null;
    const currentYear = new Date().getFullYear().toString();
    const match = balances.find(
      b => b.user_email === selectedUserEmail && b.leave_type_code === selectedTypeCode && b.year === currentYear
    );
    return match ? match.remaining : null;
  }, [selectedUserEmail, selectedTypeCode, balances]);

  // Validation: check if balance is insufficient (only for non-admin)
  const insufficientBalance = !isAdmin && remainingBalance !== null && days > 0 && days > remainingBalance;

  // Get the selected user's info
  const selectedUser = useMemo(() => {
    if (!selectedUserEmail) return user;
    return allUsers?.find(u => u.email === selectedUserEmail) || user;
  }, [selectedUserEmail, allUsers, user]);

  const canSubmit = !submitting && form.from_date && form.to_date && days > 0 && form.leave_type && !insufficientBalance;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await base44.entities.LeaveRequest.create({
      user_email: selectedUser?.email || user.email,
      user_name: selectedUser?.full_name || user.full_name,
      dept: selectedUser?.department || "未設定",
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

      {/* 1. Colleague Selection */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">
          <User size={12} className="inline mr-1" />同事 *
        </label>
        {isAdmin ? (
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            value={selectedUserEmail}
            onChange={e => setSelectedUserEmail(e.target.value)}
          >
            {(allUsers || []).map(u => (
              <option key={u.email} value={u.email}>{u.full_name || u.email}</option>
            ))}
          </select>
        ) : (
          <div className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
            {user?.full_name || user?.email || "—"}
          </div>
        )}
      </div>

      {/* Leave Type */}
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

      {/* 2. Dynamic Balance Display */}
      {form.leave_type && (
        <div className={`rounded-lg px-3 py-2 text-sm font-medium flex items-center justify-between ${
          remainingBalance === null
            ? "bg-gray-50 border border-gray-200 text-gray-500"
            : remainingBalance <= 0
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
        }`}>
          <span className="text-xs text-gray-500">剩餘日數</span>
          <span className="font-bold">
            {remainingBalance !== null ? `${remainingBalance} 天` : "暫無餘額記錄"}
          </span>
        </div>
      )}

      {/* Dates */}
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

      {/* Time Slot */}
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

      {/* Days Summary */}
      {days > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-sm text-blue-700 font-semibold">
          共 {days} 天
        </div>
      )}

      {/* 3. Insufficient Balance Error */}
      {insufficientBalance && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span className="font-semibold">餘額不足，無法提交申請</span>
        </div>
      )}

      {/* Reason */}
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

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={15} /> {submitting ? "提交中..." : "提交申請"}
      </button>
    </div>
  );
}