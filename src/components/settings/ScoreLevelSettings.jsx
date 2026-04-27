import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

export default function ScoreLevelSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ score: 5, label: "", description: "", sort_order: 0 });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ScoreLevel.list("-score", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.label.trim()) return;
    if (editId) {
      await base44.entities.ScoreLevel.update(editId, { ...form, is_active: true });
    } else {
      await base44.entities.ScoreLevel.create({ ...form, is_active: true });
    }
    setEditId(null);
    setAdding(false);
    setForm({ score: 5, label: "", description: "", sort_order: 0 });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除？")) return;
    await base44.entities.ScoreLevel.delete(id);
    load();
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({ score: item.score, label: item.label, description: item.description || "", sort_order: item.sort_order || 0 });
    setAdding(false);
  };

  const cancel = () => { setEditId(null); setAdding(false); setForm({ score: 5, label: "", description: "", sort_order: 0 }); };

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">管理員工自評分數等級，員工填寫年度評估表時需為每個項目選擇自評分數。</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span className="w-12 text-center">分數</span>
          <span className="w-32 ml-2">標籤</span>
          <span className="flex-1">說明</span>
          <span className="w-20" />
        </div>
        {items.map(item => (
          editId === item.id ? (
            <ScoreEditRow key={item.id} form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
          ) : (
            <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 group transition-colors">
              <span className="w-12 text-center font-bold text-indigo-600 text-lg">{item.score}</span>
              <span className="w-32 font-medium text-sm text-gray-800 ml-2">{item.label}</span>
              <span className="flex-1 text-xs text-gray-500">{item.description || "—"}</span>
              <div className="flex gap-1 w-20 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(item)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-blue-100"><Edit2 size={12} className="text-gray-500" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-red-100"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
          )
        ))}
        {adding ? (
          <ScoreEditRow form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
        ) : (
          <button onClick={() => { setAdding(true); setEditId(null); setForm({ score: items.length > 0 ? 1 : 5, label: "", description: "", sort_order: items.length }); }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-blue-500 hover:bg-blue-50 w-full text-left transition-colors">
            <Plus size={14} /> 新增分數等級
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreEditRow({ form, setForm, onSave, onCancel }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-gray-100">
      <input type="number" className="w-12 border border-blue-300 rounded-lg px-1 py-1.5 text-center text-sm font-bold" value={form.score} onChange={e => setForm(f => ({ ...f, score: parseInt(e.target.value) || 0 }))} min={1} max={10} />
      <input className="w-32 border border-blue-300 rounded-lg px-2 py-1.5 text-sm ml-2" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="標籤 *" autoFocus onKeyDown={e => e.key === "Enter" && onSave()} />
      <input className="flex-1 border border-blue-300 rounded-lg px-2 py-1.5 text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="說明" />
      <button onClick={onSave} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"><Check size={13} /></button>
      <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 shrink-0"><X size={13} /></button>
    </div>
  );
}