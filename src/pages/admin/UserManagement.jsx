import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, Users, Link2, Unlink, Loader2, UserPlus, Send } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [linkingUserId, setLinkingUserId] = useState(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState(null);

  const [accessDenied, setAccessDenied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, staffList] = await Promise.all([
        base44.functions.invoke("listUsersAdmin", {}),
        base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 2000),
      ]);
      setUsers(usersRes.data.users || []);
      setStaff(staffList);
    } catch (err) {
      if (err?.response?.status === 403 || err?.status === 403) {
        setAccessDenied(true);
      }
    }
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

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
      setInviteMsg({ type: "success", text: `已成功邀請 ${inviteEmail.trim()}` });
      setInviteEmail("");
      setInviteRole("user");
      // Reload after a short delay to allow backend to create the user
      setTimeout(() => loadData(), 2000);
    } catch (err) {
      setInviteMsg({ type: "error", text: err.message || "邀請失敗" });
    }
    setInviting(false);
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

  if (accessDenied) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Users size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm font-semibold text-gray-600">無權限訪問</p>
        <p className="text-xs mt-1">此頁面僅限管理員使用。</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-black text-gray-900">用戶帳戶管理</h2>
          <p className="text-xs text-gray-400">{users.length} 個帳戶 · 可為每個帳戶關聯員工資料</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={14} /> 邀請新用戶
        </button>
      </div>

      {/* Invite User */}
      {showInvite && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-blue-800">📩 邀請新用戶</h3>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-semibold text-gray-600 block mb-1">電郵地址</label>
              <input
                type="email"
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                placeholder="example@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">角色</label>
              <select
                className="border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
              >
                <option value="user">user</option>
                <option value="leader">leader</option>
                <option value="management">management</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              發送邀請
            </button>
          </div>
          {inviteMsg && (
            <div className={`text-xs px-3 py-2 rounded-lg ${inviteMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {inviteMsg.text}
            </div>
          )}
        </div>
      )}

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