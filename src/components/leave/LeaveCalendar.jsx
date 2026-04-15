import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["日", "一", "二", "三", "四", "五", "六"];
const COLORS = [
  "bg-blue-200 text-blue-800",
  "bg-green-200 text-green-800",
  "bg-purple-200 text-purple-800",
  "bg-orange-200 text-orange-800",
  "bg-pink-200 text-pink-800",
  "bg-teal-200 text-teal-800",
  "bg-yellow-200 text-yellow-800",
  "bg-red-200 text-red-800",
];

function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function LeaveCalendar({ approvedLeaves }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const leavesByDay = useMemo(() => {
    const map = {};
    for (const leave of approvedLeaves) {
      const start = new Date(leave.from_date);
      const end = new Date(leave.to_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          if (!map[day].find(l => l.id === leave.id)) {
            map[day].push(leave);
          }
        }
      }
    }
    return map;
  }, [approvedLeaves, year, month]);

  const today = new Date();
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
        <h3 className="font-bold text-gray-900">{year}年 {month + 1}月 公司假期日曆</h3>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
        {DAYS.map(d => (
          <div key={d} className="bg-gray-50 text-center text-xs font-bold text-gray-500 py-2">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[70px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const leaves = leavesByDay[day] || [];
          return (
            <div key={day} className={`bg-white min-h-[70px] p-1 ${isToday(day) ? "ring-2 ring-blue-400 ring-inset" : ""}`}>
              <div className={`text-xs font-bold mb-0.5 ${isToday(day) ? "text-blue-600" : "text-gray-700"}`}>{day}</div>
              <div className="space-y-0.5">
                {leaves.slice(0, 3).map(l => (
                  <div key={l.id} className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${getColorForName(l.user_name)}`} title={`${l.user_name} - ${l.leave_type}`}>
                    {l.user_name?.split(" ")[0]}
                  </div>
                ))}
                {leaves.length > 3 && (
                  <div className="text-[9px] text-gray-400 px-1">+{leaves.length - 3} 更多</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}