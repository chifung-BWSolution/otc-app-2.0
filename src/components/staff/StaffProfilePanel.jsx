import { useState, useEffect } from "react";
import { X, Mail, Phone, Pencil, MapPin, Calendar, Building2, User, CreditCard, BookOpen, Briefcase, Star, AlertCircle } from "lucide-react";
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

export default function StaffProfilePanel({ staffId, currentUser, onClose, onAdminEdit, onDataChanged }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingRequest, setPendingRequest] = useState(null);

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'management';
  const isOwnProfile = profile && currentUser && (
    profile.work_email === currentUser.email
  );

  useEffect(() => {
    loadProfile();
  }, [staffId]);

  const loadProfile = async () => {
    setLoading(true);
    const p = await base44.entities.Staff.get(staffId);
    setProfile(p);
    setPendingRequest(null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="w-80 shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center min-h-64">
        <div className="text-gray-400 text-sm">載入中...</div>
      </div>
    );
  }

  if (!profile) return null;

  const InfoRow = ({ label, value, icon: Icon }) => value ? (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
      {Icon && <Icon size={12} className="text-gray-400 mt-0.5 shrink-0" />}
      <span className="text-gray-400 text-xs w-20 shrink-0">{label}</span>
      <span className="text-gray-800 text-xs font-medium break-all">{value}</span>
    </div>
  ) : null;

  return (
    <>
      <div className="w-80 shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-0 self-start max-h-[calc(100vh-120px)] overflow-y-auto flex flex-col">
        {/* Cover */}
        <div className="relative h-20 bg-gradient-to-br from-blue-500 to-purple-600 shrink-0">
          <button onClick={onClose}
            className="absolute top-2 right-2 p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/40 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="px-4 -mt-7 pb-3 shrink-0">
          <div className="mb-2">
            {profile.profile_pic ? (
              <img src={profile.profile_pic} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" alt="" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-black border-2 border-white shadow-md">
                {(profile.display_name || '?')[0]}
              </div>
            )}
          </div>
          <div className="font-black text-gray-900 text-base leading-tight">{profile.display_name}</div>
          {profile.full_name && <div className="text-xs text-gray-500">{profile.full_name}</div>}
          {profile.chinese_name && profile.chinese_name !== profile.display_name && (
            <div className="text-xs text-gray-400">{profile.chinese_name}</div>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile.o_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {profile.o_status}
            </span>
            {profile.position && (
              <span className="text-xs text-blue-600 font-medium">{profile.position}</span>
            )}
          </div>



          {/* Action buttons */}
          <div className="flex gap-1.5 mt-3">
            {isPrivileged && (
              <button
                onClick={() => onAdminEdit(profile)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Pencil size={11} /> 直接編輯
              </button>
            )}
            {profile.work_email && (
              <a href={`mailto:${profile.work_email}`}
                className="flex items-center justify-center gap-1 px-2.5 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs hover:bg-gray-100 transition-colors">
                <Mail size={13} />
              </a>
            )}
            {profile.mobile && (
              <a href={`tel:${profile.mobile}`}
                className="flex items-center justify-center gap-1 px-2.5 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs hover:bg-gray-100 transition-colors">
                <Phone size={13} />
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-100 shrink-0">
          <div className="flex overflow-x-auto scrollbar-thin px-2 py-1 gap-1">
            {TABS.map(tab => (
              <button key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-3 flex-1 space-y-1 text-xs">
          {activeTab === "overview" && (
            <div className="space-y-1">
              <InfoRow label="BU" value={profile.bu_name} icon={Building2} />
              <InfoRow label="Team" value={profile.team_name} icon={Building2} />
              <InfoRow label="Role" value={profile.team_role_name} />
              <InfoRow label="直屬上司" value={profile.team_leader_name} icon={User} />
              <InfoRow label="入職日期" value={profile.entry_date} icon={Calendar} />
              <InfoRow label="辦公室" value={profile.base_location} icon={MapPin} />
              <InfoRow label="工作電郵" value={profile.work_email} icon={Mail} />
              <InfoRow label="直線" value={profile.direct_phone} icon={Phone} />
              <InfoRow label="工作手機" value={profile.work_phone} icon={Phone} />
              {isPrivileged && (
                <>
                  <InfoRow label="手機" value={profile.mobile} icon={Phone} />
                  <InfoRow label="個人電郵" value={profile.personal_email} icon={Mail} />
                </>
              )}
            </div>
          )}

          {activeTab === "personal" && (
            <div className="space-y-1">
              {!isPrivileged && !isOwnProfile ? (
                <div className="text-center text-gray-400 py-6">
                  <User size={28} className="mx-auto mb-2 opacity-40" />
                  <p>僅限本人或管理員查看</p>
                </div>
              ) : (
                <>
                  <InfoRow label="中文姓名" value={profile.chinese_name} />
                  <InfoRow label="英文姓名" value={profile.full_name} />
                  <InfoRow label="性別" value={profile.gender} />
                  <InfoRow label="出生日期" value={profile.date_of_birth} />
                  <InfoRow label="身份證" value={isPrivileged ? profile.hkid : (profile.hkid ? '••••••••' : null)} />
                  <InfoRow label="國籍" value={profile.nationality} />
                  <InfoRow label="婚姻狀況" value={profile.marital_status} />
                  <InfoRow label="手機" value={profile.mobile} />
                  <InfoRow label="個人電郵" value={profile.personal_email} />
                  <InfoRow label="住址" value={profile.address} />
                </>
              )}
            </div>
          )}

          {activeTab === "bank" && (
            <div className="space-y-1">
              {!isPrivileged && !isOwnProfile ? (
                <div className="text-center text-gray-400 py-6">
                  <CreditCard size={28} className="mx-auto mb-2 opacity-40" />
                  <p>僅限本人或管理員查看</p>
                </div>
              ) : (
                <>
                  <InfoRow label="銀行" value={profile.bank_name} icon={CreditCard} />
                  <InfoRow label="帳戶號碼" value={isPrivileged ? profile.bank_account_number : (profile.bank_account_number ? '•••• ' + profile.bank_account_number.slice(-4) : null)} />
                  <InfoRow label="帳戶名稱" value={profile.bank_account_holder} />
                </>
              )}
            </div>
          )}

          {activeTab === "emergency" && (
            <div className="space-y-1">
              {!isPrivileged && !isOwnProfile ? (
                <div className="text-center text-gray-400 py-6">
                  <Phone size={28} className="mx-auto mb-2 opacity-40" />
                  <p>僅限本人或管理員查看</p>
                </div>
              ) : (
                <>
                  <InfoRow label="姓名" value={profile.emergency_contact_name} />
                  <InfoRow label="關係" value={profile.emergency_contact_relation} />
                  <InfoRow label="電話" value={profile.emergency_contact_phone} />
                </>
              )}
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-gray-500 font-semibold mb-2">
                <BookOpen size={13} /> 學歷
              </div>
              {(profile.education || []).length === 0 ? (
                <div className="text-gray-400 text-center py-4">暫無學歷記錄</div>
              ) : (
                (profile.education || []).map((e, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2.5 space-y-0.5">
                    <div className="font-semibold text-gray-800">{e.institution}</div>
                    <div className="text-gray-600">{e.degree} {e.field && `· ${e.field}`}</div>
                    <div className="text-gray-400">{e.from_year}{e.to_year && ` – ${e.to_year}`}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-gray-500 font-semibold mb-2">
                <Briefcase size={13} /> 工作經驗
              </div>
              {(profile.work_experience || []).length === 0 ? (
                <div className="text-gray-400 text-center py-4">暫無工作經驗記錄</div>
              ) : (
                (profile.work_experience || []).map((e, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-2.5 space-y-0.5">
                    <div className="font-semibold text-gray-800">{e.company}</div>
                    <div className="text-gray-600">{e.role}</div>
                    <div className="text-gray-400">{e.from_date}{e.to_date && ` – ${e.to_date}`}</div>
                    {e.description && <div className="text-gray-500 mt-1">{e.description}</div>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1 text-gray-500 font-semibold mb-2">
                  <Star size={13} /> 技能
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.skills || []).length === 0 ? (
                    <span className="text-gray-400">暫無記錄</span>
                  ) : (
                    (profile.skills || []).map((s, i) => (
                      <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500 font-semibold mb-2">興趣</div>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.interests || []).length === 0 ? (
                    <span className="text-gray-400">暫無記錄</span>
                  ) : (
                    (profile.interests || []).map((s, i) => (
                      <span key={i} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="text-gray-500 font-semibold mb-2">語言能力</div>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.languages || []).length === 0 ? (
                    <span className="text-gray-400">暫無記錄</span>
                  ) : (
                    (profile.languages || []).map((s, i) => (
                      <span key={i} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}