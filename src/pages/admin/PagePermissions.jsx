import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { menuGroups } from "@/components/navigation/menuConfig";
import { Search, Shield, User, Users, Save, RotateCcw, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

// Flatten all paths from menuGroups
const ALL_PATHS = menuGroups.flatMap(g =>
  g.items.map(item => ({ path: item.path, label: item.label, group: g.label, groupKey: g.key }))
);

const ROLES = ["user", "admin", "management", "leader"];

export default function PagePermissions() {
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState("role"); // "role" | "user"
  const [rolePermissions, setRolePermissions] = useState([]);
  const [userOverrides, setUserOverrides] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState("user");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});

  // Local edits (unsaved)
  const [localRolePerms, setLocalRolePerms] = useState({}); // { path: true/false }
  const [localUserPerms, setLocalUserPerms] = useState({}); // { path: true/false/null(remove) }

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: rp }, { data: uo }, { data: u }] = await Promise.all([
      supabase.from("page_permissions").select("*"),
      supabase.from("user_page_overrides").select("*"),
      supabase.from("user").select("id, email, full_name, role").order("full_name"),
    ]);
    setRolePermissions(rp || []);
    setUserOverrides(uo || []);
    setUsers(u || []);
    setLoading(false);
  };

  // When selectedRole changes, build local state from DB
  useEffect(() => {
    const perms = {};
    const filtered = rolePermissions.filter(p => p.role === selectedRole);
    filtered.forEach(p => { perms[p.page_path] = p.allowed; });
    setLocalRolePerms(perms);
  }, [selectedRole, rolePermissions]);

  // When selectedUserId changes, build local state
  useEffect(() => {
    const perms = {};
    const filtered = userOverrides.filter(o => o.user_id === selectedUserId);
    filtered.forEach(o => { perms[o.page_path] = o.allowed; });
    setLocalUserPerms(perms);
  }, [selectedUserId, userOverrides]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const s = userSearch.toLowerCase();
    return users.filter(u =>
      (u.full_name || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s)
    );
  }, [users, userSearch]);

  const selectedUser = users.find(u => u.id === selectedUserId);

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Role-based permission save ---
  const saveRolePermissions = async () => {
    setSaving(true);
    try {
      // Delete all existing for this role
      const { error: delError } = await supabase.from("page_permissions").delete().eq("role", selectedRole);
      if (delError) throw delError;

      // Insert new ones
      const rows = Object.entries(localRolePerms)
        .filter(([_, allowed]) => allowed !== undefined && allowed !== null)
        .map(([path, allowed]) => ({
          role: selectedRole,
          page_path: path,
          allowed,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("page_permissions").insert(rows);
        if (error) throw error;
      }

      toast({
        title: "✅ 已儲存",
        description: rows.length > 0
          ? `角色「${selectedRole}」的頁面權限已更新（${rows.length} 項）`
          : `已清空角色「${selectedRole}」的所有頁面權限設定`,
      });
      await fetchAll();
    } catch (e) {
      toast({ title: "❌ 錯誤", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  // --- User override save ---
  const saveUserOverrides = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      // Delete all existing for this user
      const { error: delError } = await supabase.from("user_page_overrides").delete().eq("user_id", selectedUserId);
      if (delError) throw delError;

      // Insert new ones (only paths that have explicit override)
      const rows = Object.entries(localUserPerms)
        .filter(([_, allowed]) => allowed !== undefined && allowed !== null)
        .map(([path, allowed]) => ({
          user_id: selectedUserId,
          user_email: selectedUser?.email || "",
          page_path: path,
          allowed,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("user_page_overrides").insert(rows);
        if (error) throw error;
      }

      toast({
        title: "✅ 已儲存",
        description: rows.length > 0
          ? `用戶「${selectedUser?.full_name || selectedUser?.email}」的權限覆寫已更新（${rows.length} 項）`
          : `已清空用戶「${selectedUser?.full_name || selectedUser?.email}」的所有權限覆寫`,
      });
      await fetchAll();
    } catch (e) {
      toast({ title: "❌ 錯誤", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  // Toggle a single path permission for role
  const toggleRolePath = (path) => {
    setLocalRolePerms(prev => {
      const current = prev[path];
      if (current === true) return { ...prev, [path]: false };
      if (current === false) {
        const copy = { ...prev };
        delete copy[path];
        return copy;
      }
      return { ...prev, [path]: true };
    });
  };

  // Three-state toggle for user override: allowed -> blocked -> not set (inherit)
  const toggleUserPath = (path) => {
    setLocalUserPerms(prev => {
      const current = prev[path];
      if (current === true) return { ...prev, [path]: false };
      if (current === false) {
        const copy = { ...prev };
        delete copy[path];
        return copy;
      }
      return { ...prev, [path]: true };
    });
  };

  // Quick set all in a group
  const setGroupAll = (groupKey, value, isUserMode) => {
    const paths = ALL_PATHS.filter(p => p.groupKey === groupKey).map(p => p.path);
    if (isUserMode) {
      setLocalUserPerms(prev => {
        const copy = { ...prev };
        paths.forEach(p => {
          if (value === null) delete copy[p];
          else copy[p] = value;
        });
        return copy;
      });
    } else {
      setLocalRolePerms(prev => {
        const copy = { ...prev };
        paths.forEach(p => {
          if (value === null) delete copy[p];
          else copy[p] = value;
        });
        return copy;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Only admin/management can access this page
  if (authUser?.role !== "admin" && authUser?.role !== "management") {
    return (
      <div className="text-center py-20 text-gray-500">
        <Shield size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">權限不足</p>
        <p className="text-sm">只有管理員才能設定頁面權限</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="text-red-500" size={24} />
        <h1 className="text-xl font-bold text-gray-800">頁面權限管理</h1>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        設定不同角色或個別用戶可以睇到/進入嘅頁面。用戶級別設定會覆蓋角色設定。
      </p>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("role")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === "role" ? "bg-blue-50 text-blue-700 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={16} /> 按角色設定
        </button>
        <button
          onClick={() => setActiveTab("user")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === "user" ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <User size={16} /> 按用戶設定（覆寫）
        </button>
      </div>

      {/* Role-based tab */}
      {activeTab === "role" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-600">選擇角色：</span>
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedRole === r
                    ? "bg-blue-500 text-white shadow"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            <strong>提示：</strong> 如果某角色冇任何設定，系統會用預設邏輯（admin/management 可見全部，user 只可見基本頁面）。
            一旦為角色設定了任何頁面，只有被勾選嘅頁面先會顯示。
          </div>

          <PermissionGrid
            localPerms={localRolePerms}
            togglePath={toggleRolePath}
            setGroupAll={(gk, val) => setGroupAll(gk, val, false)}
            expandedGroups={expandedGroups}
            toggleGroup={toggleGroup}
            mode="role"
          />

          <div className="flex gap-2 pt-2">
            <button
              onClick={saveRolePermissions}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={14} /> {saving ? "儲存中..." : "儲存角色權限"}
            </button>
            <button
              onClick={() => {
                const perms = {};
                rolePermissions.filter(p => p.role === selectedRole).forEach(p => { perms[p.page_path] = p.allowed; });
                setLocalRolePerms(perms);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
            >
              <RotateCcw size={14} /> 重設
            </button>
          </div>
        </div>
      )}

      {/* User-based tab */}
      {activeTab === "user" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">選擇用戶：</span>
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="搜索用戶名稱或 email..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          {!selectedUserId ? (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 text-left"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800">{u.full_name || u.email}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{u.role || "user"}</span>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400">冇搵到用戶</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg">
                <User size={18} className="text-purple-600" />
                <div>
                  <div className="text-sm font-bold text-purple-800">{selectedUser?.full_name || selectedUser?.email}</div>
                  <div className="text-xs text-purple-500">{selectedUser?.email} · 角色: {selectedUser?.role || "user"}</div>
                </div>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="ml-auto text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  換人
                </button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                <strong>提示：</strong> 用戶級別設定會覆蓋角色設定。三態切換：✅ 允許 → ❌ 封鎖 → ⬜ 繼承角色設定。
              </div>

              <PermissionGrid
                localPerms={localUserPerms}
                togglePath={toggleUserPath}
                setGroupAll={(gk, val) => setGroupAll(gk, val, true)}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                mode="user"
              />

              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveUserOverrides}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  <Save size={14} /> {saving ? "儲存中..." : "儲存用戶覆寫"}
                </button>
                <button
                  onClick={() => {
                    const perms = {};
                    userOverrides.filter(o => o.user_id === selectedUserId).forEach(o => { perms[o.page_path] = o.allowed; });
                    setLocalUserPerms(perms);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                >
                  <RotateCcw size={14} /> 重設
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Permission grid component ---
function PermissionGrid({ localPerms, togglePath, setGroupAll, expandedGroups, toggleGroup, mode }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {menuGroups.map(group => {
        const groupPaths = group.items.map(i => i.path);
        const allAllowed = groupPaths.every(p => localPerms[p] === true);
        const allBlocked = groupPaths.every(p => localPerms[p] === false);
        const expanded = expandedGroups[group.key] !== false; // default expanded
        const configuredCount = groupPaths.filter(p => localPerms[p] !== undefined && localPerms[p] !== null).length;

        return (
          <div key={group.key} className="border-b last:border-b-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleGroup(group.key)}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="text-sm font-bold">{group.icon} {group.label}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {configuredCount}/{groupPaths.length} 已設定
              </span>
              <div className="flex gap-1 ml-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setGroupAll(group.key, true)}
                  className={`px-2 py-0.5 rounded text-xs ${allAllowed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600 hover:bg-green-100"}`}
                  title="全部允許"
                >
                  ✅全開
                </button>
                <button
                  onClick={() => setGroupAll(group.key, false)}
                  className={`px-2 py-0.5 rounded text-xs ${allBlocked ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600 hover:bg-red-100"}`}
                  title="全部封鎖"
                >
                  ❌全關
                </button>
                {mode === "user" && (
                  <button
                    onClick={() => setGroupAll(group.key, null)}
                    className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600 hover:bg-gray-300"
                    title="全部繼承"
                  >
                    ⬜清除
                  </button>
                )}
              </div>
            </div>
            {expanded && (
              <div className="divide-y divide-gray-100">
                {group.items.map(item => {
                  const val = localPerms[item.path];
                  return (
                    <div key={item.path} className="flex items-center justify-between px-6 py-1.5 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-[10px] text-gray-300 font-mono">{item.path}</span>
                      </div>
                      <button
                        onClick={() => togglePath(item.path)}
                        className={`w-20 text-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                          val === true
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : val === false
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-gray-100 text-gray-400 border border-gray-200"
                        }`}
                      >
                        {val === true ? "✅ 允許" : val === false ? "❌ 封鎖" : "⬜ 未設定"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
