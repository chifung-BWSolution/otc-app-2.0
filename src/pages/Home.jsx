import { useNavigate } from "react-router-dom";
import BirthdayWidget from "../components/BirthdayWidget";

const modules = [
  {
    label: "公司資訊",
    icon: "🏢",
    color: "bg-blue-500",
    items: [
      { label: "公司新知", path: "/company/news", icon: "📰" },
      { label: "公司日曆", path: "/company/calendar", icon: "📅" },
      { label: "表格下載", path: "/company/forms", icon: "📂" },
      { label: "聯絡同事", path: "/company/contact", icon: "📞" },
      { label: "公司FAQ", path: "/company/faq", icon: "❓" },
      { label: "物資借用", path: "/company/resources", icon: "📦" },
      { label: "P9費用報銷", path: "/company/expense", icon: "💰" },
      { label: "行政協助", path: "/company/admin-help", icon: "🛎️" },
    ],
  },
  {
    label: "App資訊",
    icon: "📱",
    color: "bg-purple-500",
    items: [
      { label: "科技新聞", path: "/app/tech-news", icon: "🔬" },
      { label: "App Store", path: "/app/store", icon: "🛒" },
      { label: "建議購買", path: "/app/suggest", icon: "💡" },
    ],
  },
  {
    label: "工作匯報",
    icon: "📊",
    color: "bg-green-500",
    items: [
      { label: "每日工作匯報", path: "/work/daily", icon: "📝" },
      { label: "每星期學習匯報", path: "/work/weekly", icon: "📚" },
      { label: "每月KPI匯報", path: "/work/kpi", icon: "🎯" },
      { label: "主要項目", path: "/work/projects", icon: "🚀" },
      { label: "特別批核", path: "/work/special-approval", icon: "✅" },
      { label: "跟進會議", path: "/work/meetings", icon: "🤝" },
    ],
  },
  {
    label: "考勤/假期",
    icon: "⏰",
    color: "bg-orange-500",
    items: [
      { label: "簽到記錄", path: "/attendance/records", icon: "📋" },
      { label: "簽到打卡", path: "/attendance/checkin", icon: "👆" },
      { label: "假期申請", path: "/attendance/leave", icon: "🌴" },
      { label: "活動加班", path: "/attendance/overtime", icon: "⚡" },
    ],
  },
  {
    label: "課程管理",
    icon: "🎓",
    color: "bg-teal-500",
    items: [
      { label: "課程中心", path: "/course/center", icon: "🏫" },
      { label: "培訓日程", path: "/course/schedule", icon: "🗓️" },
      { label: "每星期匯報", path: "/course/weekly", icon: "📝" },
      { label: "我的知識", path: "/course/my-knowledge", icon: "🧠" },
      { label: "考核申請", path: "/course/exam", icon: "📜" },
    ],
  },
  {
    label: "業務拓展",
    icon: "💼",
    color: "bg-pink-500",
    items: [
      { label: "廣告費用", path: "/business/ad-expense", icon: "📣" },
      { label: "Tender登記", path: "/business/tender", icon: "📋" },
    ],
  },
  {
    label: "領袖管理",
    icon: "👑",
    color: "bg-yellow-500",
    items: [
      { label: "團隊管理", path: "/leader/team", icon: "👥" },
      { label: "安排培訓", path: "/leader/training", icon: "🎯" },
      { label: "知識認證", path: "/leader/certification", icon: "🏅" },
    ],
  },
  {
    label: "行政跟進",
    icon: "⚙️",
    color: "bg-red-500",
    items: [
      { label: "批核申請", path: "/admin/approvals", icon: "✅" },
      { label: "假期審批", path: "/admin/leave-approvals", icon: "🌴" },
      { label: "員工目錄", path: "/admin/staff", icon: "👤" },
      { label: "組織架構設定", path: "/admin/org-settings", icon: "🏗️" },
      { label: "建立帳戶", path: "/admin/create-account", icon: "➕" },
      { label: "新同事入職", path: "/admin/onboarding", icon: "🎉" },
      { label: "同事離職", path: "/admin/offboarding", icon: "👋" },
      { label: "電話管理", path: "/admin/phones", icon: "📱" },
      { label: "功過記錄", path: "/admin/performance-records", icon: "📊" },
      { label: "App管理", path: "/admin/app-management", icon: "📲" },
      { label: "課程管理", path: "/admin/course-management", icon: "🎓" },
    ],
  },
  {
    label: "管理員",
    icon: "🛡️",
    color: "bg-slate-600",
    items: [
      { label: "分析報表", path: "/superadmin/analytics", icon: "📈" },
      { label: "同事一覽表", path: "/superadmin/directory", icon: "👥" },
    ],
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3 pb-6">
      <BirthdayWidget />
      {modules.map((mod) => (
        <div key={mod.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 pt-4 pb-2">
          <h3 className="text-sm font-bold text-gray-700 mb-3">{mod.icon} {mod.label}</h3>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {mod.items.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl group-hover:bg-gray-100 group-active:scale-95 transition-all shadow-sm">
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600 text-center leading-tight w-full truncate px-0.5">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}