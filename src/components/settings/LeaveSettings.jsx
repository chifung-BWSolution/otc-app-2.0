import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Check, X, Edit2, Trash2 } from "lucide-react";

function LeavePeriodSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code: "", display: "", eng_display: "", is_active: true, limited_leave_types: "" });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.LeavePeriod.list("code", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.code.trim() || !form.display.trim()) return;
    if (editId) {
      await base44.entities.LeavePeriod.update(editId, form);
    } else {
      await base44.entities.LeavePeriod.create(form);
    }
    setEditId(null);
    setAdding(false);
    setForm({ code: "", display: "", eng_display: "", is_active: true, limited_leave_types: "" });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此假期區間？")) return;
    await base44.entities.LeavePeriod.delete(id);
    load();
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      code: item.code || "",
      display: item.display || "",
      eng_display: item.eng_display || "",
      is_active: item.is_active !== false,
      limited_leave_types: item.limited_leave_types || "",
    });
    setAdding(false);
  };

  const cancel = () => {
    setEditId(null);
    setAdding(false);
    setForm({ code: "", display: "", eng_display: "", is_active: true, limited_leave_types: "" });
  };

  if (loading) return <div className="text-center py-6 text-gray-400 text-sm">載入中...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-amber-800">📅 假期區間 (Leave Period)</span>
          <p className="text-xs text-amber-600 mt-0.5">設定全日 / 上午 / 下午等時段選項</p>
        </div>
      </div>
      <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider gap-2">
        <span className="w-16">代碼</span>
        <span className="w-28">中文名稱</span>
        <span className="w-28">英文名稱</span>
        <span className="flex-1">限定假別</span>
        <span className="w-16 text-center">狀態</span>
        <span className="w-16" />
      </div>

      {items.map(item =>
        editId === item.id ? (
          <EditPeriodRow key={item.id} form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
        ) : (
          <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 group transition-colors">
            <span className="w-16 text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{item.code}</span>
            <span className={`w-28 text-sm font-medium ${item.is_active !== false ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.display}</span>
            <span className="w-28 text-xs text-gray-500">{item.eng_display || "—"}</span>
            <span className="flex-1 text-xs text-gray-400 truncate">{item.limited_leave_types || "全部"}</span>
            <span className={`w-16 text-center text-xs font-medium ${item.is_active !== false ? 'text-green-600' : 'text-gray-400'}`}>
              {item.is_active !== false ? '啟用' : '停用'}
            </span>
            <div className="flex gap-1 w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(item)} className="p-1 bg-gray-100 rounded-lg hover:bg-blue-100"><Edit2 size={11} className="text-gray-500" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1 bg-gray-100 rounded-lg hover:bg-red-100"><Trash2 size={11} className="text-red-400" /></button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <EditPeriodRow form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
      ) : (
        <button onClick={() => { setAdding(true); setEditId(null); setForm({ code: "", display: "", eng_display: "", is_active: true, limited_leave_types: "" }); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-500 hover:bg-blue-50 w-full text-left transition-colors">
          <Plus size={14} /> 新增假期區間
        </button>
      )}
    </div>
  );
}

function EditPeriodRow({ form, setForm, onSave, onCancel }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-gray-100">
      <input className="w-16 border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-mono" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="代碼 *" autoFocus />
      <input className="w-28 border border-blue-300 rounded-lg px-2 py-1.5 text-sm" value={form.display} onChange={e => setForm(f => ({ ...f, display: e.target.value }))} placeholder="中文名 *" />
      <input className="w-28 border border-blue-300 rounded-lg px-2 py-1.5 text-sm" value={form.eng_display} onChange={e => setForm(f => ({ ...f, eng_display: e.target.value }))} placeholder="英文名" />
      <input className="flex-1 border border-blue-300 rounded-lg px-2 py-1.5 text-xs" value={form.limited_leave_types} onChange={e => setForm(f => ({ ...f, limited_leave_types: e.target.value }))} placeholder="限定假別（留空=全部）" />
      <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
        <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
        啟用
      </label>
      <button onClick={onSave} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"><Check size={13} /></button>
      <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 shrink-0"><X size={13} /></button>
    </div>
  );
}

function LeaveTypeSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", full_label: "", default_entitlement: 0, days_before_apply: 0, is_paid: true, is_active: true });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.LeaveType.list("code", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const savedForm = { ...form };
    if (editId) {
      // Optimistic update: immediately reflect changes in the list
      setItems(prev => prev.map(item => item.id === editId ? { ...item, ...savedForm } : item));
      setEditId(null);
      setAdding(false);
      setForm({ code: "", name: "", full_label: "", default_entitlement: 0, days_before_apply: 0, is_paid: true, is_active: true });
      await base44.entities.LeaveType.update(editId, savedForm);
    } else {
      // For new items, add a temp entry then reload in background
      const tempItem = { ...savedForm, id: `temp-${Date.now()}` };
      setItems(prev => [...prev, tempItem]);
      setAdding(false);
      setForm({ code: "", name: "", full_label: "", default_entitlement: 0, days_before_apply: 0, is_paid: true, is_active: true });
      await base44.entities.LeaveType.create(savedForm);
      // Silently reload to get the real ID
      const data = await base44.entities.LeaveType.list("code", 100);
      setItems(data);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此假別？")) return;
    // Optimistic removal
    setItems(prev => prev.filter(item => item.id !== id));
    await base44.entities.LeaveType.delete(id);
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      code: item.code || "",
      name: item.name || "",
      full_label: item.full_label || "",
      default_entitlement: item.default_entitlement || 0,
      days_before_apply: item.days_before_apply || 0,
      is_paid: item.is_paid !== false,
      is_active: item.is_active !== false,
    });
    setAdding(false);
  };

  const cancel = () => {
    setEditId(null);
    setAdding(false);
    setForm({ code: "", name: "", full_label: "", default_entitlement: 0, days_before_apply: 0, is_paid: true, is_active: true });
  };

  if (loading) return <div className="text-center py-6 text-gray-400 text-sm">載入中...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-teal-800">🌴 假別類型 (Leave Type)</span>
          <p className="text-xs text-teal-600 mt-0.5">設定年假、病假、事假等假別及預設天數</p>
        </div>
      </div>
      <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider gap-2">
        <span className="w-16">代碼</span>
        <span className="w-24">名稱</span>
        <span className="w-40">完整標籤</span>
        <span className="w-16 text-center">天數</span>
        <span className="w-20 text-center">提前申請</span>
        <span className="w-16 text-center">有薪</span>
        <span className="w-16 text-center">狀態</span>
        <span className="w-16" />
      </div>

      {items.map(item =>
        editId === item.id ? (
          <EditTypeRow key={item.id} form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
        ) : (
          <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 group transition-colors">
            <span className="w-16 text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{item.code || "—"}</span>
            <span className={`w-24 text-sm font-medium ${item.is_active !== false ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.name || "—"}</span>
            <span className="w-40 text-xs text-gray-500 truncate">{item.full_label || "—"}</span>
            <span className="w-16 text-center text-sm font-bold text-indigo-600">{item.code === "AL" ? "—" : (item.default_entitlement || 0)}</span>
            <span className="w-20 text-center text-xs text-gray-600">{item.days_before_apply ? `${item.days_before_apply}日前` : "不限"}</span>
            <span className="w-16 text-center">
              {item.is_paid !== false ? (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">有薪</span>
              ) : (
                <span className="text-xs text-orange-600 font-medium bg-orange-50 px-1.5 py-0.5 rounded">無薪</span>
              )}
            </span>
            <span className={`w-16 text-center text-xs font-medium ${item.is_active !== false ? 'text-green-600' : 'text-gray-400'}`}>
              {item.is_active !== false ? '啟用' : '停用'}
            </span>
            <div className="flex gap-1 w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(item)} className="p-1 bg-gray-100 rounded-lg hover:bg-blue-100"><Edit2 size={11} className="text-gray-500" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1 bg-gray-100 rounded-lg hover:bg-red-100"><Trash2 size={11} className="text-red-400" /></button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <EditTypeRow form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
      ) : (
        <button onClick={() => { setAdding(true); setEditId(null); setForm({ code: "", name: "", full_label: "", default_entitlement: 0, days_before_apply: 0, is_paid: true, is_active: true }); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-blue-500 hover:bg-blue-50 w-full text-left transition-colors">
          <Plus size={14} /> 新增假別
        </button>
      )}
    </div>
  );
}

function EditTypeRow({ form, setForm, onSave, onCancel }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-gray-100 flex-wrap">
      <input className="w-16 border border-blue-300 rounded-lg px-2 py-1.5 text-xs font-mono" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="代碼" autoFocus />
      <input className="w-24 border border-blue-300 rounded-lg px-2 py-1.5 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="名稱 *" />
      <input className="w-40 border border-blue-300 rounded-lg px-2 py-1.5 text-sm" value={form.full_label} onChange={e => setForm(f => ({ ...f, full_label: e.target.value }))} placeholder="完整標籤" />
      <div className="relative">
        <input
          type="number"
          className={`w-16 border rounded-lg px-2 py-1.5 text-sm text-center ${form.code?.toUpperCase() === 'AL' ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-blue-300'}`}
          value={form.code?.toUpperCase() === 'AL' ? "" : form.default_entitlement}
          onChange={e => setForm(f => ({ ...f, default_entitlement: parseInt(e.target.value) || 0 }))}
          placeholder={form.code?.toUpperCase() === 'AL' ? "跟員工" : "天數"}
          disabled={form.code?.toUpperCase() === 'AL'}
          title={form.code?.toUpperCase() === 'AL' ? "AL天數跟員工個人設定" : "預設天數"}
        />
      </div>
      <input
        type="number"
        className="w-20 border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center"
        value={form.days_before_apply}
        onChange={e => setForm(f => ({ ...f, days_before_apply: parseInt(e.target.value) || 0 }))}
        placeholder="提前日"
        title="需提前幾日申請（0=不限）"
        min={0}
      />
      <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
        <input type="checkbox" checked={form.is_paid} onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))} className="rounded" />
        有薪
      </label>
      <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
        <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
        啟用
      </label>
      <button onClick={onSave} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"><Check size={13} /></button>
      <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 shrink-0"><X size={13} /></button>
    </div>
  );
}

export default function LeaveSettings() {
  return (
    <div className="space-y-6">
      <LeaveTypeSection />
      <LeavePeriodSection />
      <p className="text-xs text-gray-400">
        💡 假別類型影響員工請假時可選嘅選項及餘額計算；假期區間影響可選嘅時段（如全日/上午/下午）。
      </p>
    </div>
  );
}
