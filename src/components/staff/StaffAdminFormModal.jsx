import { useState } from "react";
import { X, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SECTIONS = [
  { key: "basic", label: "基本資料" },
  { key: "job", label: "職位資料" },
  { key: "personal", label: "個人資料" },
  { key: "bank", label: "銀行資料" },
  { key: "emergency", label: "緊急聯絡" },
  { key: "education", label: "學歷" },
  { key: "experience", label: "工作經驗" },
  { key: "skills", label: "技能興趣" },
  { key: "account", label: "帳戶設定" },
];

export default function StaffAdminFormModal({ staff, onClose, onSaved }) {
  const isEdit = !!staff;
  const [section, setSection] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    display_name: staff?.display_name || "",
    full_name: staff?.full_name || "",
    chinese_name: staff?.chinese_name || "",
    gender: staff?.gender || "",
    date_of_birth: staff?.date_of_birth || "",
    hkid: staff?.hkid || "",
    nationality: staff?.nationality || "",
    marital_status: staff?.marital_status || "",
    mobile: staff?.mobile || "",
    personal_email: staff?.personal_email || "",
    address: staff?.address || "",
    work_email: staff?.work_email || "",
    direct_phone: staff?.direct_phone || "",
    work_phone: staff?.work_phone || "",
    position: staff?.position || "",
    bu_name: staff?.bu_name || "",
    team_name: staff?.team_name || "",
    team_role_name: staff?.team_role_name || "",
    team_leader_name: staff?.team_leader_name || "",
    entry_date: staff?.entry_date || "",
    probation_end_date: staff?.probation_end_date || "",
    o_base_location: staff?.o_base_location || "",
    o_status: staff?.o_status || "Active",
    termination_date: staff?.termination_date || "",
    bank_name: staff?.bank_name || "",
    bank_account_number: staff?.bank_account_number || "",
    bank_account_holder: staff?.bank_account_holder || "",
    emergency_contact_name: staff?.emergency_contact_name || "",
    emergency_contact_relation: staff?.emergency_contact_relation || "",
    emergency_contact_phone: staff?.emergency_contact_phone || "",
    education: staff?.education || [],
    work_experience: staff?.work_experience || [],
    skills: staff?.skills || [],
    interests: staff?.interests || [],
    languages: staff?.languages || [],
    login_mobile: staff?.login_mobile || "",
    login_password: staff?.login_password || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addArr = (field, item) => setForm(f => ({ ...f, [field]: [...(f[field] || []), item] }));
  const removeArr = (field, i) => setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));
  const updateArr = (field, i, key, val) => setForm(f => ({
    ...f, [field]: f[field].map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }));

  const handleSave = async () => {
    if (!form.display_name) return;
    setSaving(true);
    const payload = { ...form };
    if (isEdit) {
      await base44.entities.Staff.update(staff.id, payload);
      // Provision account if mobile + password
      if (form.login_mobile && form.login_password) {
        await base44.functions.invoke("manageStaffAccount", {
          action: "provision",
          staffId: staff.id,
          loginMobile: form.login_mobile,
          loginPassword: form.login_password,
          role: "user",
        });
      }
    } else {
      const created = await base44.entities.Staff.create(payload);
      if (form.login_mobile && form.login_password && created?.id) {
        await base44.functions.invoke("manageStaffAccount", {
          action: "provision",
          staffId: created.id,
          loginMobile: form.login_mobile,
          loginPassword: form.login_password,
          role: "user",
        });
      }
    }
    setSaving(false);
    onSaved();
  };

  const renderInput = (label, field, type = "text", placeholder = "", className = "") => (
    <div className={className}>
      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
      <input type={type} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} />
    </div>
  );

  const renderSelect = (label, field, options) => (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1">{label}</label>
      <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
        value={form[field]} onChange={e => set(field, e.target.value)}>
        <option value="">請選擇</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-black text-gray-900 text-base">{isEdit ? "編輯員工資料" : "新增員工"}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto shrink-0">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${section === s.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {section === "basic" && (
            <div className="grid grid-cols-2 gap-3">
              {renderInput("顯示名稱 *", "display_name")}
              {renderInput("英文姓名", "full_name")}
              {renderInput("中文姓名", "chinese_name")}
              {renderSelect("性別", "gender", ["Male","Female","Other"])}
              {renderInput("出生日期", "date_of_birth", "date")}
              {renderSelect("婚姻狀況", "marital_status", ["Single","Married","Divorced","Widowed"])}
              {renderInput("身份證", "hkid", "text", "A123456(7)")}
              {renderInput("國籍", "nationality", "text", "Hong Kong")}
              {renderInput("手機號碼", "mobile", "tel")}
              {renderInput("個人電郵", "personal_email", "email")}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-600 block mb-1">住址</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                  rows={2} value={form.address} onChange={e => set("address", e.target.value)} />
              </div>
            </div>
          )}

          {section === "job" && (
            <div className="grid grid-cols-2 gap-3">
              {renderInput("職位", "position")}
              {renderInput("BU", "bu_name")}
              {renderInput("Team", "team_name")}
              {renderInput("Team Role", "team_role_name")}
              {renderInput("直屬上司", "team_leader_name")}
              {renderInput("辦公室地點", "o_base_location")}
              {renderInput("入職日期", "entry_date", "date")}
              {renderInput("試用期完結", "probation_end_date", "date")}
              {renderInput("工作電郵", "work_email", "email")}
              {renderInput("直線電話", "direct_phone")}
              {renderInput("工作手機", "work_phone")}
              {renderSelect("在職狀態", "o_status", ["Active","Inactive"])}
              {form.o_status === 'Inactive' && renderInput("離職日期", "termination_date", "date")}
            </div>
          )}

          {section === "personal" && (
            <div className="text-sm text-gray-500 italic">（個人資料已在「基本資料」中設定）</div>
          )}

          {section === "bank" && (
            <div className="space-y-3">
              {renderInput("銀行名稱", "bank_name", "text", "例：滙豐銀行")}
              {renderInput("銀行帳戶號碼", "bank_account_number")}
              {renderInput("帳戶持有人姓名", "bank_account_holder")}
            </div>
          )}

          {section === "emergency" && (
            <div className="space-y-3">
              {renderInput("緊急聯絡人姓名", "emergency_contact_name")}
              {renderInput("關係", "emergency_contact_relation", "text", "例：父親")}
              {renderInput("緊急聯絡人電話", "emergency_contact_phone", "tel")}
            </div>
          )}

          {section === "education" && (
            <div className="space-y-3">
              {form.education.map((edu, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => removeArr("education", i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  <div className="grid grid-cols-2 gap-2">
                    {[["institution","學校/機構"],["degree","學位/資格"],["field","主修"],["from_year","開始年份"],["to_year","完成年份"]].map(([k, l]) => (
                      <div key={k}>
                        <label className="text-xs text-gray-500 block mb-0.5">{l}</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                          value={edu[k] || ""} onChange={e => updateArr("education", i, k, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => addArr("education", {})}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-300 hover:text-blue-500">
                <Plus size={13} /> 新增學歷
              </button>
            </div>
          )}

          {section === "experience" && (
            <div className="space-y-3">
              {form.work_experience.map((exp, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 relative">
                  <button onClick={() => removeArr("work_experience", i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  <div className="grid grid-cols-2 gap-2">
                    {[["company","公司"],["role","職位"],["from_date","開始"],["to_date","結束"]].map(([k, l]) => (
                      <div key={k}>
                        <label className="text-xs text-gray-500 block mb-0.5">{l}</label>
                        <input className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                          value={exp[k] || ""} onChange={e => updateArr("work_experience", i, k, e.target.value)} />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 block mb-0.5">描述</label>
                      <textarea className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none resize-none" rows={2}
                        value={exp.description || ""} onChange={e => updateArr("work_experience", i, "description", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => addArr("work_experience", {})}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-300 hover:text-blue-500">
                <Plus size={13} /> 新增工作經驗
              </button>
            </div>
          )}

          {section === "skills" && (
            <div className="space-y-4">
              {[["skills","技能","blue"],["interests","興趣","purple"],["languages","語言能力","green"]].map(([field, label, color]) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">{label}</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(form[field] || []).map((item, i) => (
                      <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {item}
                        <button onClick={() => removeArr(field, i)} className="hover:text-red-500 ml-0.5">×</button>
                      </span>
                    ))}
                  </div>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder={`新增${label}... (Enter 確認)`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        addArr(field, e.target.value.trim());
                        e.target.value = '';
                      }
                    }} />
                </div>
              ))}
            </div>
          )}

          {section === "account" && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">登入手機號碼（登入ID）</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                    value={form.login_mobile} onChange={e => set("login_mobile", e.target.value)} placeholder="例：85291234567" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">登入密碼</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white pr-9"
                      value={form.login_password} onChange={e => set("login_password", e.target.value)} placeholder="設定登入密碼..." />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {isEdit && staff?.linked_user_email && (
                  <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    ✓ 已連結帳戶：{staff.linked_user_email}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">取消</button>
          <button onClick={handleSave} disabled={saving || !form.display_name}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> 儲存中...</> : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}