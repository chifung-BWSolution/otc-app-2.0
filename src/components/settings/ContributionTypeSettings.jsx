import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";

export default function ContributionTypeSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "🔧", sort_order: 0 });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ContributionType.list("sort_order", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editId) {
      await base44.entities.ContributionType.update(editId, { ...form, is_active: true });
    } else {
      await base44.entities.ContributionType.create({ ...form, is_active: true });
    }
    setEditId(null);
    setAdding(false);
    setForm({ name: "", description: "", icon: "🔧", sort_order: 0 });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除？")) return;
    await base44.entities.ContributionType.delete(id);
    load();
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, description: item.description || "", icon: item.icon || "🔧", sort_order: item.sort_order || 0 });
    setAdding(false);
  };

  const cancel = () => { setEditId(null); setAdding(false); setForm({ name: "", description: "", icon: "🔧", sort_order: 0 }); };

  if (loading) return <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">管理「貢獻重點」的類型選項，員工填寫年度評估表時需先選擇類型再填寫內容。</p>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span className="w-10">圖標</span>
          <span className="flex-1 ml-2">名稱</span>
          <span className="flex-1">說明</span>
          <span className="w-16 text-center">排序</span>
          <span className="w-20" />
        </div>
        {items.map(item => (
          editId === item.id ? (
            <EditRow key={item.id} form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
          ) : (
            <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 group transition-colors">
              <span className="w-10 text-lg">{item.icon || "🔧"}</span>
              <span className="flex-1 font-medium text-sm text-gray-800 ml-2">{item.name}</span>
              <span className="flex-1 text-xs text-gray-400">{item.description || "—"}</span>
              <span className="w-16 text-center text-xs text-gray-400">{item.sort_order || 0}</span>
              <div className="flex gap-1 w-20 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(item)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-blue-100"><Edit2 size={12} className="text-gray-500" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-red-100"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
          )
        ))}
        {adding ? (
          <EditRow form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
        ) : (
          <button onClick={() => { setAdding(true); setEditId(null); setForm({ name: "", description: "", icon: "🔧", sort_order: items.length }); }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-blue-500 hover:bg-blue-50 w-full text-left transition-colors">
            <Plus size={14} /> 新增貢獻類型
          </button>
        )}
      </div>
    </div>
  );
}

function EditRow({ form, setForm, onSave, onCancel }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-gray-100">
      <input className="w-10 border border-blue-300 rounded-lg px-1 py-1.5 text-center text-sm" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔧" />
      <input className="flex-1 border border-blue-300 rounded-lg px-2 py-1.5 text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="名稱 *" autoFocus onKeyDown={e => e.key === "Enter" && onSave()} />
      <input className="flex-1 border border-blue-300 rounded-lg px-2 py-1.5 text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="說明" />
      <input type="number" className="w-16 border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
      <button onClick={onSave} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"><Check size={13} /></button>
      <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 shrink-0"><X size={13} /></button>
    </div>
  );
}