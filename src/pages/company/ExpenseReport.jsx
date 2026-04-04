import { useState } from "react";
import { Plus, Upload } from "lucide-react";

const categories = ["客戶招待", "交通費", "辦公用品", "培訓費用", "差旅費", "餐飲費", "其他"];

const sampleExpenses = [
  { id: 1, title: "客戶午宴", category: "客戶招待", amount: 1280, date: "2026-04-02", receipt: true, status: "已批准" },
  { id: 2, title: "的士費（客戶拜訪）", category: "交通費", amount: 145, date: "2026-04-01", receipt: true, status: "審批中" },
  { id: 3, title: "打印機墨盒", category: "辦公用品", amount: 320, date: "2026-03-28", receipt: true, status: "已批准" },
];

const statusColor = { "已批准": "bg-green-100 text-green-700", "審批中": "bg-yellow-100 text-yellow-700", "已拒絕": "bg-red-100 text-red-700" };

export default function ExpenseReport() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "客戶招待", amount: "", date: "", notes: "" });

  const totalPending = sampleExpenses.filter((e) => e.status === "審批中").reduce((s, e) => s + e.amount, 0);
  const totalApproved = sampleExpenses.filter((e) => e.status === "已批准").reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <div className="text-xs text-gray-500">審批中金額</div>
          <div className="text-xl font-bold text-yellow-600 mt-1">HK${totalPending.toLocaleString()}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="text-xs text-gray-500">本月已批准</div>
          <div className="text-xl font-bold text-green-600 mt-1">HK${totalApproved.toLocaleString()}</div>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md">
        <Plus size={20} /> 提交P9費用報銷
      </button>

      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <h3 className="font-bold text-gray-700">💰 P9費用報銷申請</h3>
          <div>
            <label className="text-sm text-gray-600 block mb-1">費用名稱 *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="請填寫費用描述" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">費用類別</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">金額 (HKD) *</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">費用日期</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">上傳收據</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 hover:border-yellow-300 cursor-pointer transition-colors">
              <Upload size={24} className="mx-auto mb-1" />
              <div className="text-sm">點擊上傳收據圖片</div>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">備注</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none" rows={2} placeholder="請填寫備注（選填）" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-yellow-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors">提交申請</button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">📊 申請記錄</h3>
        <div className="space-y-3">
          {sampleExpenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
              <span className="text-2xl">💰</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800">{e.title}</div>
                <div className="text-xs text-gray-500">{e.category} · {e.date}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800 text-sm">HK${e.amount.toLocaleString()}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[e.status]}`}>{e.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}