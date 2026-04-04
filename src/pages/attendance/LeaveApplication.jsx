import { useState } from "react";
import { Plus, CheckCircle, XCircle, Clock } from "lucide-react";

const leaveTypes = ["年假", "病假", "事假", "婚假", "喪假", "侍產假", "哺乳假"];

const sampleLeaves = [
  { id: 1, type: "年假", from: "2026-04-18", to: "2026-04-18", days: 1, reason: "個人事務", status: "已批准", appliedAt: "2026-04-01" },
  { id: 2, type: "病假", from: "2026-03-20", to: "2026-03-20", days: 1, reason: "身體不適", status: "已批准", appliedAt: "2026-03-20" },
  { id: 3, type: "年假", from: "2026-05-04", to: "2026-05-06", days: 3, reason: "旅遊", status: "審批中", appliedAt: "2026-04-02" },
];

const statusIcon = { "已批准": <CheckCircle size={16} className="text-green-500" />, "審批中": <Clock size={16} className="text-yellow-500" />, "已拒絕": <XCircle size={16} className="text-red-500" /> };
const statusColor = { "已批准": "bg-green-100 text-green-700", "審批中": "bg-yellow-100 text-yellow-700", "已拒絕": "bg-red-100 text-red-700" };

export default function LeaveApplication() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "年假", from: "", to: "", reason: "" });

  const balance = { 年假: 8, 病假: 14, 事假: 2 };

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

      {/* Apply Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
      >
        <Plus size={20} /> 申請假期
      </button>

      {/* Application Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-700">📋 填寫申請</h3>
          <div>
            <label className="text-sm text-gray-600 block mb-1">假期類型</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {leaveTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">開始日期</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">結束日期</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">請假原因</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
              rows={3}
              placeholder="請填寫請假原因..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">提交申請</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </div>
      )}

      {/* Leave History */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">📊 申請記錄</h3>
        <div className="space-y-3">
          {sampleLeaves.map((leave) => (
            <div key={leave.id} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌴</span>
                  <div>
                    <div className="font-semibold text-sm text-gray-800">{leave.type} · {leave.days}天</div>
                    <div className="text-xs text-gray-500">{leave.from} {leave.from !== leave.to ? `至 ${leave.to}` : ""}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${statusColor[leave.status]}`}>
                  {statusIcon[leave.status]} {leave.status}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 pl-7">原因：{leave.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}