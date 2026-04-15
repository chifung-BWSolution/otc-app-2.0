import { useState, useEffect } from "react";
import { Search, X, Phone, Mail, User, Plus, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StaffFormModal from "@/components/admin/StaffFormModal";

const statusColor = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-500",
};

export default function StaffDirectory() {
  const [staff, setStaff] = useState([]);
  const [buList, setBuList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [buFilter, setBuFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selected, setSelected] = useState(null);
  const [formModal, setFormModal] = useState(null); // null | "new" | staff object

  const loadData = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Staff.list('-created_date', 500),
      base44.entities.NOSBU.filter({ is_active: true }, 'display', 100),
      base44.entities.NOSTeam.filter({ is_active: true }, 'display', 100),
      base44.entities.NOSTeamRole.filter({ is_active: true }, 'display', 100),
    ]).then(([staffData, buData, teamData, roleData]) => {
      setStaff(staffData);
      setBuList(buData);
      setTeamList(teamData);
      setRoleList(roleData);
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  // Filter teams by selected BU
  const filteredTeams = buFilter
    ? teamList.filter(t => t.bu_name === buList.find(b => b.id === buFilter)?.display)
    : teamList;

  const filtered = staff.filter(s => {
    const matchSearch = !search ||
      (s.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.work_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.position || '').toLowerCase().includes(search.toLowerCase());
    const matchBu = !buFilter || s.n_bu === buList.find(b => b.id === buFilter)?.bubble_id;
    const matchTeam = !teamFilter || s.n_team === teamList.find(t => t.id === teamFilter)?.bubble_id;
    const matchRole = !roleFilter || s.n_team_role === roleList.find(r => r.id === roleFilter)?.bubble_id;
    const matchStatus = !statusFilter || s.o_status === statusFilter;
    return matchSearch && matchBu && matchTeam && matchRole && matchStatus;
  });

  const clearFilters = () => {
    setSearch(""); setBuFilter(""); setTeamFilter(""); setRoleFilter(""); setStatusFilter("");
  };
  const hasFilters = search || buFilter || teamFilter || roleFilter || statusFilter;

  const activeCount = staff.filter(s => s.o_status === 'Active').length;

  return (
    <div className="flex gap-4">
      {formModal !== null && (
        <StaffFormModal
          staff={formModal === "new" ? null : formModal}
          buList={buList}
          teamList={teamList}
          roleList={roleList}
          onClose={() => setFormModal(null)}
          onSaved={() => { setFormModal(null); setSelected(null); loadData(); }}
        />
      )}

      <div className="flex-1 space-y-3 min-w-0">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">員工目錄</span>
          <button
            onClick={() => setFormModal("new")}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus size={15} /> 新增員工
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
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
          <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
            <div className="text-xl font-bold text-orange-600">{buList.length}</div>
            <div className="text-xs text-gray-500">BU 數量</div>
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
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">全部狀態</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none flex-1"
              value={buFilter}
              onChange={e => { setBuFilter(e.target.value); setTeamFilter(""); }}
            >
              <option value="">全部 BU</option>
              {buList.map(b => <option key={b.id} value={b.id}>{b.display}</option>)}
            </select>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none flex-1"
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
            >
              <option value="">全部 Team</option>
              {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.display}</option>)}
            </select>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none flex-1"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">全部 Role</option>
              {roleList.map(r => <option key={r.id} value={r.id}>{r.display}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 px-2">
                <X size={13} /> 清除
              </button>
            )}
            <span className="text-xs text-gray-400 self-center ml-auto">顯示 {filtered.length} / {staff.length} 人</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">載入中...</div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50">
                  <th className="px-4 py-3 text-left">員工</th>
                  <th className="px-4 py-3 text-left">BU</th>
                  <th className="px-4 py-3 text-left">Team</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">職位</th>
                  <th className="px-4 py-3 text-left">狀態</th>
                  <th className="px-4 py-3 text-left">聯絡</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className={`border-b border-gray-50 cursor-pointer hover:bg-blue-50/40 transition-colors ${selected?.id === s.id ? 'bg-blue-50/60' : ''}`}
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
                          {s.full_name && s.full_name !== s.display_name && (
                            <div className="text-xs text-gray-400">{s.full_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.bu_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-blue-600 font-medium">{s.team_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.team_role_name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-32 truncate">{s.position || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[s.o_status] || 'bg-gray-100 text-gray-500'}`}>
                        {s.o_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {s.work_email && (
                          <a href={`mailto:${s.work_email}`} onClick={e => e.stopPropagation()} className="p-1 bg-gray-100 rounded hover:bg-blue-100 transition-colors">
                            <Mail size={12} className="text-gray-500" />
                          </a>
                        )}
                        {s.direct_phone && (
                          <a href={`tel:${s.direct_phone}`} onClick={e => e.stopPropagation()} className="p-1 bg-gray-100 rounded hover:bg-green-100 transition-colors">
                            <Phone size={12} className="text-gray-500" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">沒有符合條件的員工</div>
          )}
        </div>
      </div>

      {/* Profile Panel */}
      {selected && (
        <div className="w-72 shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 sticky top-0 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="relative h-20 bg-gradient-to-br from-blue-400 to-purple-500">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-2 p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/40 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="px-4 -mt-6 pb-4">
            <div className="mb-3">
              {selected.profile_pic ? (
                <img src={selected.profile_pic} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow">
                  {(selected.display_name || '?')[0]}
                </div>
              )}
            </div>
            <div className="font-black text-gray-900 text-base">{selected.display_name}</div>
            {selected.full_name && selected.full_name !== selected.display_name && (
              <div className="text-xs text-gray-500">{selected.full_name}</div>
            )}
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[selected.o_status]}`}>
              {selected.o_status}
            </span>

            <div className="mt-3 space-y-2 text-xs">
              {[
                { label: 'BU', value: selected.bu_name },
                { label: 'Team', value: selected.team_name },
                { label: 'Role', value: selected.team_role_name },
                { label: '職位', value: selected.position },
                { label: 'Team Leader', value: selected.team_leader_name },
                { label: '入職日期', value: selected.entry_date },
                { label: '工作電郵', value: selected.work_email },
                { label: '商業電郵', value: selected.business_email },
                { label: '直線電話', value: selected.direct_phone },
                { label: '工作手機', value: selected.work_phone },
                { label: '辦公室', value: selected.o_base_location },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex items-start gap-2 py-1.5 border-b border-gray-50">
                  <span className="text-gray-400 w-20 shrink-0">{label}</span>
                  <span className="text-gray-700 font-medium break-all">{value}</span>
                </div>
              ) : null)}
            </div>

            {/* Account info */}
            {selected.login_mobile && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs">
                <div className="text-gray-500 mb-0.5">登入手機號碼</div>
                <div className="font-mono font-bold text-blue-700">{selected.login_mobile}</div>
                {selected.linked_user_email && <div className="text-gray-400 mt-0.5 truncate">{selected.linked_user_email}</div>}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setFormModal(selected)}
                className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Pencil size={12} /> 編輯資料
              </button>
              {selected.work_email && (
                <a href={`mailto:${selected.work_email}`} className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
                  <Mail size={13} />
                </a>
              )}
              {selected.direct_phone && (
                <a href={`tel:${selected.direct_phone}`} className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
                  <Phone size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}