import { useState } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StaffSelfEditModal({ profile, currentUser, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    chinese_name: profile?.chinese_name || "",
    full_name: profile?.full_name || "",
    gender: profile?.gender || "",
    date_of_birth: profile?.date_of_birth || "",
    hkid: profile?.hkid || "",
    nationality: profile?.nationality || "",
    marital_status: profile?.marital_status || "",
    mobile: profile?.mobile || "",
    personal_email: profile?.personal_email || "",
    address: profile?.address || "",
    bank_name: profile?.bank_name || "",
    bank_account_number: profile?.bank_account_number || "",
    bank_account_holder: profile?.bank_account_holder || "",
    emergency_contact_name: profile?.emergency_contact_name || "",
    emergency_contact_relation: profile?.emergency_contact_relation || "",
    emergency_contact_phone: profile?.emergency_contact_phone || "",
    education: profile?.education || [],
    work_experience: profile?.work_experience || [],
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    languages: profile?.languages || [],
  });

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Array helpers
  const addArrayItem = (field, item) => setForm(f => ({ ...f, [field]: [...(f[field] || []), item] }));
  const removeArrayItem = (field, idx) => setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  const updateArrayItem = (field, idx, key, val) => setForm(f => ({
    ...f,
    [field]: f[field].map((item, i) => i === idx ? { ...item, [key]: val } : item)
  }));

  const handleSubmit = async () => {
    setSaving(true);
    await base44.entities.ProfileUpdateRequest.create({
      staff_profile_id: profile.id,
      requested_by_email: currentUser.email,
      requested_by_name: currentUser.full_name || currentUser.email,
      request_status: 'Pending Review',
      ...form,
    });
    setSaving(false);
    onSubmitted();
  };

  const SECTIONS = [
    { key: "personal", label: "個人資料" },
    { key: "bank", label: "銀行資料" },
    { key: "emergency", label: "緊急聯絡" },
    { key: "education", label: "學歷" },
    { key: "experience", label: "工作經驗" },
    { key: "skills", label: "技能興趣" },
  ];

  const InputField = ({ label, field, type = "text", placeholder = "" }) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
      <input type={type} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-black text-gray-900 text-base">更新個人資料</h3>
            <p className="text-xs text-gray-400">提交後需等待管理員審批</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto shrink-0">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeSection === s.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeSection === "personal" && (
            <div className="grid grid-cols-2 gap-3">
              <InputField label="中文姓名" field="chinese_name" />
              <InputField label="英文姓名" field="full_name" />
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">性別</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                  value={form.gender} onChange={e => set("gender", e.target.value)}>
                  <option value="">請選擇</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">婚姻狀況</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                  value={form.marital_status} onChange={e => set("marital_status", e.target.value)}>
                  <option value="">請選擇</option>
                  <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                </select>
              </div>
              <InputField label="出生日期" field="date_of_birth" type="date" />
              <InputField label="香港身份證" field="hkid" placeholder="A123456(7)" />
              <InputField label="國籍" field="nationality" placeholder="Hong Kong" />
              <InputField label="手機號碼" field="mobile" type="tel" />
              <InputField label="個人電郵" field="personal_email" type="email" />
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">住址</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  rows={2} value={form.address} onChange={e => set("address", e.target.value)} />
              </div>
            </div>
          )}

          {activeSection === "bank" && (
            <div className="space-y-3">
              <InputField label="銀行名稱" field="bank_name" placeholder="例：滙豐銀行" />
              <InputField label="帳戶號碼" field="bank_account_number" />
              <InputField label="帳戶持有人姓名" field="bank_account_holder" />
            </div>
          )}

          {activeSection === "emergency" && (
            <div className="space-y-3">
              <InputField label="緊急聯絡人姓名" field="emergency_contact_name" />
              <InputField label="關係" field="emergency_contact_relation" placeholder="例：父親、配偶" />
              <InputField label="緊急聯絡人電話" field="emergency_contact_phone" type="tel" />
            </div>
          )}

          {activeSection === "education" && (
            <div className="space-y-3">
              {(form.education || []).map((edu, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => removeArrayItem("education", i)}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">學校/機構</label>
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        value={edu.institution || ""} onChange={e => updateArrayItem("education", i, "institution", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">學位/資格</label>
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        value={edu.degree || ""} onChange={e => updateArrayItem("education", i, "degree", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">主修</label>
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        value={edu.field || ""} onChange={e => updateArrayItem("education", i, "field", e.target.value)} />
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-0.5">開始</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                          placeholder="2018" value={edu.from_year || ""} onChange={e => updateArrayItem("education", i, "from_year", e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-0.5">結束</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                          placeholder="2022" value={edu.to_year || ""} onChange={e => updateArrayItem("education", i, "to_year", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem("education", {})}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors">
                <Plus size={13} /> 新增學歷
              </button>
            </div>
          )}

          {activeSection === "experience" && (
            <div className="space-y-3">
              {(form.work_experience || []).map((exp, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => removeArrayItem("work_experience", i)}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">公司</label>
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        value={exp.company || ""} onChange={e => updateArrayItem("work_experience", i, "company", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">職位</label>
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        value={exp.role || ""} onChange={e => updateArrayItem("work_experience", i, "role", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">開始日期</label>
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        placeholder="2020-01" value={exp.from_date || ""} onChange={e => updateArrayItem("work_experience", i, "from_date", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-0.5">結束日期</label>
                      <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                        placeholder="2023-06 / 現在" value={exp.to_date || ""} onChange={e => updateArrayItem("work_experience", i, "to_date", e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-0.5">描述</label>
                      <textarea className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none resize-none"
                        rows={2} value={exp.description || ""} onChange={e => updateArrayItem("work_experience", i, "description", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => addArrayItem("work_experience", {})}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors">
                <Plus size={13} /> 新增工作經驗
              </button>
            </div>
          )}

          {activeSection === "skills" && (
            <div className="space-y-4">
              {[
                { field: "skills", label: "技能", color: "blue" },
                { field: "interests", label: "興趣", color: "purple" },
                { field: "languages", label: "語言能力", color: "green" },
              ].map(({ field, label, color }) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">{label}</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(form[field] || []).map((item, i) => (
                      <span key={i} className={`flex items-center gap-1 bg-${color}-100 text-${color}-700 text-xs px-2 py-0.5 rounded-full`}>
                        {item}
                        <button onClick={() => removeArrayItem(field, i)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                      placeholder={`新增${label}...`}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          addArrayItem(field, e.target.value.trim());
                          e.target.value = '';
                        }
                      }}
                    />
                    <button className="text-xs text-blue-500 px-2">Enter 新增</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0 bg-amber-50">
          <div className="flex-1 text-xs text-amber-700">
            ⚠️ 提交後需管理員審批，審批前原資料不受影響
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">取消</button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> 提交中...</> : "提交審批"}
          </button>
        </div>
      </div>
    </div>
  );
}