import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Pencil, Save, X, Mail, Phone, MapPin, Calendar,
  Building2, User, CreditCard, BookOpen, Briefcase, Star, Plus, Trash2, Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const TABS = [
  { key: "overview", label: "概覽" },
  { key: "personal", label: "個人資料" },
  { key: "bank", label: "銀行資料" },
  { key: "emergency", label: "緊急聯絡" },
  { key: "education", label: "學歷" },
  { key: "experience", label: "工作經驗" },
  { key: "skills", label: "技能興趣" },
];

const inputCls = "w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white";
const selectCls = "w-full border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none bg-white";

export default function StaffProfilePage() {
  const navigate = useNavigate();
  const { staffId } = useParams();

  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'management';
  const isOwnProfile = profile && currentUser && profile.work_email === currentUser.email;
  const canEdit = isPrivileged || isOwnProfile;

  useEffect(() => {
    loadData();
  }, [staffId]);

  const loadData = async () => {
    setLoading(true);
    const [me, p] = await Promise.all([
      base44.auth.me(),
      base44.entities.Staff.get(staffId),
    ]);
    setCurrentUser(me);
    setProfile(p);
    setForm(p || {});
    setLoading(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addArr = (field, item) => setForm(f => ({ ...f, [field]: [...(f[field] || []), item] }));
  const removeArr = (field, i) => setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));
  const updateArr = (field, i, key, val) => setForm(f => ({
    ...f, [field]: f[field].map((item, idx) => idx === i ? { ...item, [key]: val } : item)
  }));

  const handleCancel = () => {
    setForm(profile);
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (isPrivileged) {
      // Admin: save directly
      await base44.entities.Staff.update(staffId, form);
      await loadData();
    } else {
      // Normal staff: submit for approval
      const sensitiveFields = [
        'display_name','full_name','chinese_name','gender','date_of_birth','hkid',
        'nationality','marital_status','mobile','personal_email','address',
        'bank_name','bank_account_number','bank_account_holder',
        'emergency_contact_name','emergency_contact_relation','emergency_contact_phone',
        'education','work_experience','skills','interests','languages'
      ];
      const updates = {};
      sensitiveFields.forEach(f => { if (form[f] !== undefined) updates[f] = form[f]; });
      await base44.entities.ProfileUpdateRequest.create({
        staff_profile_id: staffId,
        requested_by_email: currentUser.email,
        requested_by_name: currentUser.full_name || currentUser.email,
        request_status: 'Pending Review',
        ...updates,
      });
    }
    setSaving(false);
    setEditMode(false);
  };

  // --- View helpers ---
  const InfoRow = ({ label, value }) => value ? (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 text-sm w-28 shrink-0">{label}</span>
      <span className="text-gray-800 text-sm font-medium break-all">{value}</span>
    </div>
  ) : null;

  // Edit field renderers
  const EditInput = ({ label, field, type = "text", placeholder = "" }) => (
    <div className="py-1.5 border-b border-blue-50 last:border-0">
      <span className="text-gray-400 text-xs block mb-0.5">{label}</span>
      <input type={type} className={inputCls} value={form[field] || ""} onChange={e => set(field, e.target.value)} placeholder={placeholder} />
    </div>
  );

  const EditSelect = ({ label, field, options }) => (
    <div className="py-1.5 border-b border-blue-50 last:border-0">
      <span className="text-gray-400 text-xs block mb-0.5">{label}</span>
      <select className={selectCls} value={form[field] || ""} onChange={e => set(field, e.target.value)}>
        <option value="">請選擇</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-20 text-gray-400">找不到員工資料</div>;
  }

  return (
    <div className="w-full space-y-0">
      {/* Hero Banner */}
      <div className="relative h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-t-2xl">
        <button
          onClick={() => navigate("/admin/staff")}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-semibold hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={14} /> 返回列表
        </button>

        {/* Edit / Save / Cancel buttons */}
        {canEdit && (
          <div className="absolute top-4 right-4 flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-semibold hover:bg-white/30 transition-colors"
                >
                  <X size={13} /> 取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-blue-600 text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {isPrivileged ? "儲存" : "提交審批"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-semibold hover:bg-white/30 transition-colors"
              >
                <Pencil size={13} /> 直接編輯
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow-sm border border-gray-100 border-t-0 rounded-b-2xl">
        {/* Profile Header */}
        <div className="px-6 pt-4 pb-4 flex items-center gap-4 border-b border-gray-100">
          <div className="shrink-0">
            {profile.profile_pic ? (
              <img src={profile.profile_pic} className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow" alt="" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-black shadow">
                {(profile.display_name || '?')[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-gray-900 text-2xl leading-tight">{profile.display_name}</div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {profile.full_name && <span className="text-sm text-gray-500">{profile.full_name}</span>}
              {profile.chinese_name && profile.chinese_name !== profile.display_name && (
                <span className="text-sm text-gray-400">{profile.chinese_name}</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile.o_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {profile.o_status}
              </span>
              {profile.position && <span className="text-sm text-blue-600 font-semibold">{profile.position}</span>}
              {profile.team_name && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{profile.team_name}</span>}
              {profile.bu_name && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{profile.bu_name}</span>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {profile.work_email && (
              <a href={`mailto:${profile.work_email}`} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200 transition-colors font-medium">
                <Mail size={14} /> 發送電郵
              </a>
            )}
            {profile.mobile && (
              <a href={`tel:${profile.mobile}`} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200 transition-colors font-medium">
                <Phone size={14} /> 致電
              </a>
            )}
          </div>
        </div>

        {/* Edit mode notice for non-admins */}
        {editMode && !isPrivileged && (
          <div className="mx-6 mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            ⚠️ 您的修改將提交至管理員審批，審批前原資料不受影響。
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-5">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">職位資訊</h3>
                {editMode && isPrivileged ? (
                  <>
                    <EditInput label="BU" field="bu_name" />
                    <EditInput label="Team" field="team_name" />
                    <EditInput label="Team Role" field="team_role_name" />
                    <EditInput label="直屬上司" field="team_leader_name" />
                    <EditInput label="入職日期" field="entry_date" type="date" />
                    <EditInput label="辦公室" field="base_location" />
                    <EditInput label="職位" field="position" />
                    <EditSelect label="在職狀態" field="o_status" options={["Active","Inactive"]} />
                  </>
                ) : (
                  <>
                    <InfoRow label="BU" value={profile.bu_name} />
                    <InfoRow label="Team" value={profile.team_name} />
                    <InfoRow label="Team Role" value={profile.team_role_name} />
                    <InfoRow label="直屬上司" value={profile.team_leader_name} />
                    <InfoRow label="入職日期" value={profile.entry_date} />
                    <InfoRow label="辦公室" value={profile.base_location} />
                  </>
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">聯絡資料</h3>
                {editMode && isPrivileged ? (
                  <>
                    <EditInput label="工作電郵" field="work_email" type="email" />
                    <EditInput label="直線電話" field="direct_phone" />
                    <EditInput label="工作手機" field="work_phone" />
                    <EditInput label="個人手機" field="mobile" type="tel" />
                    <EditInput label="個人電郵" field="personal_email" type="email" />
                  </>
                ) : (
                  <>
                    <InfoRow label="工作電郵" value={profile.work_email} />
                    <InfoRow label="直線電話" value={profile.direct_phone} />
                    <InfoRow label="工作手機" value={profile.work_phone} />
                    {isPrivileged && (
                      <>
                        <InfoRow label="個人手機" value={profile.mobile} />
                        <InfoRow label="個人電郵" value={profile.personal_email} />
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* PERSONAL */}
          {activeTab === "personal" && (
            <div>
              {!isPrivileged && !isOwnProfile ? (
                <div className="text-center text-gray-400 py-12">
                  <User size={40} className="mx-auto mb-3 opacity-30" />
                  <p>僅限本人或管理員查看</p>
                </div>
              ) : editMode ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">基本資料</h3>
                    <EditInput label="顯示名稱" field="display_name" />
                    <EditInput label="中文姓名" field="chinese_name" />
                    <EditInput label="英文姓名" field="full_name" />
                    <EditSelect label="性別" field="gender" options={["Male","Female","Other"]} />
                    <EditInput label="出生日期" field="date_of_birth" type="date" />
                    <EditInput label="國籍" field="nationality" placeholder="Hong Kong" />
                    <EditSelect label="婚姻狀況" field="marital_status" options={["Single","Married","Divorced","Widowed"]} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">聯絡及其他</h3>
                    <EditInput label="身份證" field="hkid" placeholder="A123456(7)" />
                    <EditInput label="手機" field="mobile" type="tel" />
                    <EditInput label="個人電郵" field="personal_email" type="email" />
                    <div className="py-1.5">
                      <span className="text-gray-400 text-xs block mb-0.5">住址</span>
                      <textarea className={inputCls + " resize-none"} rows={2} value={form.address || ""} onChange={e => set("address", e.target.value)} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">基本資料</h3>
                    <InfoRow label="中文姓名" value={profile.chinese_name} />
                    <InfoRow label="英文姓名" value={profile.full_name} />
                    <InfoRow label="性別" value={profile.gender} />
                    <InfoRow label="出生日期" value={profile.date_of_birth} />
                    <InfoRow label="國籍" value={profile.nationality} />
                    <InfoRow label="婚姻狀況" value={profile.marital_status} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">聯絡及其他</h3>
                    <InfoRow label="身份證" value={isPrivileged ? profile.hkid : (profile.hkid ? '••••••••' : null)} />
                    <InfoRow label="手機" value={profile.mobile} />
                    <InfoRow label="個人電郵" value={profile.personal_email} />
                    <InfoRow label="住址" value={profile.address} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BANK */}
          {activeTab === "bank" && (
            <div>
              {!isPrivileged && !isOwnProfile ? (
                <div className="text-center text-gray-400 py-12">
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                  <p>僅限本人或管理員查看</p>
                </div>
              ) : editMode ? (
                <div className="max-w-lg">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">銀行帳戶資料</h3>
                  <EditInput label="銀行名稱" field="bank_name" placeholder="例：滙豐銀行" />
                  <EditInput label="帳戶號碼" field="bank_account_number" />
                  <EditInput label="帳戶名稱" field="bank_account_holder" />
                </div>
              ) : (
                <div className="max-w-lg">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">銀行帳戶資料</h3>
                  <InfoRow label="銀行名稱" value={profile.bank_name} />
                  <InfoRow label="帳戶號碼" value={isPrivileged ? profile.bank_account_number : (profile.bank_account_number ? '•••• ' + profile.bank_account_number.slice(-4) : null)} />
                  <InfoRow label="帳戶名稱" value={profile.bank_account_holder} />
                </div>
              )}
            </div>
          )}

          {/* EMERGENCY */}
          {activeTab === "emergency" && (
            <div>
              {!isPrivileged && !isOwnProfile ? (
                <div className="text-center text-gray-400 py-12">
                  <Phone size={40} className="mx-auto mb-3 opacity-30" />
                  <p>僅限本人或管理員查看</p>
                </div>
              ) : editMode ? (
                <div className="max-w-lg">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">緊急聯絡人</h3>
                  <EditInput label="姓名" field="emergency_contact_name" />
                  <EditInput label="關係" field="emergency_contact_relation" placeholder="例：父親" />
                  <EditInput label="電話" field="emergency_contact_phone" type="tel" />
                </div>
              ) : (
                <div className="max-w-lg">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">緊急聯絡人</h3>
                  <InfoRow label="姓名" value={profile.emergency_contact_name} />
                  <InfoRow label="關係" value={profile.emergency_contact_relation} />
                  <InfoRow label="電話" value={profile.emergency_contact_phone} />
                </div>
              )}
            </div>
          )}

          {/* EDUCATION */}
          {activeTab === "education" && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <BookOpen size={13} /> 學歷記錄
              </h3>
              {editMode ? (
                <div className="space-y-3">
                  {(form.education || []).map((edu, i) => (
                    <div key={i} className="border border-blue-100 rounded-xl p-4 relative bg-blue-50/30">
                      <button onClick={() => removeArr("education", i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="grid grid-cols-2 gap-3">
                        {[["institution","學校/機構"],["degree","學位/資格"],["field","主修"],["from_year","開始年份"],["to_year","完成年份"]].map(([k,l]) => (
                          <div key={k}>
                            <label className="text-xs text-gray-500 block mb-0.5">{l}</label>
                            <input className={inputCls} value={edu[k] || ""} onChange={e => updateArr("education", i, k, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addArr("education", {})} className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors">
                    <Plus size={13} /> 新增學歷
                  </button>
                </div>
              ) : (
                (profile.education || []).length === 0 ? (
                  <div className="text-gray-400 text-center py-10">暫無學歷記錄</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {(profile.education || []).map((e, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-1 border border-gray-100">
                        <div className="font-bold text-gray-800">{e.institution}</div>
                        <div className="text-sm text-gray-600">{e.degree}{e.field && ` · ${e.field}`}</div>
                        <div className="text-xs text-gray-400">{e.from_year}{e.to_year && ` – ${e.to_year}`}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* EXPERIENCE */}
          {activeTab === "experience" && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Briefcase size={13} /> 工作經驗
              </h3>
              {editMode ? (
                <div className="space-y-3">
                  {(form.work_experience || []).map((exp, i) => (
                    <div key={i} className="border border-blue-100 rounded-xl p-4 relative bg-blue-50/30">
                      <button onClick={() => removeArr("work_experience", i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="grid grid-cols-2 gap-3">
                        {[["company","公司"],["role","職位"],["from_date","開始"],["to_date","結束"]].map(([k,l]) => (
                          <div key={k}>
                            <label className="text-xs text-gray-500 block mb-0.5">{l}</label>
                            <input className={inputCls} value={exp[k] || ""} onChange={e => updateArr("work_experience", i, k, e.target.value)} />
                          </div>
                        ))}
                        <div className="col-span-2">
                          <label className="text-xs text-gray-500 block mb-0.5">描述</label>
                          <textarea className={inputCls + " resize-none"} rows={2} value={exp.description || ""} onChange={e => updateArr("work_experience", i, "description", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addArr("work_experience", {})} className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-300 hover:text-blue-500 transition-colors">
                    <Plus size={13} /> 新增工作經驗
                  </button>
                </div>
              ) : (
                (profile.work_experience || []).length === 0 ? (
                  <div className="text-gray-400 text-center py-10">暫無工作經驗記錄</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {(profile.work_experience || []).map((e, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-1 border border-gray-100">
                        <div className="font-bold text-gray-800">{e.company}</div>
                        <div className="text-sm text-gray-600">{e.role}</div>
                        <div className="text-xs text-gray-400">{e.from_date}{e.to_date && ` – ${e.to_date}`}</div>
                        {e.description && <div className="text-sm text-gray-500 mt-1">{e.description}</div>}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* SKILLS */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              {[
                { field: "skills", label: "技能", color: "blue" },
                { field: "interests", label: "興趣", color: "purple" },
                { field: "languages", label: "語言能力", color: "green" },
              ].map(({ field, label, color }) => (
                <div key={field}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{label}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editMode ? form[field] : profile[field] || []).map((s, i) => (
                      <span key={i} className={`flex items-center gap-1 bg-${color}-100 text-${color}-700 text-sm px-3 py-1 rounded-full font-medium`}>
                        {s}
                        {editMode && (
                          <button onClick={() => removeArr(field, i)} className="hover:text-red-500 ml-0.5 text-xs">×</button>
                        )}
                      </span>
                    ))}
                    {!editMode && (form[field] || []).length === 0 && (
                      <span className="text-gray-400 text-sm">暫無記錄</span>
                    )}
                  </div>
                  {editMode && (
                    <input
                      className="border border-blue-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none w-64"
                      placeholder={`新增${label}... (Enter 確認)`}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          addArr(field, e.target.value.trim());
                          e.target.value = '';
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}