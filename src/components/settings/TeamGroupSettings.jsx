import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, RefreshCw, Tag, Plus, X } from "lucide-react";

export default function TeamGroupSettings() {
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState(["Front", "Back"]);
  const [newGroup, setNewGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.NOSTeam.filter({ is_active: true }, "display", 200);
    setTeams(list);
    // Derive existing groups from data
    const existing = [...new Set(list.map(t => t.team_group).filter(Boolean))];
    const merged = [...new Set([...groups, ...existing])];
    setGroups(merged);
    setLoading(false);
  };

  const handleGroupChange = async (team, value) => {
    setSaving(team.id);
    await base44.entities.NOSTeam.update(team.id, { team_group: value || null });
    setTeams(prev => prev.map(t => t.id === team.id ? { ...t, team_group: value || null } : t));
    setSaving(null);
  };

  const addGroup = () => {
    const trimmed = newGroup.trim();
    if (trimmed && !groups.includes(trimmed)) {
      setGroups(prev => [...prev, trimmed]);
    }
    setNewGroup("");
  };

  const removeGroup = (g) => {
    // Only remove if no team is using it
    const inUse = teams.some(t => t.team_group === g);
    if (inUse) {
      alert(`「${g}」仍有 Team 使用中，請先清除相關 Team 的分組`);
      return;
    }
    setGroups(prev => prev.filter(x => x !== g));
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await base44.functions.invoke("populateStaffTeamGroup", {});
    setSyncResult(res.data);
    setSyncing(false);
  };

  // Group teams by BU for display
  const buMap = {};
  for (const t of teams) {
    const bu = t.bu_name || "未分類";
    if (!buMap[bu]) buMap[bu] = [];
    buMap[bu].push(t);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-500">
        為每個 Team 指定所屬分組（例如 Front / Back / Support），然後同步到全部員工。
      </div>

      {/* Group management */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
          <Tag size={14} /> 分組類別管理
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {groups.map(g => (
            <span key={g} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200">
              {g}
              <button onClick={() => removeGroup(g)} className="hover:text-red-500 ml-0.5">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="新增分組名稱..."
            value={newGroup}
            onChange={e => setNewGroup(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addGroup()}
          />
          <button onClick={addGroup} disabled={!newGroup.trim()}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <Plus size={12} /> 新增
          </button>
        </div>
      </div>

      {/* Team assignment */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-sm font-bold text-gray-700">Team 分組設定</div>
          <div className="text-xs text-gray-400 mt-0.5">為每個 Team 選擇所屬分組</div>
        </div>
        {Object.entries(buMap).sort(([a], [b]) => a.localeCompare(b)).map(([bu, buTeams]) => (
          <div key={bu}>
            <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100">
              <span className="text-xs font-bold text-purple-600">{bu}</span>
            </div>
            {buTeams.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-800 font-medium flex-1">{t.display}</span>
                <select
                  className={`border rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none transition-colors ${
                    t.team_group ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-400"
                  }`}
                  value={t.team_group || ""}
                  onChange={e => handleGroupChange(t, e.target.value)}
                  disabled={saving === t.id}
                >
                  <option value="">未指定</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                {saving === t.id && <Loader2 size={12} className="animate-spin text-gray-400" />}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sync to staff */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-indigo-800">🔄 同步 Team 分組到員工</div>
          <div className="text-xs text-indigo-600 mt-0.5">根據每位員工所屬 Team 自動填寫 team_group 欄位</div>
          {syncResult && (
            <div className="text-xs text-indigo-700 mt-1 font-medium">
              ✅ 完成：共 {syncResult.total} 人，已更新 {syncResult.updated} 人，跳過 {syncResult.skipped} 人
            </div>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {syncing ? "同步中..." : "立即同步"}
        </button>
      </div>
    </div>
  );
}