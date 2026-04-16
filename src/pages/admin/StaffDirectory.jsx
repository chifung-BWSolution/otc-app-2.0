import { useState, useEffect } from "react";
import { Search, X, Plus, Users, CheckCircle, Bell } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StaffProfilePanel from "@/components/staff/StaffProfilePanel";
import StaffAdminFormModal from "@/components/staff/StaffAdminFormModal";
import PendingUpdatesPanel from "@/components/staff/PendingUpdatesPanel";

const statusColor = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
};

export default function StaffDirectory() {
  const [currentUser, setCurrentUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [buList, setBuList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const [search, setSearch] = useState("");
  const [buFilter, setBuFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(false); // "new" | staffObj | false
  const [showPending, setShowPending] = useState(false);

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'management';

  const loadData = async () => {
    setLoading(true);
    const [me, staffData, buData, teamData] = await Promise.all([
      base44.auth.me(),
      base44.entities.StaffProfile.list('-entry_date', 500),
      base44.entities.NOSBU.filter({ is_active: true }, 'display', 100),
      base44.entities.NOSTeam.filter({ is_active: true }, 'display', 100),
    ]);
    setCurrentUser(me);
    setStaff(staffData);
    setBuList(buData);
    setTeamList(teamData);

    if (me?.role === 'admin' || me?.role === 'management') {
      const pending = await base44.entities.ProfileUpdateRequest.filter({ request_status: 'Pending Review' });
      setPendingCount(pending.length);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredTeams = buFilter
    ? teamList.filter(t => t.bu_name === buList.find(b => b.id === buFilter)?.display)
    : teamList;

  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (s.display_name || '').toLowerCase().includes(q) ||
      (s.full_name || '').toLowerCase().includes(q) ||
      (s.position || '').toLowerCase().includes(q) ||
      (s.work_email || '').toLowerCase().includes(q);
    const matchBu = !buFilter || s.bu_name === buList.find(b => b.id === buFilter)?.display;
    const matchTeam = !teamFilter || s.team_name === teamList.find(t => t.id === teamFilter)?.display;
    const matchStatus = !statusFilter || s.o_status === statusFilter;
    return matchSearch && matchBu && matchTeam && matchStatus;
  });

  const activeCount = staff.filter(s => s.o_status === 'Active').length;

  return (
    <div className="flex gap-4 h-full">
      {/* Admin Form Modal */}
      {showAdminForm && (
        <StaffAdminFormModal
          staff={showAdminForm === "new" ? null : showAdminForm}
          onClose={() => setShowAdminForm(false)}
          onSaved={() => { setShowAdminForm(false); setSelectedStaff(null); loadData(); }}
        />
      )}

      {/* Pending Updates Panel */}
      {showPending && (
        <PendingUpdatesPanel
          onClose={() => { setShowPending(false); loadData(); }}
        />
      )}

      {/* Main List */}
      <div className="flex-1 space-y-3 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-black text-gray-900">員工目錄</h2>
            <p className="text-xs text-gray-400">{activeCount} 位在職員工</p>
          </div>
          <div className="flex items-center gap-2">
            {isPrivileged && pendingCount > 0 && (
              <button
                onClick={() => setShowPending(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                <Bell size={14} />
                待審批更新
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              </button>
            )}
            {isPrivileged && (
              <button
                onClick={() => setShowAdminForm("new")}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={15} /> 新增員工
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <div className="text-xl font-bold text-blue-600">{staff.length}</div>
            <div className="text-xs text-gray-500">總人數</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <div className="text-xl font-bold text-green-600">{activeCount}</div>
            <div className="text-xs text-gray-500">在職</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
            <div className="text-xl font-bold text-purple-600">{teamList.length}</div>
            <div className="text-xs text-gray-500">Team 數量</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
                placeholder="搜尋姓名、Email、職位..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">全部狀態</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none flex-1"
              value={buFilter} onChange={e => { setBuFilter(e.target.value); setTeamFilter(""); }}>
              <option value="">全部 BU</option>
              {buList.map(b => <option key={b.id} value={b.id}>{b.display}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none flex-1"
              value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
              <option value="">全部 Team</option>
              {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.display}</option>)}
            </select>
            {(search || buFilter || teamFilter || statusFilter) && (
              <button onClick={() => { setSearch(""); setBuFilter(""); setTeamFilter(""); setStatusFilter("Active"); }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2">
                <X size={13} /> 清除
              </button>
            )}
            <span className="text-xs text-gray-400 self-center ml-auto">顯示 {filtered.length} / {staff.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">載入中...</div>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50">
                  <th className="px-4 py-3 text-left">員工</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-left">職位</th>
                  {isPrivileged && <th className="px-4 py-3 text-left">電郵</th>}
                  <th className="px-4 py-3 text-left">狀態</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}
                    onClick={() => setSelectedStaff(s)}
                    className={`border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors ${selectedStaff?.id === s.id ? 'bg-blue-50/60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.profile_pic ? (
                          <img src={s.profile_pic} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(s.display_name || '?')[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{s.display_name}</div>
                          <div className="text-xs text-gray-400">{s.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-blue-600 font-medium">{s.team_name || '—'}</div>
                      <div className="text-gray-400">{s.bu_name}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.position || '—'}</td>
                    {isPrivileged && <td className="px-4 py-3 text-xs text-gray-500">{s.work_email || '—'}</td>}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.o_status] || 'bg-gray-100 text-gray-500'}`}>
                        {s.o_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              沒有符合條件的員工
            </div>
          )}
        </div>
      </div>

      {/* Profile Panel */}
      {selectedStaff && (
        <StaffProfilePanel
          staffId={selectedStaff.id}
          currentUser={currentUser}
          onClose={() => setSelectedStaff(null)}
          onAdminEdit={(s) => setShowAdminForm(s)}
          onDataChanged={loadData}
        />
      )}
    </div>
  );
}