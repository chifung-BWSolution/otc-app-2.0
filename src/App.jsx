import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import CompanyNews from './pages/company/CompanyNews';
import CompanyCalendar from './pages/company/CompanyCalendar';
import ContactColleagues from './pages/company/ContactColleagues';
import ExpenseReport from './pages/company/ExpenseReport';
import CheckIn from './pages/attendance/CheckIn';
import LeaveApplication from './pages/attendance/LeaveApplication';
import DailyReport from './pages/work/DailyReport';
import KPIReport from './pages/work/KPIReport';
import CourseCenter from './pages/course/CourseCenter';
import Analytics from './pages/superadmin/Analytics';
import Directory from './pages/superadmin/Directory';
import ManHourReport from './pages/admin/ManHourReport';
import PerformanceReport from './pages/admin/PerformanceReport';
import StaffAIAnalysis from './pages/admin/StaffAIAnalysis';
import Approvals from './pages/admin/Approvals';
import LeaveApprovals from './pages/admin/LeaveApprovals';
import Placeholder from './pages/Placeholder';
import WeeklyLearning from './pages/work/WeeklyLearning';
import ResourceBorrow from './pages/company/ResourceBorrow';
import AdminHelp from './pages/company/AdminHelp';
import CompanyFAQ from './pages/company/CompanyFAQ';
import TechNews from './pages/app/TechNews';
import AppStore from './pages/app/AppStore';
import AppStoreAnalytics from './pages/app/AppStoreAnalytics';
import AppLicenseManager from './pages/app/AppLicenseManager';
import AppAccessRequests from './pages/app/AppAccessRequests';
import AssessmentArrangement from './pages/admin/AssessmentArrangement';
import ExamCenter from './pages/course/ExamCenter';
import AssessmentResultRegistry from './pages/admin/AssessmentResultRegistry';
import AssessmentDashboard from './pages/admin/AssessmentDashboard';
import StaffDirectory from './pages/admin/StaffDirectory';
import StaffProfilePage from './pages/admin/StaffProfilePage';
import OrgStructure from './pages/settings/OrgStructure';
import WorkSchedule from './pages/settings/WorkSchedule';
import TeamGroups from './pages/settings/TeamGroups';
import ContributionTypes from './pages/settings/ContributionTypes';
import ScoreLevels from './pages/settings/ScoreLevels';
import ReviewPresets from './pages/settings/ReviewPresets';
import MeritDemeritTypes from './pages/settings/MeritDemeritTypes';
import LeaveSettingsPage from './pages/settings/LeaveSettingsPage';
import BubbleDataOverview from './pages/admin/BubbleDataOverview';
import OvertimeApplication from './pages/attendance/OvertimeApplication';
import CourseProfilePage from './pages/course/CourseProfilePage';
import CourseManagement from './pages/admin/CourseManagement';
import TenderRegistration from './pages/business/TenderRegistration';
import WeeklyReport from './pages/course/WeeklyReport';
import KnowledgeCertification from './pages/leader/KnowledgeCertification';
import RegionManagement from './pages/admin/RegionManagement';
import CompanyForms from './pages/company/CompanyForms';
import AnnualReview from './pages/work/AnnualReview';
import PeerReview from './pages/work/PeerReview';
import AnnualReviewAdmin from './pages/admin/AnnualReviewAdmin';
import PeerReviewAdmin from './pages/admin/PeerReviewAdmin';
import AppraisalReportPage from './pages/admin/AppraisalReportPage';
import UserManagement from './pages/admin/UserManagement';
import PagePermissions from './pages/admin/PagePermissions';
import { RegionProvider } from '@/lib/RegionContext';
import Login from './pages/Login';
import EventManagement from './pages/admin/EventManagement';
import EventRegistrationPublic from './pages/events/EventRegistrationPublic';
import JoinEvents from './pages/events/JoinEvents';


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Navigate to="/login" replace />;
    }
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        {/* 公司資訊 */}
        <Route path="/company/news" element={<CompanyNews />} />
        <Route path="/company/calendar" element={<CompanyCalendar />} />
        <Route path="/company/forms" element={<CompanyForms />} />
        <Route path="/company/contact" element={<ContactColleagues />} />
        <Route path="/company/faq" element={<CompanyFAQ />} />
        <Route path="/company/resources" element={<ResourceBorrow />} />
        <Route path="/company/expense" element={<ExpenseReport />} />
        <Route path="/company/admin-help" element={<AdminHelp />} />
        {/* App資訊 */}
        <Route path="/app/tech-news" element={<TechNews />} />
        <Route path="/app/store" element={<AppStore />} />
        <Route path="/app/store/analytics" element={<AppStoreAnalytics />} />
        <Route path="/app/store/licenses" element={<AppLicenseManager />} />
        <Route path="/app/store/requests" element={<AppAccessRequests />} />
        <Route path="/app/suggest" element={<Placeholder title="建議購買" icon="💡" description="提交購買建議" />} />
        {/* 工作匯報 */}
        <Route path="/work/daily" element={<DailyReport />} />
        <Route path="/work/weekly" element={<WeeklyLearning />} />
        <Route path="/work/kpi" element={<KPIReport />} />
        <Route path="/work/projects" element={<Placeholder title="主要項目" icon="🚀" description="查看及管理主要項目進度" />} />
        <Route path="/work/special-approval" element={<Placeholder title="特別批核" icon="✅" description="提交特別批核申請" />} />
        <Route path="/work/annual-review" element={<AnnualReview />} />
        <Route path="/work/peer-review" element={<PeerReview />} />
        {/* 考勤/假期 */}
        <Route path="/attendance/records" element={<Placeholder title="簽到記錄" icon="📋" description="查看出勤記錄" />} />
        <Route path="/attendance/checkin" element={<CheckIn />} />
        <Route path="/attendance/leave" element={<LeaveApplication />} />
        <Route path="/attendance/overtime" element={<OvertimeApplication />} />
        {/* 課程管理 */}
        <Route path="/course/center" element={<CourseCenter />} />
        <Route path="/course/:courseId" element={<CourseProfilePage />} />
        <Route path="/course/exam" element={<ExamCenter />} />
        <Route path="/course/schedule" element={<Placeholder title="培訓日程" icon="🗓️" description="查看即將舉行的培訓" />} />
        <Route path="/course/weekly" element={<WeeklyReport />} />
        <Route path="/course/my-knowledge" element={<Placeholder title="我的知識" icon="🧠" description="個人學習成果及知識庫" />} />
        <Route path="/course/exam" element={<Placeholder title="考核申請" icon="📜" description="申請參加考核認證" />} />
        {/* 業務拓展 */}

        <Route path="/business/tender" element={<TenderRegistration />} />
        {/* 系統設定 */}
        <Route path="/settings/org-structure" element={<OrgStructure />} />
        <Route path="/settings/work-schedule" element={<WorkSchedule />} />
        <Route path="/settings/team-groups" element={<TeamGroups />} />
        <Route path="/settings/contribution-types" element={<ContributionTypes />} />
        <Route path="/settings/score-levels" element={<ScoreLevels />} />
        <Route path="/settings/review-presets" element={<ReviewPresets />} />
        <Route path="/settings/merit-demerit-types" element={<MeritDemeritTypes />} />
        <Route path="/settings/leave" element={<LeaveSettingsPage />} />
        {/* 領袖管理 */}
        <Route path="/leader/team" element={<Placeholder title="團隊管理" icon="👥" description="管理團隊成員及績效" />} />
        <Route path="/leader/training" element={<Placeholder title="安排培訓" icon="🎯" description="為團隊安排培訓計劃" />} />
        <Route path="/leader/certification" element={<KnowledgeCertification />} />
        {/* 行政跟進 */}
        <Route path="/events/join" element={<JoinEvents />} />
        <Route path="/admin/events" element={<EventManagement />} />
        <Route path="/admin/approvals" element={<Approvals />} />
        <Route path="/admin/leave-approvals" element={<LeaveApprovals />} />
        <Route path="/admin/assessment-arrangement" element={<AssessmentArrangement />} />
        <Route path="/admin/assessment-results" element={<AssessmentResultRegistry />} />
        <Route path="/admin/assessment-dashboard" element={<AssessmentDashboard />} />
        <Route path="/admin/staff" element={<StaffDirectory />} />
        <Route path="/admin/staff/:staffId" element={<StaffProfilePage />} />
        <Route path="/admin/org-settings" element={<Navigate to="/settings/org-structure" replace />} />
        <Route path="/admin/bubble-data" element={<BubbleDataOverview />} />

        <Route path="/admin/onboarding" element={<Placeholder title="新同事入職" icon="🎉" description="新員工入職流程管理" />} />
        <Route path="/admin/offboarding" element={<Placeholder title="同事離職" icon="👋" description="員工離職流程管理" />} />
        <Route path="/admin/phones" element={<Placeholder title="電話管理" icon="📱" description="公司電話號碼及分機管理" />} />
        <Route path="/admin/performance-records" element={<Placeholder title="功過記錄" icon="📊" description="員工功過獎懲記錄" />} />
        <Route path="/admin/app-management" element={<Placeholder title="App管理" icon="📲" description="公司應用程式管理" />} />
        <Route path="/admin/course-management" element={<CourseManagement />} />
        <Route path="/admin/regions" element={<RegionManagement />} />
        <Route path="/admin/annual-reviews" element={<AnnualReviewAdmin />} />
        <Route path="/admin/peer-reviews" element={<PeerReviewAdmin />} />
        <Route path="/admin/appraisal-reports" element={<AppraisalReportPage />} />
        <Route path="/admin/user-management" element={<UserManagement />} />
        <Route path="/admin/page-permissions" element={<PagePermissions />} />
        {/* 管理員 */}
        <Route path="/superadmin/analytics" element={<Analytics />} />
        <Route path="/superadmin/directory" element={<Directory />} />
        <Route path="/admin/manhour-report" element={<ManHourReport />} />
        <Route path="/admin/performance-report" element={<PerformanceReport />} />
        <Route path="/admin/staff-ai-analysis" element={<StaffAIAnalysis />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register/:slug" element={<EventRegistrationPublic />} />
            <Route path="/*" element={
              <RegionProvider>
                <AuthenticatedApp />
              </RegionProvider>
            } />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App