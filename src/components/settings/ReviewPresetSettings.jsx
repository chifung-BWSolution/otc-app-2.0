import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

const CATEGORIES = [
  { key: "difficulty", label: "⚡ 遇到的困難", color: "orange" },
  { key: "company_support", label: "🤝 需要公司協助", color: "blue" },
  { key: "goal", label: "🎯 未來一年目標", color: "green" },
  { key: "commitment", label: "💪 願意做的事", color: "purple" },
];

export default function ReviewPresetSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("difficulty");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ label: "", sort_order: 0 });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ReviewPreset.list("sort_order", 500);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => i.category === activeTab && i.is_active !== false);

  const handleSave = async () => {
    if (!form.label.trim()) return;
    if (editId) {
      await base44.entities.ReviewPreset.update(editId, form);
    } else {
      await base44.entities.ReviewPreset.create({ ...form, category: activeTab, is_active: true });
    }
    setEditId(null);
    setAdding(false);
    setForm({ label: "", sort_order: 0 });
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除？")) return;
    await base44.entities.ReviewPreset.delete(id);
    load();
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({ label: item.label, sort_order: item.sort_order || 0 });
    setAdding(false);
  };

  const cancel = () => {
    setEditId(null);
    setAdding(false);
    setForm({ label: "", sort_order: 0 });
  };

  const catInfo = CATEGORIES.find(c => c.key === activeTab);

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">管理年度評估表中「困難」「公司協助」「目標」「願意做的事」的預設選項，員工可一鍵點選。</p>

      {/* Category tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => { setActiveTab(c.key); cancel(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors min-w-[100px] ${
              activeTab === c.key ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {c.label}
            <span className="ml-1 opacity-60">({items.filter(i => i.category === c.key && i.is_active !== false).length})</span>
          </button>
        ))}
      </div>

      {/* Items list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span className="flex-1">{catInfo?.label} 選項</span>
          <span className="w-16 text-center">排序</span>
          <span className="w-20" />
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>
        ) : filtered.length === 0 && !adding ? (
          <div className="text-center py-8 text-gray-400 text-sm">尚無選項，請新增</div>
        ) : (
          filtered.map(item =>
            editId === item.id ? (
              <EditRow key={item.id} form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
            ) : (
              <div key={item.id} className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 group transition-colors">
                <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                <span className="w-16 text-center text-xs text-gray-400">{item.sort_order || 0}</span>
                <div className="flex gap-1 w-20 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(item)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-blue-100">
                    <Edit2 size={12} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-red-100">
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
            )
          )
        )}

        {adding ? (
          <EditRow form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} />
        ) : (
          <button
            onClick={() => { setAdding(true); setEditId(null); setForm({ label: "", sort_order: filtered.length }); }}
            className="flex items-center gap-2 px-4 py-3 text-sm text-blue-500 hover:bg-blue-50 w-full text-left transition-colors"
          >
            <Plus size={14} /> 新增選項
          </button>
        )}
      </div>
    </div>
  );
}

function EditRow({ form, setForm, onSave, onCancel }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-gray-100">
      <input
        className="flex-1 border border-blue-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none"
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        placeholder="選項文字 *"
        autoFocus
        onKeyDown={e => e.key === "Enter" && onSave()}
      />
      <input
        type="number"
        className="w-16 border border-blue-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none"
        value={form.sort_order}
        onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
      />
      <button onClick={onSave} className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0">
        <Check size={13} />
      </button>
      <button onClick={onCancel} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 shrink-0">
        <X size={13} />
      </button>
    </div>
  );
}