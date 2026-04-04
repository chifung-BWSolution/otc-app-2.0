import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";

const menuGroups = [
  {
    key: "home",
    items: [{ label: "🏠 主頁", path: "/" }],
  },
  {
    key: "company",
    label: "🏢 公司資訊",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-400",
    items: [
      { label: "📰 公司新知", path: "/company/news" },
      { label: "📅 公司日曆", path: "/company/calendar" },
      { label: "📂 表格下載", path: "/company/forms" },
      { label: "📞 聯絡同事", path: "/company/contact" },
      { label: "❓ 公司FAQ", path: "/company/faq" },
      { label: "📦 物資借用", path: "/company/resources" },
      { label: "💰 P9費用報銷", path: "/company/expense" },
      { label: "🛎️ 行政協助", path: "/company/admin-help" },
    ],
  },
  {
    key: "app",
    label: "📱 App資訊",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-400",
    items: [
      { label: "🔬 科技新聞", path: "/app/tech-news" },
      { label: "🛒 App Store", path: "/app/store" },
      { label: "💡 建議購買", path: "/app/suggest" },
    ],
  },
  {
    key: "work",
    label: "📊 工作匯報",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-400",
    items: [
      { label: "📝 每日工作匯報", path: "/work/daily" },
      { label: "📚 每星期學習匯報", path: "/work/weekly" },
      { label: "🎯 每月KPI匯報", path: "/work/kpi" },
      { label: "🚀 主要項目", path: "/work/projects" },
      { label: "✅ 特別批核", path: "/work/special-approval" },
      { label: "🤝 跟進會議", path: "/work/meetings" },
    ],
  },
  {
    key: "attendance",
    label: "⏰ 考勤/假期",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-400",
    items: [
      { label: "📋 簽到記錄", path: "/attendance/records" },
      { label: "👆 簽到打卡", path: "/attendance/checkin" },
      { label: "🌴 假期申請", path: "/attendance/leave" },
      { label: "⚡ 活動加班", path: "/attendance/overtime" },
    ],
  },
  {
    key: "course",
    label: "🎓 課程管理",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-400",
    items: [
      { label: "🏫 課程中心", path: "/course/center" },
      { label: "🗓️ 培訓日程", path: "/course/schedule" },
      { label: "📝 每星期匯報", path: "/course/weekly" },
      { label: "🧠 我的知識", path: "/course/my-knowledge" },
      { label: "📜 考核申請", path: "/course/exam" },
    ],
  },
  {
    key: "business",
    label: "💼 業務拓展",
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-400",
    items: [
      { label: "📣 廣告費用", path: "/business/ad-expense" },
      { label: "📋 Tender登記", path: "/business/tender" },
    ],
  },
  {
    key: "leader",
    label: "👑 領袖管理",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    items: [
      { label: "👥 團隊管理", path: "/leader/team" },
      { label: "🎯 安排培訓", path: "/leader/training" },
      { label: "🏅 知識認證", path: "/leader/certification" },
    ],
  },
  {
    key: "adminfollow",
    label: "⚙️ 行政跟進",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-400",
    items: [
      { label: "✅ 批核申請", path: "/admin/approvals" },
      { label: "🌴 假期審批", path: "/admin/leave-approvals" },
      { label: "👤 員工管理", path: "/admin/staff" },
      { label: "➕ 建立帳戶", path: "/admin/create-account" },
      { label: "🎉 新同事入職", path: "/admin/onboarding" },
      { label: "👋 同事離職", path: "/admin/offboarding" },
      { label: "📱 電話管理", path: "/admin/phones" },
      { label: "📊 功過記錄", path: "/admin/performance-records" },
      { label: "📲 App管理", path: "/admin/app-management" },
      { label: "🎓 課程管理", path: "/admin/course-management" },
    ],
  },
  {
    key: "superadmin",
    label: "👨‍💼 管理員",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-400",
    items: [
      { label: "📈 分析報表", path: "/superadmin/analytics" },
      { label: "👥 同事一覽表", path: "/superadmin/directory" },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState(
    Object.fromEntries(menuGroups.map((g) => [g.key, true]))
  );

  const toggleGroup = (key) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-30 transition-all duration-300 flex flex-col ${
          collapsed ? "-translate-x-full md:translate-x-0 md:w-14" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between px-3 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shrink-0">
          {!collapsed && (
            <div>
              <div className="font-bold text-sm">🏢 企業管理系統</div>
              <div className="text-xs opacity-80">Admin Portal</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-auto"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {menuGroups.map((group) => (
            <div key={group.key}>
              {group.label ? (
                <>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold ${group.color} hover:opacity-70 transition-opacity mt-1`}
                  >
                    {!collapsed ? (
                      <>
                        <span>{group.label}</span>
                        {openGroups[group.key] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </>
                    ) : (
                      <span className="text-lg mx-auto">{group.label.split(" ")[0]}</span>
                    )}
                  </button>
                  {(openGroups[group.key] || collapsed) &&
                    group.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => { navigate(item.path); if (window.innerWidth < 768) setCollapsed(true); }}
                        title={item.label}
                        className={`w-full flex items-center py-1.5 text-sm transition-all hover:bg-gray-100 ${
                          collapsed ? "px-0 justify-center" : "px-5"
                        } ${
                          location.pathname === item.path
                            ? `${group.bg} ${group.color} font-semibold border-r-4 ${group.border}`
                            : "text-gray-600"
                        }`}
                      >
                        <span className="text-base">{item.label.split(" ")[0]}</span>
                        {!collapsed && (
                          <span className="ml-2 text-left text-xs">
                            {item.label.split(" ").slice(1).join(" ")}
                          </span>
                        )}
                      </button>
                    ))}
                </>
              ) : (
                group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); if (window.innerWidth < 768) setCollapsed(true); }}
                    title={item.label}
                    className={`w-full flex items-center py-3 text-sm font-semibold transition-colors hover:bg-gray-100 ${
                      collapsed ? "px-0 justify-center" : "px-4"
                    } ${
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-600 border-r-4 border-blue-400"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="text-lg">{item.label.split(" ")[0]}</span>
                    {!collapsed && <span className="ml-2">{item.label.split(" ").slice(1).join(" ")}</span>}
                  </button>
                ))
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}