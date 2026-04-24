import { X, Phone, Mail, MessageCircle, Building2, Briefcase, Users, MapPin, User, CalendarClock, UserCheck } from "lucide-react";
import { AbsenceBadge } from "./AbsenceBadge";

function normalizePhone(raw) {
  if (!raw) return "";
  return String(raw).replace(/[^\d+]/g, "");
}

function buildWhatsAppURL(mobile, defaultCountryCode = "852") {
  const clean = normalizePhone(mobile);
  if (!clean) return null;
  // If already has country code prefix
  if (clean.startsWith("+")) return `https://wa.me/${clean.slice(1)}`;
  if (clean.startsWith("00")) return `https://wa.me/${clean.slice(2)}`;
  // If it's 8 digits (HK) → prepend 852; if 11 digits starting with 1 (CN) → use as-is
  if (clean.length === 11 && clean.startsWith("1")) return `https://wa.me/86${clean}`;
  if (clean.length === 8) return `https://wa.me/${defaultCountryCode}${clean}`;
  return `https://wa.me/${clean}`;
}

function Row({ label, value, icon, href }) {
  if (!value) return null;
  const content = (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400 mb-0.5">{label}</div>
        <div className="text-sm text-gray-800 font-medium break-all">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">{content}</a> : content;
}

export default function ContactProfilePanel({ person, region, absence, colleagues = [], onClose }) {
  if (!person) return null;

  const waHK = buildWhatsAppURL(person.mobile, "852");
  const initial = (person.display_name || person.full_name || "?")[0];

  // Resolve delegate from colleagues for richer contact info
  const delegate = absence?.delegate_email
    ? colleagues.find(c => c.work_email === absence.delegate_email)
    : null;

  return (
    <div className="w-80 shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col overflow-hidden sticky top-0 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Banner */}
      <div className="relative">
        <div className="h-20" style={{ background: `linear-gradient(135deg, ${region?.color || "#6366f1"}, #a78bfa)` }} />
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-lg text-gray-600 hover:bg-white transition-colors shadow-sm">
          <X size={13} />
        </button>
        <div className="absolute -bottom-6 left-4">
          {person.profile_pic ? (
            <img src={person.profile_pic} alt="" className="w-14 h-14 rounded-full object-cover ring-4 ring-white" />
          ) : (
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ring-4 ring-white"
              style={{ backgroundColor: region?.color || "#6366f1" }}>
              {initial}
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 px-4 pb-2">
        <div className="font-black text-gray-900 text-base">{person.display_name}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {person.full_name && <span>{person.full_name}</span>}
          {person.chinese_name && person.chinese_name !== person.display_name && <span> · {person.chinese_name}</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          {person.position && <span className="text-xs text-blue-600 font-semibold">{person.position}</span>}
          {person.team_name && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{person.team_name}</span>}
          {region && (
            <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: region.color || "#14b8a6" }}>
              {region.icon} {region.name}
            </span>
          )}
          {absence && <AbsenceBadge absence={absence} size="md" />}
        </div>

        {/* Absence details */}
        {absence && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-700">
              <CalendarClock size={14} />
              <span className="text-xs font-bold">目前休假中 · {absence.leave_type}</span>
            </div>
            <div className="text-xs text-amber-800 space-y-0.5">
              <div>休假期間：<span className="font-semibold">{absence.from_date} 至 {absence.to_date}</span>{absence.time_slot && absence.time_slot !== "全日" ? `（${absence.time_slot}）` : ""}</div>
              <div>預計回歸：<span className="font-semibold">{absence.return_date}</span></div>
              {absence.reason && <div className="text-amber-600 line-clamp-2">備註：{absence.reason}</div>}
            </div>

            {(absence.delegate_name || absence.delegate_email) && (
              <div className="border-t border-amber-200 pt-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold mb-1">
                  <UserCheck size={12} /> 休假期間代理人
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {delegate?.display_name || absence.delegate_name || absence.delegate_email}
                    </div>
                    {delegate?.position && <div className="text-xs text-gray-500">{delegate.position}</div>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(delegate?.work_email || absence.delegate_email) && (
                      <a href={`mailto:${delegate?.work_email || absence.delegate_email}`}
                        className="p-1.5 rounded-lg bg-white text-amber-700 hover:bg-amber-100 border border-amber-200">
                        <Mail size={12} />
                      </a>
                    )}
                    {delegate?.mobile && (
                      <a href={`tel:${delegate.mobile.replace(/[^\d+]/g, "")}`}
                        className="p-1.5 rounded-lg bg-white text-amber-700 hover:bg-amber-100 border border-amber-200">
                        <Phone size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick contact buttons */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {person.work_email && (
            <a href={`mailto:${person.work_email}`}
              className="flex flex-col items-center gap-0.5 py-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
              title={person.work_email}>
              <Mail size={15} />
              <span className="text-[10px] font-semibold">電郵</span>
            </a>
          )}
          {person.direct_phone && (
            <a href={`tel:${normalizePhone(person.direct_phone)}`}
              className="flex flex-col items-center gap-0.5 py-2 bg-indigo-50 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
              title={person.direct_phone}>
              <Phone size={15} />
              <span className="text-[10px] font-semibold">直線</span>
            </a>
          )}
          {person.mobile && (
            <a href={`tel:${normalizePhone(person.mobile)}`}
              className="flex flex-col items-center gap-0.5 py-2 bg-emerald-50 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors"
              title={person.mobile}>
              <Phone size={15} />
              <span className="text-[10px] font-semibold">手機</span>
            </a>
          )}
          {waHK && (
            <a href={waHK} target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-0.5 py-2 bg-green-50 rounded-lg text-green-600 hover:bg-green-100 transition-colors">
              <MessageCircle size={15} />
              <span className="text-[10px] font-semibold">WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 mt-1">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">詳細資料</div>
        <Row label="辦公室" value={person.o_base_location} icon={<Building2 size={14} />} />
        <Row label="BU" value={person.bu_name} icon={<Briefcase size={14} />} />
        <Row label="Team" value={person.team_name} icon={<Users size={14} />} />
        <Row label="Team Role" value={person.team_role_name} icon={<Briefcase size={14} />} />
        <Row label="職位" value={person.position} icon={<Briefcase size={14} />} />
        <Row label="直屬上司" value={person.team_leader_name} icon={<User size={14} />} />
        <Row label="工作電郵" value={person.work_email} icon={<Mail size={14} />} href={person.work_email ? `mailto:${person.work_email}` : null} />
        <Row label="直線電話" value={person.direct_phone} icon={<Phone size={14} />} href={person.direct_phone ? `tel:${normalizePhone(person.direct_phone)}` : null} />
        <Row label="工作手機" value={person.work_phone} icon={<Phone size={14} />} href={person.work_phone ? `tel:${normalizePhone(person.work_phone)}` : null} />
        <Row label="手機" value={person.mobile} icon={<Phone size={14} />} href={person.mobile ? `tel:${normalizePhone(person.mobile)}` : null} />
        <Row label="居住地區" value={person.address} icon={<MapPin size={14} />} />
      </div>
    </div>
  );
}