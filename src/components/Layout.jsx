import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import NotificationBell from "./NotificationBell";

const pageTitles = {
  "/": "🏠 主頁",
  "/company/news": "📰 公司新知",
  "/company/calendar": "📅 公司日曆",
  "/company/forms": "📂 表格下載",
  "/company/contact": "📞 聯絡同事",
  "/company/faq": "❓ 公司FAQ",
  "/company/resources": "📦 物資借用",
  "/company/expense": "💰 P9費用報銷",
  "/company/admin-help": "🛎️ 行政協助",
  "/app/tech-news": "🔬 科技新聞",
  "/app/store": "🛒 App Store",
  "/app/suggest": "💡 建議購買",
  "/work/daily": "📝 每日工作匯報",
  "/work/weekly": "📚 每星期學習匯報",
  "/work/kpi": "🎯 每月KPI匯報",
  "/work/projects": "🚀 主要項目",
  "/work/special-approval": "✅ 特別批核",
  "/work/meetings": "🤝 跟進會議",
  "/attendance/records": "📋 簽到記錄",
  "/attendance/checkin": "👆 簽到打卡",
  "/attendance/leave": "🌴 假期申請",
  "/attendance/overtime": "⚡ 活動加班",
  "/course/center": "🏫 課程中心",
  "/course/schedule": "🗓️ 培訓日程",
  "/course/weekly": "📝 每星期匯報",
  "/course/my-knowledge": "🧠 我的知識",
  "/course/exam": "📜 考核申請",
  "/business/ad-expense": "📣 廣告費用",
  "/business/tender": "📋 Tender登記",
  "/leader/team": "👥 團隊管理",
  "/leader/training": "🎯 安排培訓",
  "/leader/certification": "🏅 知識認證",
  "/admin/approvals": "✅ 批核申請",
  "/admin/leave-approvals": "🌴 假期審批",
  "/admin/staff": "👤 員工管理",
  "/admin/create-account": "➕ 建立帳戶",
  "/admin/onboarding": "🎉 新同事入職",
  "/admin/offboarding": "👋 同事離職",
  "/admin/phones": "📱 電話管理",
  "/admin/performance-records": "📊 功過記錄",
  "/admin/app-management": "📲 App管理",
  "/admin/course-management": "🎓 課程管理",
  "/superadmin/analytics": "📈 分析報表",
  "/superadmin/directory": "👥 同事一覽表",
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "企業管理系統";

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "md:ml-14" : "ml-0 md:ml-64"}`}>
        <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell currentUser={currentUser} />
            <button className="p-2 rounded-full hover:bg-gray-100">
              <User size={20} className="text-gray-600" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}