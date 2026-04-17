import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const BU_OPTIONS = ["ASX", "BWA", "BWD", "BWE", "BWL", "BWT", "FC", "Wine", "志豐設計(深圳)"];
const METHOD_OPTIONS = ["電郵", "郵寄", "官網線上登記", "其他方式(請註明)"];
const STATUS_OPTIONS = ["登記申請中", "登記成功", "登記失敗", "已取消登記"];
const ORG_OPTIONS = [
  "政府物流服務署",
  "醫院管理局",
  "機場管理局",
  "房屋署",
  "建築署",
  "教育局",
  "其他",
];

const statusColor = {
  "登記申請中": "bg-blue-100 text-blue-700 border-blue-200",
  "登記成功": "bg-green-100 text-green-700 border-green-200",
  "登記失敗": "bg-red-100 text-red-700 border-red-200",
  "已取消登記": "bg-gray-100 text-gray-600 border-gray-200",
};

export default function TenderFormModal({ item, currentUser, onClose, onSaved }) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bu: item?.bu || "BWA",
    organization: item?.organization || "",
    account_email: item?.account_email || "",
    account_username: item?.account_username || "",
    account_password: item?.account_password || "",
    apply_date: item?.apply_date || new Date().toISOString().split("T")[0],
    approval_date: item?.approval_date || "",
    expiry_date: item?.expiry_date || "",
    registration_method: item?.registration_method || "",
    remarks: item?.remarks || "",
    asana_link: item?.asana_link || "",
    status: item?.status || "登記申請中",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.bu || !form.apply_date || !form.registration_method) return;
    setSaving(true);
    const payload = {
      ...form,
      created_by_name: item?.created_by_name || currentUser?.full_name || currentUser?.email,
    };
    if (isEdit) await base44.entities.TenderRegistration.update(item.id, payload);
    else await base44.entities.TenderRegistration.create(payload);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black text-gray-900">{isEdit ? "編輯 Tender" : "登記 Tender"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* BU */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">BU <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {BU_OPTIONS.map(b => (
                <button key={b} type="button" onClick={() => set("bu", b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    form.bu === b ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Organization */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">登記機構</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.organization} onChange={e => set("organization", e.target.value)}>
              <option value="">選擇機構</option>
              {ORG_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Account info */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">登記帳戶電郵</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="輸入登記帳戶電郵" value={form.account_email} onChange={e => set("account_email", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">登記帳戶號碼 (用戶名)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="輸入登記帳戶號碼 (用戶名)" value={form.account_username} onChange={e => set("account_username", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">登記帳戶密碼</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="輸入登記帳戶密碼" value={form.account_password} onChange={e => set("account_password", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">申請登記日期 <span className="text-red-500">*</span></label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.apply_date} onChange={e => set("apply_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">登記批核日期</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.approval_date} onChange={e => set("approval_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">登記失效日期 (到期日)</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">登記方式 <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {METHOD_OPTIONS.map(m => (
                <button key={m} type="button" onClick={() => set("registration_method", m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    form.registration_method === m ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">登記備註</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="輸入有關投標須知的特別事項" value={form.remarks} onChange={e => set("remarks", e.target.value)} />
          </div>

          {/* Asana */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1">Asana連結</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="貼上Asana連結" value={form.asana_link} onChange={e => set("asana_link", e.target.value)} />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">狀態 <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    form.status === s ? statusColor[s] + " ring-2 ring-offset-1 ring-blue-300" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-bold text-sm">取消</button>
          <button onClick={handleSave} disabled={saving || !form.bu || !form.apply_date || !form.registration_method}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} {isEdit ? "更新" : "登記"}
          </button>
        </div>
      </div>
    </div>
  );
}