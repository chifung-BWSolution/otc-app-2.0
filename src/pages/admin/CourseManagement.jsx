import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Tag, BookOpen, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TABS = [
  { key: "categories", label: "課程分類", icon: Tag },
  { key: "courses", label: "課程管理", icon: BookOpen },
];

const DEFAULT_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

export default function CourseManagement() {
  const [tab, setTab] = useState("categories");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-gray-900">課程管理</h2>
        <p className="text-sm text-gray-500 mt-1">管理課程分類、課程及學習資源</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                tab === t.key ? "bg-white shadow text-blue-600" : "text-gray-500"
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "categories" && <CategoriesTab />}
      {tab === "courses" && <CoursesTab />}
    </div>
  );
}

/* ---------------- Categories ---------------- */

function CategoriesTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.CourseCategory.list("sort_order", 100);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此分類？")) return;
    await base44.entities.CourseCategory.delete(id);
    load();
  };

  return (
    <div className="space-y-3">
      <button onClick={() => { setEditItem(null); setShowForm(true); }}
        className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
        <Plus size={16} /> 新增分類
      </button>

      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
          <Tag size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無課程分類，請新增</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 w-12"></th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">分類名稱</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">描述</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">服務單位</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 w-20">排序</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 w-20">狀態</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 w-24">動作</th>
              </tr>
            </thead>
            <tbody>
              {items.map(cat => (
                <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50"
                  style={{ borderLeft: `4px solid ${cat.color || "#6366f1"}` }}>
                  <td className="px-4 py-3 text-2xl">{cat.icon || "📚"}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{cat.name}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{cat.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(cat.service_units || []).slice(0, 4).map((u, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{u}</span>
                      ))}
                      {(cat.service_units || []).length > 4 && (
                        <span className="text-xs text-gray-400">+{cat.service_units.length - 4}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">{cat.sort_order ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    {cat.is_active ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">啟用</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">停用</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditItem(cat); setShowForm(true); }}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(cat.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CategoryFormModal item={editItem} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function CategoryFormModal({ item, onClose, onSaved }) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    service_units: item?.service_units || [],
    icon: item?.icon || "📚",
    color: item?.color || DEFAULT_COLORS[0],
    sort_order: item?.sort_order || 0,
    is_active: item?.is_active !== false,
  });
  const [unitInput, setUnitInput] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addUnit = () => {
    if (!unitInput.trim()) return;
    set("service_units", [...form.service_units, unitInput.trim()]);
    setUnitInput("");
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    if (isEdit) await base44.entities.CourseCategory.update(item.id, form);
    else await base44.entities.CourseCategory.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black">{isEdit ? "編輯分類" : "新增分類"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">分類名稱 *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={e => set("name", e.target.value)} placeholder="例：銷售技巧" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">分類描述</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">服務單位</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={unitInput} onChange={e => setUnitInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUnit())} placeholder="輸入服務單位名稱，按 Enter 新增" />
              <button onClick={addUnit} className="px-3 bg-blue-500 text-white rounded-lg text-sm font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.service_units.map((u, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  {u}
                  <button onClick={() => set("service_units", form.service_units.filter((_, idx) => idx !== i))}><X size={11} /></button>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">圖標 (Emoji)</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.icon} onChange={e => set("icon", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">排序</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.sort_order} onChange={e => set("sort_order", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">顏色</label>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map(c => (
                <button key={c} onClick={() => set("color", c)}
                  className={`w-8 h-8 rounded-lg transition-transform ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
            <label htmlFor="active" className="text-sm text-gray-700">啟用此分類</label>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.name}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Courses ---------------- */

function CoursesTab() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  const load = async () => {
    setLoading(true);
    const [courses, cats] = await Promise.all([
      base44.entities.Course.list("-created_date", 200),
      base44.entities.CourseCategory.filter({ is_active: true }, "sort_order", 100),
    ]);
    setItems(courses);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此課程？")) return;
    await base44.entities.Course.delete(id);
    load();
  };

  const filtered = filterCat ? items.filter(c => c.category_id === filterCat) : items;
  const diffColor = ["", "bg-green-100 text-green-700", "bg-lime-100 text-lime-700", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
          <Plus size={16} /> 新增課程
        </button>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">全部分類</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無課程</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">課程名稱</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">分類</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">服務單位</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">難度</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">狀態</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">動作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{c.title}</div>
                    {c.code && <div className="text-xs text-gray-400">{c.code}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.category_name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(c.service_units || []).slice(0, 3).map((u, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{u}</span>
                      ))}
                      {(c.service_units || []).length > 3 && <span className="text-xs text-gray-400">+{c.service_units.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[c.difficulty] || "bg-gray-100 text-gray-600"}`}>
                      Level {c.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      c.status === "已發佈" ? "bg-green-100 text-green-700" :
                      c.status === "草稿" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-600"
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 flex items-center justify-center gap-1">
                    <button onClick={() => { setEditItem(c); setShowForm(true); }}
                      className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(c.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CourseFormModal item={editItem} categories={categories}
          onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function CourseFormModal({ item, categories, onClose, onSaved }) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: item?.title || "",
    code: item?.code || "",
    category_id: item?.category_id || (categories[0]?.id || ""),
    category_name: item?.category_name || (categories[0]?.name || ""),
    service_units: item?.service_units || [],
    description: item?.description || "",
    cover_image: item?.cover_image || "",
    difficulty: item?.difficulty || 1,
    duration_hours: item?.duration_hours || 1,
    learning_method: item?.learning_method || "自學",
    objectives: item?.objectives || [],
    prerequisites: item?.prerequisites || "",
    target_audience: item?.target_audience || "",
    instructors: item?.instructors || [],
    has_assessment: item?.has_assessment || false,
    passing_score: item?.passing_score || 60,
    status: item?.status || "草稿",
    tags: item?.tags || [],
  });
  const [objInput, setObjInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const selectedCategory = categories.find(c => c.id === form.category_id);
  const availableServiceUnits = selectedCategory?.service_units || [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setCategory = (catId) => {
    const cat = categories.find(c => c.id === catId);
    setForm(f => ({ ...f, category_id: catId, category_name: cat?.name || "", service_units: [] }));
  };

  const toggleServiceUnit = (unit) => {
    const exists = form.service_units.includes(unit);
    set("service_units", exists ? form.service_units.filter(u => u !== unit) : [...form.service_units, unit]);
  };

  const handleSave = async () => {
    if (!form.title || !form.category_id) return;
    setSaving(true);
    const me = await base44.auth.me();
    const payload = { ...form, created_by_name: form.created_by_name || me.full_name || me.email };
    if (isEdit) await base44.entities.Course.update(item.id, payload);
    else await base44.entities.Course.create(payload);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black">{isEdit ? "編輯課程" : "新增課程"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">課程名稱 *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">課程編號</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.code} onChange={e => set("code", e.target.value)} placeholder="例：SAL-001" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">課程分類 *</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={form.category_id} onChange={e => setCategory(e.target.value)}>
              <option value="">請選擇分類</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {availableServiceUnits.length > 0 && (
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">服務單位（可多選）*</label>
              <div className="flex flex-wrap gap-1.5">
                {availableServiceUnits.map(u => {
                  const active = form.service_units.includes(u);
                  return (
                    <button key={u} onClick={() => toggleServiceUnit(u)} type="button"
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                        active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">課程簡介</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">難度 Level *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.difficulty} onChange={e => set("difficulty", Number(e.target.value))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>Level {n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">學習時間(小時)</label>
              <input type="number" step="0.5" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.duration_hours} onChange={e => set("duration_hours", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">學習方式</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.learning_method} onChange={e => set("learning_method", e.target.value)}>
                {["自學", "課堂", "混合"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">目標對象</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.target_audience} onChange={e => set("target_audience", e.target.value)} placeholder="例：銷售團隊" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">先修條件</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.prerequisites} onChange={e => set("prerequisites", e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">學習目標</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={objInput} onChange={e => setObjInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && objInput.trim()) { e.preventDefault(); set("objectives", [...form.objectives, objInput.trim()]); setObjInput(""); } }} placeholder="輸入學習目標，按 Enter 新增" />
            </div>
            <div className="space-y-1">
              {form.objectives.map((o, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-sm">
                  <span className="flex-1">• {o}</span>
                  <button onClick={() => set("objectives", form.objectives.filter((_, idx) => idx !== i))}><X size={12} className="text-gray-400" /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">標籤</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); set("tags", [...form.tags, tagInput.trim()]); setTagInput(""); } }} placeholder="輸入標籤，按 Enter 新增" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t, i) => (
                <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  #{t}
                  <button onClick={() => set("tags", form.tags.filter((_, idx) => idx !== i))}><X size={11} /></button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 items-end">
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="has_assessment" checked={form.has_assessment} onChange={e => set("has_assessment", e.target.checked)} />
              <label htmlFor="has_assessment" className="text-sm">包含考核</label>
            </div>
            {form.has_assessment && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">合格分數</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.passing_score} onChange={e => set("passing_score", Number(e.target.value))} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">狀態</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
                {["草稿", "已發佈", "已下架"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.title || !form.category_id}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}