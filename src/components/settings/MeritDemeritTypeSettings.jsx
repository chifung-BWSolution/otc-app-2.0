import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";

const CATEGORY_LABELS = { merit: "功", demerit: "過" };
const CATEGORY_COLORS = {
  merit: "bg-green-100 text-green-700",
  demerit: "bg-red-100 text-red-700",
};

function TypeRow({ item, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: item.name,
    category: item.category,
    score_adjustment: item.score_adjustment,
    sort_order: item.sort_order || 0,
    is_active: item.is_active !== false,
  });

  const save = async () => {
    if (!form.name.trim()) return;
    await onSave(item.id, { ...form, score_adjustment: Number(form.score_adjustment) || 0, sort_order: Number(form.sort_order) || 0 });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-gray-100">
        <input className="w-28 border border-blue-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="名稱" autoFocus />
        <select className="border border-blue-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
          <option value="demerit">過</option>
          <option value="merit">功</option>
        </select>
        <input type="number" className="w-20 border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" value={form.score_adjustment} onChange={e => setForm(f => ({ ...f, score_adjustment: e.target.value }))} placeholder="分數" />
        <input type="number" className="w-16 border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="排序" />
        <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
          <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
          啟用
        </label>
        <button onClick={save} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"><Check size={13} /></button>
        <button onClick={() => setEditing(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 shrink-0"><X size={13} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 group transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${item.is_active !== false ? 'bg-green-400' : 'bg-gray-300'}`} />
      <span className="font-medium text-sm text-gray-800 w-24">{item.name}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category]}`}>
        {CATEGORY_LABELS[item.category]}
      </span>
      <span className={`text-sm font-bold w-16 text-center ${item.score_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {item.score_adjustment >= 0 ? '+' : ''}{item.score_adjustment}
      </span>
      <span className="text-xs text-gray-400 w-12 text-center">{item.sort_order}</span>
      <div className="flex-1" />
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => setEditing(true)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-blue-100"><Edit2 size={12} className="text-gray-500" /></button>
        <button onClick={() => { if (confirm('確定刪除？')) onDelete(item.id); }} className="p-1.5 bg-gray-100 rounded-lg hover:bg-red-100"><Trash2 size={12} className="text-red-400" /></button>
      </div>
    </div>
  );
}

function AddRow({ onAdd }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'demerit', score_adjustment: 0, sort_order: 0 });

  const submit = async () => {
    if (!form.name.trim()) return;
    await onAdd({ ...form, score_adjustment: Number(form.score_adjustment) || 0, sort_order: Number(form.sort_order) || 0, is_active: true });
    setForm({ name: '', category: 'demerit', score_adjustment: 0, sort_order: 0 });
    setShow(false);
  };

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-3 text-sm text-blue-500 hover:bg-blue-50 w-full text-left transition-colors">
        <Plus size={14} /> 新增類型
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-t border-gray-100">
      <input className="w-28 border border-green-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="名稱 *" autoFocus onKeyDown={e => e.key === 'Enter' && submit()} />
      <select className="border border-green-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
        <option value="demerit">過</option>
        <option value="merit">功</option>
      </select>
      <input type="number" className="w-20 border border-green-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" value={form.score_adjustment} onChange={e => setForm(f => ({ ...f, score_adjustment: e.target.value }))} placeholder="分數" />
      <input type="number" className="w-16 border border-green-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="排序" />
      <button onClick={submit} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shrink-0"><Check size={13} /></button>
      <button onClick={() => setShow(false)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 shrink-0"><X size={13} /></button>
    </div>
  );
}

export default function MeritDemeritTypeSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.MeritDemeritType.list("sort_order", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (id, values) => {
    await base44.entities.MeritDemeritType.update(id, values);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.MeritDemeritType.delete(id);
    load();
  };

  const handleAdd = async (values) => {
    await base44.entities.MeritDemeritType.create(values);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8 text-gray-400"><Loader2 size={20} className="animate-spin" /></div>;
  }

  const demerits = items.filter(i => i.category === "demerit");
  const merits = items.filter(i => i.category === "merit");

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">設定功過類型及其對應的分數調整。</p>

      {/* Demerits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-100">
          <span className="text-sm font-bold text-red-700">❌ 過（扣分）</span>
        </div>
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 w-24">名稱</span>
          <span className="text-xs font-bold text-gray-400 w-12">分類</span>
          <span className="text-xs font-bold text-gray-400 w-16 text-center">分數</span>
          <span className="text-xs font-bold text-gray-400 w-12 text-center">排序</span>
        </div>
        {demerits.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">暫無資料</div>
        ) : (
          demerits.map(item => <TypeRow key={item.id} item={item} onSave={handleSave} onDelete={handleDelete} />)
        )}
      </div>

      {/* Merits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2.5 bg-green-50 border-b border-green-100">
          <span className="text-sm font-bold text-green-700">✅ 功（加分）</span>
        </div>
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400 w-24">名稱</span>
          <span className="text-xs font-bold text-gray-400 w-12">分類</span>
          <span className="text-xs font-bold text-gray-400 w-16 text-center">分數</span>
          <span className="text-xs font-bold text-gray-400 w-12 text-center">排序</span>
        </div>
        {merits.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">暫無資料</div>
        ) : (
          merits.map(item => <TypeRow key={item.id} item={item} onSave={handleSave} onDelete={handleDelete} />)
        )}
      </div>

      {/* Add new */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <AddRow onAdd={handleAdd} />
      </div>
    </div>
  );
}