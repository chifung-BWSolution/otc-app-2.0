import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Users, Link2, Unlink, Loader2 } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [linkingUserId, setLinkingUserId] = useState(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [usersRes, staffList] = await Promise.all([
      base44.functions.invoke("listUsersAdmin", {}),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 2000),
    ]);
    setUsers(usersRes.data.users || []);
    setStaff(staffList);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const staffMap = {};
  for (const s of staff) {
    if (s.bubble_id) staffMap[s.bubble_id] = s;
  }

  const handleLink = async (userId, staffRec) => {
    setSaving(true);
    await base44.functions.invoke("updateUserAdmin", {
      userId, data: { linked_staff_id: staffRec.bubble_id },
    });
    // Also update Staff record's linked_user_email
    const user = users.find(u => u.id === userId);
    if (user?.email) {
      await base44.entities.Staff.update(staffRec.id, {
        linked_user_email: user.email,
      });
    }
    setLinkingUserId(null);
    setStaffSearch("");
    setSaving(false);
    await loadData();
  };

  const handleUnlink = async (userId) => {
    setSaving(true);
    const user = users.find(u => u.id === userId);
    // Clear staff's linked_user_email
    if (user?.linked_staff_id) {
      const linkedStaff = staff.find(s => s.bubble_id === user.linked_staff_id);
      if (linkedStaff) {
        await base44.entities.Staff.update(linkedStaff.id, { linked_user_email: "" });
      }
    }
    await base44.functions.invoke("updateUserAdmin", {
      userId, data: { linked_staff_id: "" },
    });
    setSaving(false);
    await loadData();
  };

  const handleRoleChange = async (userId, newRole) => {
    await base44.functions.invoke("updateUserAdmin", {
      userId, data: { role: newRole },
    });
    await loadData();
  };

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    const linkedStaff = staffMap[u.linked_staff_id];
    return (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (linkedStaff?.display_name || "").toLowerCase().includes(q);
  });

  const filteredStaff = staff.filter(s => {
    if (!staffSearch) return true;
    const q = staffSearch.toLowerCase();
    return (s.display_name || "").toLowerCase().includes(q) ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.position || "").toLowerCase().includes(q) ||
      (s.team_name || "").toLowerCase().includes(q);
  });

  const roleColors = {
    admin: "bg-red-100 text-red-700",
    management: "bg-purple-100 text-purple-700",
    leader: "bg-blue-100 text-blue-700",
    user: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-black text-gray-900">用戶帳戶管理</h2>
          <p className="text-xs text-gray-400">{users.length} 個帳戶 · 可為每個帳戶關聯員工資料</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            placeholder="搜尋電郵、姓名、關聯員工..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
                <th className="px-4 py-3 text-left">用戶</th>
                <th className="px-4 py-3 text-left">角色</th>
                <th className="px-4 py-3 text-left">關聯員工</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const linked = u.linked_staff_id ? staffMap[u.linked_staff_id] : null;
                const isLinking = linkingUserId === u.id;
                return (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-xs">{u.full_name || "—"}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role || "user"}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${roleColors[u.role] || roleColors.user}`}
                      >
                        <option value="user">user</option>
                        <option value="leader">leader</option>
                        <option value="management">management</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {isLinking ? (
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-1">
                            <Search size={12} className="text-gray-400" />
                            <input
                              className="border border-blue-300 rounded-lg px-2 py-1 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-400"
                              placeholder="搜尋員工姓名、Team..."
                              value={staffSearch}
                              onChange={e => setStaffSearch(e.target.value)}
                              autoFocus
                            />
                            <button onClick={() => { setLinkingUserId(null); setStaffSearch(""); }} className="text-gray-400 hover:text-gray-600">
                              <X size={14} />
                            </button>
                          </div>
                          <div className="absolute left-0 top-full mt-0.5 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-48 overflow-y-auto">
                            {filteredStaff.slice(0, 30).map(s => (
                              <button
                                key={s.id}
                                onClick={() => handleLink(u.id, s)}
                                disabled={saving}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 text-xs"
                              >
                                {s.profile_pic ? (
                                  <img src={s.profile_pic} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                    {(s.display_name || "?")[0]}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{s.display_name}</div>
                                  <div className="text-[10px] text-gray-400 truncate">{s.team_name} · {s.position || "—"}</div>
                                </div>
                                {s.bubble_id && <span className="text-[9px] text-gray-300 shrink-0">{s.bubble_id.slice(0, 8)}...</span>}
                              </button>
                            ))}
                            {filteredStaff.length === 0 && (
                              <div className="text-center py-4 text-xs text-gray-400">無符合結果</div>
                            )}
                          </div>
                        </div>
                      ) : linked ? (
                        <div className="flex items-center gap-2">
                          {linked.profile_pic ? (
                            <img src={linked.profile_pic} className="w-7 h-7 rounded-full object-cover shrink-0" alt="" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {(linked.display_name || "?")[0]}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{linked.display_name}</div>
                            <div className="text-[10px] text-gray-400">{linked.team_name} · {linked.position || "—"}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">未關聯</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {linked ? (
                        <button
                          onClick={() => handleUnlink(u.id)}
                          disabled={saving}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <Unlink size={12} /> 取消關聯
                        </button>
                      ) : (
                        <button
                          onClick={() => setLinkingUserId(u.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Link2 size={12} /> 關聯員工
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            沒有符合條件的帳戶
          </div>
        )}
      </div>
    </div>
  );
}