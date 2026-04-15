import { useState } from "react";
import { X, Eye, EyeOff, Phone, Lock, User, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ROLE_OPTIONS = [
  { value: "user", label: "Staff（一般員工）" },
  { value: "leader", label: "Leader（組長）" },
  { value: "management", label: "Management（管理層）" },
  { value: "admin", label: "Admin（系統管理員）" },
];

export default function StaffFormModal({ staff, buList, teamList, roleList, onClose, onSaved }) {
  const isEdit = !!staff;

  const [form, setForm] = useState({
    display_name: staff?.display_name || "",
    full_name: staff?.full_name || "",
    o_status: staff?.o_status || "Active",
    position: staff?.position || "",
    work_email: staff?.work_email || "",
    entry_date: staff?.entry_date || "",
    login_mobile: staff?.login_mobile || "",
    login_password: staff?.login_password || "",
    o_user_role: staff?.o_user_role || "user",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.display_name) { setMsg("請填寫顯示名稱"); return; }
    setSaving(true);
    setMsg("");

    const payload = {
      display_name: form.display_name,
      full_name: form.full_name,
      o_status: form.o_status,
      position: form.position,
      work_email: form.work_email,
      entry_date: form.entry_date,
      login_mobile: form.login_mobile,
      login_password: form.login_password,
    };

    let savedStaff;
    if (isEdit) {
      savedStaff = await base44.entities.Staff.update(staff.id, payload);
    } else {
      savedStaff = await base44.entities.Staff.create(payload);
    }

    const staffId = isEdit ? staff.id : savedStaff.id;
    const wasInactive = isEdit && staff.o_status === "Active" && form.o_status === "Inactive";

    // Deactivate account if going Inactive
    if (wasInactive) {
      await base44.functions.invoke("manageStaffAccount", { action: "deactivate", staffId });
    }
    // Provision/update account if mobile + password are provided
    else if (form.login_mobile && form.login_password) {
      await base44.functions.invoke("manageStaffAccount", {
        action: "provision",
        staffId,
        loginMobile: form.login_mobile,
        loginPassword: form.login_password,
        role: form.o_user_role,
      });
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
            <User size={16} className="text-blue-500" />
            {isEdit ? "編輯員工資料" : "新增員工"}
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">顯示名稱 *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder="顯示名稱" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">全名</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Full Name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">職位</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.position} onChange={e => set("position", e.target.value)} placeholder="Position" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">入職日期</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.entry_date} onChange={e => set("entry_date", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">工作電郵</label>
              <input type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={form.work_email} onChange={e => set("work_email", e.target.value)} placeholder="work@company.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">在職狀態 *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                value={form.o_status} onChange={e => set("o_status", e.target.value)}>
                <option value="Active">Active（在職）</option>
                <option value="Inactive">Inactive（離職）</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2 mb-3">
              <Lock size={14} className="text-blue-500" />
              <span className="text-sm font-bold text-gray-700">系統帳戶設定</span>
              <span className="text-xs text-gray-400">（手機號碼登入）</span>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  <Phone size={11} className="inline mr-1" />私人手機號碼（登入ID） *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  value={form.login_mobile}
                  onChange={e => set("login_mobile", e.target.value)}
                  placeholder="例：85291234567"
                />
                <p className="text-[10px] text-gray-400 mt-1">此號碼將作為員工的系統登入ID</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  <Lock size={11} className="inline mr-1" />登入密碼 *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white pr-9"
                    value={form.login_password}
                    onChange={e => set("login_password", e.target.value)}
                    placeholder="設定登入密碼..."
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">系統角色</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  value={form.o_user_role} onChange={e => set("o_user_role", e.target.value)}>
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {isEdit && staff?.linked_user_email && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  ✓ 已連結帳戶：{staff.linked_user_email}
                </div>
              )}
            </div>
          </div>

          {msg && <div className="text-sm text-red-600 font-medium">{msg}</div>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">取消</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> 儲存中...</> : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}