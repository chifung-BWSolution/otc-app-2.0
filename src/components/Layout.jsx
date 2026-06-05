import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { base44 } from "@/api/base44Client";
import NotificationBell from "./NotificationBell";
import RegionBadge from "./RegionBadge";
import UserMenu from "./UserMenu";
import TopNavBar from "./navigation/TopNavBar";
import SubSidebar from "./navigation/SubSidebar";
import { findGroupByPath, menuGroups } from "./navigation/menuConfig";

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
  "/admin/annual-reviews": "📋 年度評估表",
  "/work/annual-review": "📋 年度工作評估",
  "/superadmin/analytics": "📈 分析報表",
  "/superadmin/directory": "👥 同事一覽表",
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // The currently active top-nav group key (null = follow route)
  const [activeKey, setActiveKey] = useState(null);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "企業管理系統";

  const [isMGT, setIsMGT] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      // Dev admin bypass - always show MGT tabs
      if (u?.id === '00000000-0000-0000-0000-000000000000') {
        setIsMGT(true);
        return;
      }
      // Check if user belongs to MGT team
      if (u?.linked_staff_id) {
        base44.entities.Staff.filter({ bubble_id: u.linked_staff_id }, "id", 1)
          .then(list => {
            if (list[0]) {
              const teamName = (list[0].team_name || "").toUpperCase();
              setIsMGT(teamName.includes("MGT"));
            }
          }).catch(() => {});
      }
    }).catch(() => {});

  }, []);

  // Sync activeKey with current route whenever location changes
  useEffect(() => {
    const g = findGroupByPath(location.pathname);
    setActiveKey(g?.key || null);
  }, [location.pathname]);

  const hasSubSidebar = !!(activeKey && menuGroups.find(g => g.key === activeKey)) || !!findGroupByPath(location.pathname);
  const isHome = location.pathname === "/";
  const showSidebar = hasSubSidebar && !isHome;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white shadow-sm px-4 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {showSidebar && (
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              🏢
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-gray-800 leading-tight">企業管理系統</div>
              <div className="text-[10px] text-gray-400 leading-tight">Admin Portal</div>
            </div>
          </div>
          <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
          <h1 className="text-sm md:text-base font-semibold text-gray-700">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <RegionBadge className="hidden sm:inline-flex" />
          <NotificationBell currentUser={currentUser} />
          <UserMenu currentUser={currentUser} />
        </div>
      </header>

      {/* Top Navigation (horizontal main categories) */}
      <div className="sticky top-[49px] z-30">
        <TopNavBar activeKey={activeKey} setActiveKey={setActiveKey} isMGT={isMGT} userRole={currentUser?.role} />
      </div>

      {/* Body: sub sidebar + content */}
      <div className="flex flex-1">
        {showSidebar && (
          <SubSidebar
            activeKey={activeKey}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            userRole={currentUser?.role}
          />
        )}
        <main className="flex-1 p-4 md:p-6 max-w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}