import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import WorkScheduleSettings from "@/components/settings/WorkScheduleSettings";
import TeamGroupSettings from "@/components/settings/TeamGroupSettings";
import ContributionTypeSettings from "@/components/settings/ContributionTypeSettings";
import ScoreLevelSettings from "@/components/settings/ScoreLevelSettings";
import ReviewPresetSettings from "@/components/settings/ReviewPresetSettings";
import MeritDemeritTypeSettings from "@/components/settings/MeritDemeritTypeSettings";

const TABS = [
  { key: "bu", label: "BU", entity: "NOSBU" },
  { key: "team", label: "Team", entity: "NOSTeam" },
  { key: "role", label: "Team Role", entity: "NOSTeamRole" },
  { key: "schedule", label: "⏰ 上班時間", entity: null },
  { key: "teamgroup", label: "👥 Team 分組", entity: null },
  { key: "contribution", label: "📝 貢獻類型", entity: null },
  { key: "scorelevel", label: "⭐ 自評分數", entity: null },
  { key: "reviewpreset", label: "📋 評估選項", entity: null },
  { key: "meritdemerit", label: "⚖️ 功過類型", entity: null },
];

function ItemRow({ item, onSave, onDelete, buList }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ display: item.display, bu_id: item.bu_id || '', description: item.description || '', is_active: item.is_active !== false });

  const save = async () => {
    // Resolve bu_name from bu_id
    const buName = buList.find(b => b.id === form.bu_id)?.display || '';
    await onSave(item.id, { ...form, bu_name: buName });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-gray-100">
        <input
          className="flex-1 border border-blue-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          value={form.display}
          onChange={e => setForm(f => ({ ...f, display: e.target.value }))}
          placeholder="名稱"
          autoFocus
        />
        {buList.length > 0 && (
          <select
            className="border border-blue-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
            value={form.bu_id}
            onChange={e => setForm(f => ({ ...f, bu_id: e.target.value }))}
          >
            <option value="">無 BU</option>
            {buList.map(b => <option key={b.id} value={b.id}>{b.display}</option>)}
          </select>
        )}
        <input
          className="flex-1 border border-blue-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="描述（選填）"
        />
        <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
          啟用
        </label>
        <button onClick={save} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shrink-0">
          <Check size={13} />
        </button>
        <button onClick={() => setEditing(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors shrink-0">
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 group transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${item.is_active !== false ? 'bg-green-400' : 'bg-gray-300'}`} />
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm text-gray-800">{item.display}</span>
        {item.bu_name && <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{item.bu_name}</span>}
        {item.description && <span className="ml-2 text-xs text-gray-400">{item.description}</span>}
      </div>
      {item.bubble_id && <span className="text-xs text-gray-300 font-mono truncate max-w-24 shrink-0">Bubble</span>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors">
          <Edit2 size={12} className="text-gray-500" />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-red-100 transition-colors">
          <Trash2 size={12} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}

function AddRow({ onAdd, buList }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ display: '', bu_id: '', description: '' });

  const submit = async () => {
    if (!form.display.trim()) return;
    const buName = buList.find(b => b.id === form.bu_id)?.display || '';
    await onAdd({ ...form, bu_name: buName, is_active: true });
    setForm({ display: '', bu_id: '', description: '' });
    setShow(false);
  };

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-3 text-sm text-blue-500 hover:bg-blue-50 w-full text-left transition-colors">
        <Plus size={14} /> 新增
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-t border-gray-100">
      <input
        className="flex-1 border border-green-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
        value={form.display}
        onChange={e => setForm(f => ({ ...f, display: e.target.value }))}
        placeholder="名稱 *"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      {buList.length > 0 && (
        <select
          className="border border-green-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
          value={form.bu_id}
          onChange={e => setForm(f => ({ ...f, bu_id: e.target.value }))}
        >
          <option value="">無 BU</option>
          {buList.map(b => <option key={b.id} value={b.id}>{b.display}</option>)}
        </select>
      )}
      <input
        className="flex-1 border border-green-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        placeholder="描述（選填）"
      />
      <button onClick={submit} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shrink-0">
        <Check size={13} />
      </button>
      <button onClick={() => setShow(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}

export default function OrgSettings() {
  const [tab, setTab] = useState("bu");
  const [data, setData] = useState({ NOSBU: [], NOSTeam: [], NOSTeamRole: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const currentTab = TABS.find(t => t.key === tab);

  const load = async () => {
    setLoading(true);
    const [buData, teamData, roleData] = await Promise.all([
      base44.entities.NOSBU.list('display', 200),
      base44.entities.NOSTeam.list('display', 200),
      base44.entities.NOSTeamRole.list('display', 200),
    ]);
    setData({ NOSBU: buData, NOSTeam: teamData, NOSTeamRole: roleData });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (id, values) => {
    await base44.entities[currentTab.entity].update(id, values);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('確定刪除？')) return;
    await base44.entities[currentTab.entity].delete(id);
    load();
  };

  const handleAdd = async (values) => {
    await base44.entities[currentTab.entity].create(values);
    load();
  };

  const handleSync = async () => {
    setSyncing(true);
    await base44.functions.invoke('syncLookupTables', {});
    await load();
    setSyncing(false);
  };

  const items = data[currentTab.entity] || [];
  const buList = tab === 'team' ? data.NOSBU : [];

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">組織架構設定</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-60 transition-colors"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? '同步中...' : '從 Bubble 同步'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
            {t.entity && <span className="ml-1.5 text-xs opacity-60">({data[t.entity]?.length || 0})</span>}
          </button>
        ))}
      </div>

      {/* Special tabs */}
      {tab === "schedule" ? (
        <WorkScheduleSettings />
      ) : tab === "teamgroup" ? (
        <TeamGroupSettings />
      ) : tab === "contribution" ? (
        <ContributionTypeSettings />
      ) : tab === "scorelevel" ? (
        <ScoreLevelSettings />
      ) : tab === "reviewpreset" ? (
        <ReviewPresetSettings />
      ) : tab === "meritdemerit" ? (
        <MeritDemeritTypeSettings />
      ) : (
        <>
          {/* List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex-1">名稱</span>
              {tab === 'team' && <span className="text-xs font-bold text-gray-500 uppercase tracking-wider w-24">BU</span>}
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex-1">描述</span>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">尚無資料，請新增或從 Bubble 同步</div>
            ) : (
              items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  buList={buList}
                />
              ))
            )}
            <AddRow onAdd={handleAdd} buList={buList} />
          </div>

          <p className="text-xs text-gray-400">
            💡 由 Bubble 同步嚟嘅資料會有 "Bubble" 標記。手動新增嘅資料只喺本系統生效。
          </p>
        </>
      )}
    </div>
  );
}