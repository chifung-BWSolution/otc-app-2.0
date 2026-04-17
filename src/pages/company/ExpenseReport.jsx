import { useState, useEffect } from "react";
import { Plus, Upload, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import RegionBadge from "@/components/RegionBadge";

const categories = ["客戶招待", "交通費", "辦公用品", "培訓費用", "差旅費", "餐飲費", "其他"];
const statusColor = { "已批准": "bg-green-100 text-green-700", "審批中": "bg-yellow-100 text-yellow-700", "已拒絕": "bg-red-100 text-red-700" };

export default function ExpenseReport() {
  const { currentRegion } = useRegion();
  const [showForm, setShowForm] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", category: "客戶招待", amount: "", expense_date: "", notes: "", receipt_url: "" });

  useEffect(() => {
    base44.auth.me().then(u => { setCurrentUser(u); load(u); }).catch(() => setLoading(false));
  }, []);

  const load = async (u) => {
    setLoading(true);
    const data = await base44.entities.ExpenseRecord.filter({ user_email: u.email }, "-created_date", 100);
    setRecords(data);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, receipt_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return;
    setSubmitting(true);
    await base44.entities.ExpenseRecord.create({
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email,
      region_code: currentRegion?.code || "",
      title: form.title,
      category: form.category,
      amount: Number(form.amount),
      currency: currentRegion?.currency || "HKD",
      expense_date: form.expense_date,
      receipt_url: form.receipt_url,
      notes: form.notes,
      status: "審批中",
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ title: "", category: "客戶招待", amount: "", expense_date: "", notes: "", receipt_url: "" });
    load(currentUser);
  };

  const totalPending = records.filter(e => e.status === "審批中").reduce((s, e) => s + (e.amount || 0), 0);
  const totalApproved = records.filter(e => e.status === "已批准").reduce((s, e) => s + (e.amount || 0), 0);
  const currency = currentRegion?.currency || "HKD";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-black text-gray-900">費用報銷 (P9)</h2>
        <RegionBadge />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <div className="text-xs text-gray-500">審批中金額</div>
          <div className="text-xl font-bold text-yellow-600 mt-1">{currency} {totalPending.toLocaleString()}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="text-xs text-gray-500">本月已批准</div>
          <div className="text-xl font-bold text-green-600 mt-1">{currency} {totalApproved.toLocaleString()}</div>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 shadow-md">
        <Plus size={20} /> 提交 P9 費用報銷
      </button>

      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-700">💰 P9 費用報銷申請</h3>
            <button onClick={() => setShowForm(false)}><X size={16} /></button>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">費用名稱 *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="請填寫費用描述" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">費用類別</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">金額 ({currency}) *</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">費用日期</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">上傳收據</label>
            {form.receipt_url ? (
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <img src={form.receipt_url} alt="" className="h-16 rounded object-cover" />
                <button onClick={() => setForm({ ...form, receipt_url: "" })} className="text-xs text-red-500">移除</button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400 hover:border-yellow-300 cursor-pointer transition-colors block">
                {uploading ? <Loader2 size={20} className="mx-auto animate-spin" /> : (<><Upload size={24} className="mx-auto mb-1" /><div className="text-sm">點擊上傳收據圖片</div></>)}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
              </label>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">備注</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none" rows={2} placeholder="請填寫備注（選填）" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting || !form.title || !form.amount}
              className="flex-1 bg-yellow-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting && <Loader2 size={13} className="animate-spin" />} 提交申請
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">取消</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-700 mb-3">📊 申請記錄</h3>
        {loading ? <div className="text-center py-4 text-sm text-gray-400">載入中...</div> :
          records.length === 0 ? <div className="text-center py-6 text-sm text-gray-400">暫無記錄</div> :
          <div className="space-y-3">
            {records.map(e => (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
                <span className="text-2xl">💰</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-800">{e.title}</div>
                  <div className="text-xs text-gray-500">{e.category} · {e.expense_date}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-800 text-sm">{e.currency || "HKD"} {Number(e.amount || 0).toLocaleString()}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[e.status]}`}>{e.status}</span>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}