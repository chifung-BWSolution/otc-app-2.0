import { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, PieChart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getUserRole } from "@/lib/leavePermissions";
import LeaveApplicationForm from "@/components/leave/LeaveApplicationForm";
import LeaveCalendar from "@/components/leave/LeaveCalendar";
import LeaveRecordsTab from "@/components/leave/LeaveRecordsTab";
import LeaveBalancesTab from "@/components/leave/LeaveBalancesTab";

const TABS = [
  { key: "apply", label: "申請頁面", icon: CalendarDays },
  { key: "records", label: "假期記錄", icon: ClipboardList },
  { key: "balances", label: "假期餘額", icon: PieChart },
];

export default function LeaveApplication() {
  const [activeTab, setActiveTab] = useState("apply");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("staff");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [records, setRecords] = useState([]);
  const [balances, setBalances] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) { setLoading(false); return; }

    const [me, types, users] = await Promise.all([
      base44.auth.me(),
      base44.entities.LeaveType.filter({ is_active: true }, "code"),
      base44.entities.User.list("full_name", 500),
    ]);
    setUser(me);
    setUserRole(getUserRole(me));
    setLeaveTypes(types);
    setAllUsers(users);

    await loadAllData();
    setLoading(false);
  };

  const loadAllData = async () => {
    const [allRecords, allBalances] = await Promise.all([
      base44.entities.LeaveRequest.list("-created_date", 500),
      base44.entities.LeaveBalance.list("user_email", 500),
    ]);
    setRecords(allRecords);
    setBalances(allBalances);
    setApprovedLeaves(allRecords.filter(r => r.status === "已批核"));
  };

  const handleRefresh = () => loadAllData();

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "apply" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <LeaveApplicationForm
            user={user}
            userRole={userRole}
            leaveTypes={leaveTypes}
            allUsers={allUsers}
            balances={balances}
            onSubmitted={handleRefresh}
          />
          <LeaveCalendar approvedLeaves={approvedLeaves} />
        </div>
      )}

      {activeTab === "records" && (
        <LeaveRecordsTab
          records={records}
          loading={loading}
          user={user}
          userRole={userRole}
          userDept={user?.department}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === "balances" && (
        <LeaveBalancesTab
          balances={balances}
          loading={loading}
          user={user}
          userRole={userRole}
          userDept={user?.department}
        />
      )}
    </div>
  );
}