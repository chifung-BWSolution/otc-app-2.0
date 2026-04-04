import { useState } from "react";

const events = [
  { date: "2026-04-07", title: "部門會議", type: "會議", color: "bg-blue-100 text-blue-700" },
  { date: "2026-04-10", title: "季度最佳員工提名截止", type: "行政", color: "bg-red-100 text-red-700" },
  { date: "2026-04-15", title: "員工培訓日", type: "培訓", color: "bg-green-100 text-green-700" },
  { date: "2026-04-18", title: "週年紀念日假期", type: "假期", color: "bg-purple-100 text-purple-700" },
  { date: "2026-04-25", title: "全員大會", type: "會議", color: "bg-blue-100 text-blue-700" },
  { date: "2026-05-01", title: "勞動節假期", type: "假期", color: "bg-purple-100 text-purple-700" },
  { date: "2026-05-15", title: "公司旅行（第一天）", type: "活動", color: "bg-yellow-100 text-yellow-700" },
];

const months = ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"];
const days = ["日","一","二","三","四","五","六"];

export default function CompanyCalendar() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const firstDay = new Date(current.year, current.month, 1).getDay();
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();

  const getEvents = (day) => {
    const dateStr = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const prevMonth = () => {
    setCurrent((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  };
  const nextMonth = () => {
    setCurrent((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  };

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-white/20 rounded-lg transition-colors">◀</button>
          <h2 className="font-bold text-lg">{current.year}年 {months[current.month]}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-white/20 rounded-lg transition-colors">▶</button>
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => (
            <div key={d} className="text-center text-xs font-bold py-2 text-gray-500 bg-gray-50">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="border border-gray-50 min-h-16" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEvents(day);
            const isToday = today.getDate() === day && today.getMonth() === current.month && today.getFullYear() === current.year;
            return (
              <div key={day} className={`border border-gray-50 min-h-16 p-1 hover:bg-gray-50 transition-colors ${isToday ? "bg-blue-50" : ""}`}>
                <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-blue-500 text-white" : "text-gray-700"}`}>
                  {day}
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.map((e, idx) => (
                    <div key={idx} className={`text-xs px-1 py-0.5 rounded truncate ${e.color}`}>{e.title}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-700 mb-3">📌 即將到來的活動</h3>
        <div className="space-y-2">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
              <div className="text-center bg-gray-100 rounded-lg px-2 py-1 min-w-14">
                <div className="text-xs text-gray-500">{e.date.split("-")[1]}月</div>
                <div className="font-bold text-gray-700">{parseInt(e.date.split("-")[2])}</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{e.title}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${e.color}`}>{e.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}