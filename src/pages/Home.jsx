import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useEffect, useState } from "react";

const quickLinks = [
  { label: "簽到打卡", path: "/attendance/checkin", icon: "👆", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "假期申請", path: "/attendance/leave", icon: "🌴", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "每日匯報", path: "/work/daily", icon: "📝", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "費用報銷", path: "/company/expense", icon: "💰", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "公司日曆", path: "/company/calendar", icon: "📅", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "課程中心", path: "/course/center", icon: "🎓", color: "bg-teal-100 text-teal-700 border-teal-200" },
  { label: "行政協助", path: "/company/admin-help", icon: "🛎️", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { label: "聯絡同事", path: "/company/contact", icon: "📞", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
];

const modules = [
  { label: "公司資訊", icon: "🏢", path: "/company/news", color: "from-blue-400 to-blue-600", desc: "新知、日曆、FAQ" },
  { label: "工作匯報", icon: "📊", path: "/work/daily", color: "from-green-400 to-green-600", desc: "日報、週報、KPI" },
  { label: "考勤假期", icon: "⏰", path: "/attendance/checkin", color: "from-orange-400 to-orange-600", desc: "打卡、假期、加班" },
  { label: "課程管理", icon: "🎓", path: "/course/center", color: "from-teal-400 to-teal-600", desc: "課程、培訓、考核" },
  { label: "App資訊", icon: "📱", path: "/app/tech-news", color: "from-purple-400 to-purple-600", desc: "科技新聞、App Store" },
  { label: "業務拓展", icon: "💼", path: "/business/ad-expense", color: "from-pink-400 to-pink-600", desc: "廣告費用、Tender" },
  { label: "領袖管理", icon: "👑", path: "/leader/team", color: "from-yellow-400 to-yellow-600", desc: "團隊、培訓、認證" },
  { label: "行政跟進", icon: "⚙️", path: "/admin/approvals", color: "from-red-400 to-red-600", desc: "批核、員工、入職" },
];

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-HK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">👋 早晨！{user?.full_name || "同事"}</h2>
            <p className="opacity-90 mt-1">{dateStr}</p>
            <p className="opacity-75 text-sm mt-1">歡迎使用企業管理系統</p>
          </div>
          <div className="text-6xl">🏢</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "待批申請", value: "3", icon: "📋", color: "text-red-500" },
          { label: "本月出勤", value: "22天", icon: "✅", color: "text-green-500" },
          { label: "剩餘年假", value: "8天", icon: "🌴", color: "text-blue-500" },
          { label: "進行課程", value: "2", icon: "🎓", color: "text-purple-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl">{stat.icon}</div>
            <div className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-base font-bold text-gray-700 mb-3">⚡ 快速入口</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {quickLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${link.color}`}
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="text-xs mt-1 font-medium text-center leading-tight">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Module Grid */}
      <div>
        <h3 className="text-base font-bold text-gray-700 mb-3">📂 功能模組</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <button
              key={mod.path}
              onClick={() => navigate(mod.path)}
              className={`bg-gradient-to-br ${mod.color} text-white rounded-2xl p-4 text-left shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95`}
            >
              <div className="text-3xl mb-2">{mod.icon}</div>
              <div className="font-bold text-sm">{mod.label}</div>
              <div className="text-xs opacity-80 mt-0.5">{mod.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-bold text-gray-700 mb-3">🕐 最近動態</h3>
        <div className="space-y-2">
          {[
            { time: "09:02", text: "陳大文 完成簽到打卡", icon: "👆" },
            { time: "08:45", text: "李小明 提交假期申請", icon: "🌴" },
            { time: "昨天", text: "張美麗 提交每日工作匯報", icon: "📝" },
            { time: "昨天", text: "系統 發布新公告：公司週年旅行", icon: "📰" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1 text-sm text-gray-700">{item.text}</div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}