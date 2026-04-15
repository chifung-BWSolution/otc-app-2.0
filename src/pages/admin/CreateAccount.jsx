import { useState, useEffect, useMemo } from "react";
import { UserPlus, CheckCircle, Eye, EyeOff, Lock, ShieldCheck, ArrowLeftRight, Link, Pencil, X, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ROLE_OPTIONS = [
  { value: "user", label: "Staff（一般員工）" },
  { value: "leader", label: "Leader（組長）" },
  { value: "management", label: "Management（管理層）" },
  { value: "admin", label: "Admin（系統管理員）" },
];

const TABS = [
  { key: "create", label: "建立新帳戶", icon: UserPlus },
  { key: "reassign", label: "重新分配帳戶", icon: ArrowLeftRight },
];

// ─── Password Management Modal ───────────────────────────────────────────────
function PasswordModal({ staff, onClose }) {
  const [viewedPwd, setViewedPwd] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleView = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("manageAccountPassword", { action: "view", userEmail: staff.linked_user_email });
    setLoading(false);
    setViewedPwd(res.data?.password_hint || "（未儲存密碼備注）");
  };

  const handleUpdate = async () => {
    if (newPwd.length < 6) return;
    setLoading(true);
    const res = await base44.functions.invoke("manageAccountPassword", { action: "update", userEmail: staff.linked_user_email, newPassword: newPwd });
    setLoading(false);
    if (res.data?.success) {
      setMsg("✅ 密碼備注已更新");
      setEditMode(false);
      setViewedPwd(newPwd);
      setNewPwd("");
    } else {
      setMsg("❌ 更新失敗");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900 flex items-center gap-2"><KeyRound size={16} className="text-blue-500" /> 密碼管理</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
          <div className="font-semibold text-gray-800">{staff.display_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{staff.linked_user_email}</div>
        </div>

        {/* View password */}
        {!editMode && (
          <div className="space-y-3">
            {viewedPwd !== null ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-sm text-gray-800 flex items-center justify-between gap-2">
                <span>{viewedPwd}</span>
              </div>
            ) : (
              <button
                onClick={handleView}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <Eye size={15} /> {loading ? "載入中..." : "查看密碼備注"}
              </button>
            )}
            <button
              onClick={() => { setEditMode(true); setMsg(""); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Pencil size={14} /> 更改密碼備注
            </button>
          </div>
        )}

        {/* Edit password */}
        {editMode && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">新密碼備注 <span className="font-normal text-gray-400">（最少6位）</span></label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-9"
                  placeholder="輸入新密碼..."
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditMode(false); setMsg(""); }} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">取消</button>
              <button onClick={handleUpdate} disabled={newPwd.length < 6 || loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {loading ? "更新中..." : "確認更新"}
              </button>
            </div>
          </div>
        )}

        {msg && <div className="text-sm text-center font-medium text-gray-700">{msg}</div>}
      </div>
    </div>
  );
}

// ─── Link Staff Modal (step 2 after account creation) ────────────────────────
function LinkStaffModal({ createdEmail, unlinkedStaff, onLinked, onSkip }) {
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);

  const handleLink = async () => {
    if (!selectedStaffId) return;
    setLinking(true);
    await base44.functions.invoke("createStaffAccount", { action: "link", loginEmail: createdEmail, staffId: selectedStaffId });
    setLinking(false);
    setLinked(true);
    setTimeout(() => { onLinked(); }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        {linked ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
            <p className="font-bold text-gray-800">連結成功！</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">帳戶建立成功！</h3>
              <p className="text-xs text-blue-600 mt-1 font-medium">{createdEmail}</p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-sm text-gray-700 font-semibold mb-3 flex items-center gap-2">
                <Link size={14} className="text-blue-500" /> 是否立即連結至員工檔案？
              </p>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                value={selectedStaffId}
                onChange={e => setSelectedStaffId(e.target.value)}
              >
                <option value="">— 選擇員工（可選）—</option>
                {unlinkedStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.display_name}{s.team_name ? ` （${s.team_name}）` : ""}</option>
                ))}
              </select>
              {unlinkedStaff.length === 0 && <p className="text-xs text-gray-400 mt-1">目前所有員工均已有帳戶</p>}
            </div>

            <div className="flex gap-2">
              <button onClick={onSkip} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200">稍後再連結</button>
              <button
                onClick={handleLink}
                disabled={!selectedStaffId || linking}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Link size={14} /> {linking ? "連結中..." : "立即連結"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateAccount() {
  const [currentUser, setCurrentUser] = useState(null);
  const [staff, setStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("create");

  // Tab 1 — create
  const [loginEmail, setLoginEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [linkModal, setLinkModal] = useState(null); // email string after creation

  // Tab 2 — reassign
  const [selectedInactiveUser, setSelectedInactiveUser] = useState("");
  const [selectedNewStaff, setSelectedNewStaff] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [reassignSuccess, setReassignSuccess] = useState("");
  const [reassignError, setReassignError] = useState("");

  // Password modal
  const [pwdModalStaff, setPwdModalStaff] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [me, staffData, usersData] = await Promise.all([
      base44.auth.me(),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 500),
      base44.entities.User.list("email", 500),
    ]);
    setCurrentUser(me);
    setStaff(staffData);
    setAllUsers(usersData);
    setLoading(false);
  };

  const unlinkedStaff = useMemo(() => staff.filter(s => !s.linked_user_email), [staff]);
  const linkedStaff = useMemo(() => staff.filter(s => s.linked_user_email), [staff]);
  const inactiveUsers = useMemo(() => allUsers.filter(u => u.account_status === "Inactive"), [allUsers]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail);
  const canCreate = emailValid && tempPassword.length >= 6 && !submitting;

  const handleCreate = async () => {
    if (!canCreate) return;
    setSubmitting(true); setErrorMsg("");
    const result = await base44.functions.invoke("createStaffAccount", { action: "create", loginEmail, tempPassword, role });
    setSubmitting(false);
    if (result.data?.success) {
      setLinkModal(loginEmail);
      setLoginEmail(""); setTempPassword(""); setRole("user");
    } else {
      setErrorMsg(result.data?.error || "建立失敗，請重試。");
    }
  };

  const canReassign = selectedInactiveUser && selectedNewStaff && newPassword.length >= 6 && !reassigning;

  const handleReassign = async () => {
    if (!canReassign) return;
    setReassigning(true); setReassignError(""); setReassignSuccess("");
    const result = await base44.functions.invoke("reassignStaffAccount", { userEmail: selectedInactiveUser, newStaffId: selectedNewStaff, newPassword });
    setReassigning(false);
    if (result.data?.success) {
      setReassignSuccess(`✅ 帳戶已成功重新分配：${selectedInactiveUser}`);
      setSelectedInactiveUser(""); setSelectedNewStaff(""); setNewPassword("");
      loadData();
    } else {
      setReassignError(result.data?.error || "重新分配失敗，請重試。");
    }
  };

  if (!currentUser) return null;

  if (currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-60">
        <div className="text-center">
          <ShieldCheck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">此頁面僅供 Admin 使用</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Modals */}
      {linkModal && (
        <LinkStaffModal
          createdEmail={linkModal}
          unlinkedStaff={unlinkedStaff}
          onLinked={() => { setLinkModal(null); loadData(); }}
          onSkip={() => { setLinkModal(null); loadData(); }}
        />
      )}
      {pwdModalStaff && (
        <PasswordModal staff={pwdModalStaff} onClose={() => setPwdModalStaff(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <UserPlus size={22} className="text-blue-600" /> 建立帳戶
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">管理員工系統登入帳戶</p>
        </div>
        <div className="flex gap-3 text-center">
          <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-2">
            <div className="text-xl font-bold text-orange-600">{unlinkedStaff.length}</div>
            <div className="text-xs text-gray-500">待建立帳戶</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <div className="text-xl font-bold text-green-600">{linkedStaff.length}</div>
            <div className="text-xs text-gray-500">已連結帳戶</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <div className="text-xl font-bold text-gray-500">{inactiveUsers.length}</div>
            <div className="text-xs text-gray-500">閒置帳戶</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===== TAB 1: Create New Account ===== */}
      {activeTab === "create" && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 max-w-md space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Step 1 — 建立登入帳戶</h3>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">登入電郵 (Gmail) *</label>
              <input
                type="email"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${loginEmail && !emailValid ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                placeholder="example@gmail.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
              />
              {loginEmail && !emailValid && <p className="text-xs text-red-500 mt-1">請輸入有效的電郵地址</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                <Lock size={11} className="inline mr-1" />臨時密碼 * <span className="font-normal text-gray-400">（最少6位）</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 pr-9"
                  placeholder="手動輸入臨時密碼..."
                  value={tempPassword}
                  onChange={e => setTempPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                <ShieldCheck size={11} className="inline mr-1" />系統角色 *
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                value={role}
                onChange={e => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {errorMsg && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">❌ {errorMsg}</div>}

            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={16} />
              {submitting ? "建立中..." : "建立帳戶"}
            </button>
          </div>

          {/* Linked staff table with password management */}
          {linkedStaff.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                <CheckCircle size={15} className="text-green-500" /> 已連結帳戶員工 ({linkedStaff.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-semibold">員工</th>
                      <th className="text-left px-3 py-2 font-semibold">Team</th>
                      <th className="text-left px-3 py-2 font-semibold">登入電郵</th>
                      <th className="text-left px-3 py-2 font-semibold">密碼管理</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedStaff.map(s => (
                      <tr key={s.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(s.display_name || "?")[0]}
                            </div>
                            <span className="font-semibold text-gray-800">{s.display_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{s.team_name || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ {s.linked_user_email}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => setPwdModalStaff(s)}
                            className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                          >
                            <KeyRound size={12} /> 密碼管理
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== TAB 2: Reassign Account ===== */}
      {activeTab === "reassign" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <ArrowLeftRight size={15} className="text-purple-500" /> 重新分配閒置帳戶
            </h3>
            <p className="text-xs text-gray-400">將離職員工釋出的公司郵箱帳戶，重新分配給新入職同事使用。</p>

            {inactiveUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ArrowLeftRight size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">暫無閒置帳戶</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">選擇閒置帳戶 *</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                    value={selectedInactiveUser}
                    onChange={e => { setSelectedInactiveUser(e.target.value); setReassignSuccess(""); setReassignError(""); }}
                  >
                    <option value="">— 請選擇閒置帳戶 —</option>
                    {inactiveUsers.map(u => <option key={u.id} value={u.email}>{u.email}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">分配給新同事 *</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                    value={selectedNewStaff}
                    onChange={e => setSelectedNewStaff(e.target.value)}
                  >
                    <option value="">— 請選擇員工 —</option>
                    {unlinkedStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.display_name}{s.team_name ? ` （${s.team_name}）` : ""}</option>
                    ))}
                  </select>
                  {unlinkedStaff.length === 0 && <p className="text-xs text-gray-400 mt-1">所有在職員工均已有帳戶</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    <Lock size={11} className="inline mr-1" />新密碼 * <span className="font-normal text-gray-400">（最少6位）</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 pr-9"
                      placeholder="手動輸入新密碼..."
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {reassignSuccess && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 font-medium">{reassignSuccess}</div>}
                {reassignError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">❌ {reassignError}</div>}

                <button
                  onClick={handleReassign}
                  disabled={!canReassign}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeftRight size={16} />
                  {reassigning ? "分配中..." : "重新分配帳戶"}
                </button>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-bold text-gray-800 text-sm mb-3">閒置帳戶列表 ({inactiveUsers.length})</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>
            ) : inactiveUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={28} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm">暫無閒置帳戶</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inactiveUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold shrink-0">
                      {(u.email || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 truncate">{u.email}</div>
                      <div className="text-xs text-gray-400">{u.role || "—"}</div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">閒置</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}