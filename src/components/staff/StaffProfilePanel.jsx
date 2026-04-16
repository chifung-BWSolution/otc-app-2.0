import { useState, useEffect } from "react";
import { X, Mail, Phone, Pencil, MapPin, Calendar, Building2, User, CreditCard, BookOpen, Briefcase, Star, ArrowLeft } from "lucide-react";
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

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'management';
  const isOwnProfile = profile && currentUser && profile.work_email === currentUser.email;

  useEffect(() => {
    setActiveTab("overview");
    loadProfile();
  }, [staffId]);

  const loadProfile = async () => {
    setLoading(true);
    const p = await base44.entities.Staff.get(staffId);
    setProfile(p);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-64">
        <div className="text-gray-400 text-sm">載入中...</div>
      </div>
    );
  }

  if (!profile) return null;

  const InfoRow = ({ label, value, icon: Icon }) => value ? (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      {Icon && <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />}
      <span className="text-gray-400 text-sm w-28 shrink-0">{label}</span>
      <span className="text-gray-800 text-sm font-medium break-all">{value}</span>
    </div>
  ) : null;

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      {/* Hero Banner */}
      <div className="relative h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shrink-0">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-semibold hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={14} /> 返回列表
        </button>
        {isPrivileged && (
          <button
            onClick={() => onAdminEdit(profile)}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-semibold hover:bg-white/30 transition-colors"
          >
            <Pencil size={13} /> 直接編輯
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className="px-6 pt-3 pb-4 shrink-0 flex items-center gap-4">
        <div className="shrink-0">
          {profile.profile_pic ? (
            <img src={profile.profile_pic} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-black border-2 border-white shadow">
              {(profile.display_name || '?')[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-gray-900 text-xl leading-tight">{profile.display_name}</div>
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
        {/* Contact shortcuts */}
        <div className="flex gap-2 shrink-0">
          {profile.work_email && (
            <a href={`mailto:${profile.work_email}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200 transition-colors font-medium">
              <Mail size={14} /> 發送電郵
            </a>
          )}
          {profile.mobile && (
            <a href={`tel:${profile.mobile}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs hover:bg-gray-200 transition-colors font-medium">
              <Phone size={14} /> 致電
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-100 px-6 shrink-0">
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
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">職位資訊</h3>
              <InfoRow label="BU" value={profile.bu_name} icon={Building2} />
              <InfoRow label="Team" value={profile.team_name} icon={Building2} />
              <InfoRow label="Team Role" value={profile.team_role_name} />
              <InfoRow label="直屬上司" value={profile.team_leader_name} icon={User} />
              <InfoRow label="入職日期" value={profile.entry_date} icon={Calendar} />
              <InfoRow label="辦公室" value={profile.base_location} icon={MapPin} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">聯絡資料</h3>
              <InfoRow label="工作電郵" value={profile.work_email} icon={Mail} />
              <InfoRow label="直線電話" value={profile.direct_phone} icon={Phone} />
              <InfoRow label="工作手機" value={profile.work_phone} icon={Phone} />
              {isPrivileged && (
                <>
                  <InfoRow label="個人手機" value={profile.mobile} icon={Phone} />
                  <InfoRow label="個人電郵" value={profile.personal_email} icon={Mail} />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "personal" && (
          <div>
            {!isPrivileged && !isOwnProfile ? (
              <div className="text-center text-gray-400 py-12">
                <User size={40} className="mx-auto mb-3 opacity-30" />
                <p>僅限本人或管理員查看</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0">
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

        {activeTab === "bank" && (
          <div>
            {!isPrivileged && !isOwnProfile ? (
              <div className="text-center text-gray-400 py-12">
                <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                <p>僅限本人或管理員查看</p>
              </div>
            ) : (
              <div className="max-w-lg">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">銀行帳戶資料</h3>
                <InfoRow label="銀行名稱" value={profile.bank_name} icon={CreditCard} />
                <InfoRow label="帳戶號碼" value={isPrivileged ? profile.bank_account_number : (profile.bank_account_number ? '•••• ' + profile.bank_account_number.slice(-4) : null)} />
                <InfoRow label="帳戶名稱" value={profile.bank_account_holder} />
              </div>
            )}
          </div>
        )}

        {activeTab === "emergency" && (
          <div>
            {!isPrivileged && !isOwnProfile ? (
              <div className="text-center text-gray-400 py-12">
                <Phone size={40} className="mx-auto mb-3 opacity-30" />
                <p>僅限本人或管理員查看</p>
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

        {activeTab === "education" && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BookOpen size={13} /> 學歷記錄
            </h3>
            {(profile.education || []).length === 0 ? (
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
            )}
          </div>
        )}

        {activeTab === "experience" && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Briefcase size={13} /> 工作經驗
            </h3>
            {(profile.work_experience || []).length === 0 ? (
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
            )}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star size={13} /> 技能
              </h3>
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).length === 0 ? (
                  <span className="text-gray-400 text-sm">暫無記錄</span>
                ) : (
                  (profile.skills || []).map((s, i) => (
                    <span key={i} className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">{s}</span>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">興趣</h3>
              <div className="flex flex-wrap gap-2">
                {(profile.interests || []).length === 0 ? (
                  <span className="text-gray-400 text-sm">暫無記錄</span>
                ) : (
                  (profile.interests || []).map((s, i) => (
                    <span key={i} className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium">{s}</span>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">語言能力</h3>
              <div className="flex flex-wrap gap-2">
                {(profile.languages || []).length === 0 ? (
                  <span className="text-gray-400 text-sm">暫無記錄</span>
                ) : (
                  (profile.languages || []).map((s, i) => (
                    <span key={i} className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">{s}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}