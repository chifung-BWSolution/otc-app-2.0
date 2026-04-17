import { Plane, Briefcase, PartyPopper } from "lucide-react";

const typeStyles = {
  "年假": { cls: "bg-teal-100 text-teal-700", icon: Plane, label: "年假中" },
  "病假": { cls: "bg-rose-100 text-rose-700", icon: Plane, label: "病假中" },
  "事假": { cls: "bg-amber-100 text-amber-700", icon: Plane, label: "事假中" },
  "公幹": { cls: "bg-indigo-100 text-indigo-700", icon: Briefcase, label: "公幹中" },
  "在家工作": { cls: "bg-blue-100 text-blue-700", icon: Briefcase, label: "在家工作" },
};

function resolveStyle(leave_type) {
  if (!leave_type) return { cls: "bg-gray-100 text-gray-600", icon: Plane, label: "休假中" };
  for (const k of Object.keys(typeStyles)) {
    if (leave_type.includes(k)) return typeStyles[k];
  }
  // fallback by keyword
  if (/公幹|出差|business/i.test(leave_type)) return typeStyles["公幹"];
  if (/wfh|home/i.test(leave_type)) return typeStyles["在家工作"];
  return { cls: "bg-teal-100 text-teal-700", icon: Plane, label: leave_type };
}

export function AbsenceBadge({ absence, size = "sm" }) {
  if (!absence) return null;
  const { cls, icon: Icon, label } = resolveStyle(absence.leave_type);
  const sz = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";
  const iconSz = size === "sm" ? 9 : 11;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full font-semibold whitespace-nowrap ${cls} ${sz}`}>
      <Icon size={iconSz} /> {label}
    </span>
  );
}

export function HolidayBanner({ holidays }) {
  if (!holidays?.length) return null;
  return (
    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl px-3 py-2 flex items-center gap-2">
      <PartyPopper size={16} className="text-pink-500 shrink-0" />
      <div className="text-xs text-pink-700">
        <span className="font-bold">今天是公司假期：</span>
        {holidays.map((h, i) => (
          <span key={i}>
            {h.title}{i < holidays.length - 1 ? "、" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}