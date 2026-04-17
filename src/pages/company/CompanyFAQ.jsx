import { useState, useEffect } from "react";
import { Search, HelpCircle, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp, Star, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import { useRegionalItems } from "@/lib/useRegionalItems";
import RegionBadge from "@/components/RegionBadge";

export default function CompanyFAQ() {
  const { regions } = useRegion();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "management";

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.FAQItem.filter({ is_active: true }, "sort_order", 300);
    setItems(data);
    setLoading(false);
  };

  const regional = useRegionalItems(items);
  const categories = [...new Set(regional.map(i => i.category).filter(Boolean))];
  const filtered = regional.filter(i => {
    const matchSearch = !search || i.question?.includes(search) || i.answer?.includes(search);
    const matchCat = category === "all" || i.category === category;
    return matchSearch && matchCat;
  });
  const featured = filtered.filter(i => i.is_featured);
  const regular = filtered.filter(i => !i.is_featured);

  const handleDelete = async (id) => {
    if (!confirm("確定刪除？")) return;
    await base44.entities.FAQItem.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-black text-gray-900">公司 FAQ</h2>
          <RegionBadge />
        </div>
        {isAdmin && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700">
            <Plus size={16} /> 新增問題
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
            placeholder="搜尋問題..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">全部分類</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-gray-400">
          <HelpCircle size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無 FAQ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {featured.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-1"><Star size={13} className="fill-yellow-400 text-yellow-400" /> 熱門問題</h3>
              <div className="space-y-2">
                {featured.map(f => <FAQRow key={f.id} item={f} expanded={expanded === f.id} onToggle={() => setExpanded(expanded === f.id ? null : f.id)} isAdmin={isAdmin} onEdit={() => { setEditItem(f); setShowForm(true); }} onDelete={() => handleDelete(f.id)} />)}
              </div>
            </div>
          )}
          {regular.length > 0 && (
            <div className="space-y-2">
              {regular.map(f => <FAQRow key={f.id} item={f} expanded={expanded === f.id} onToggle={() => setExpanded(expanded === f.id ? null : f.id)} isAdmin={isAdmin} onEdit={() => { setEditItem(f); setShowForm(true); }} onDelete={() => handleDelete(f.id)} />)}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <FAQEditor item={editItem} regions={regions} onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function FAQRow({ item, expanded, onToggle, isAdmin, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {item.is_featured && <Star size={12} className="fill-yellow-400 text-yellow-400 shrink-0" />}
          <div className="font-semibold text-sm text-gray-900">{item.question}</div>
          {item.category && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full shrink-0">{item.category}</span>}
        </div>
        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.answer}</p>
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((t, i) => <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 rounded">#{t}</span>)}
            </div>
          )}
          {isAdmin && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
              <button onClick={onEdit} className="text-xs text-blue-600 flex items-center gap-1"><Edit2 size={11} /> 編輯</button>
              <button onClick={onDelete} className="text-xs text-red-600 flex items-center gap-1"><Trash2 size={11} /> 刪除</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FAQEditor({ item, regions, onClose, onSaved }) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    question: item?.question || "",
    answer: item?.answer || "",
    category: item?.category || "",
    tags: item?.tags || [],
    is_featured: item?.is_featured || false,
    is_active: item?.is_active !== false,
    region_codes: item?.region_codes || [],
    sort_order: item?.sort_order || 0,
  });
  const [tagInput, setTagInput] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleRegion = (code) => {
    set("region_codes", form.region_codes.includes(code)
      ? form.region_codes.filter(c => c !== code)
      : [...form.region_codes, code]);
  };

  const handleSave = async () => {
    setSaving(true);
    if (isEdit) await base44.entities.FAQItem.update(item.id, form);
    else await base44.entities.FAQItem.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black">{isEdit ? "編輯 FAQ" : "新增 FAQ"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">問題 *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.question} onChange={e => set("question", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">答案 *</label>
            <textarea rows={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.answer} onChange={e => set("answer", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">分類</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={e => set("category", e.target.value)} placeholder="例：人事、IT、財務" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">標籤</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); set("tags", [...form.tags, tagInput.trim()]); setTagInput(""); } }}
                placeholder="輸入標籤，Enter 新增" />
            </div>
            <div className="flex flex-wrap gap-1">
              {form.tags.map((t, i) => (
                <span key={i} className="flex items-center gap-1 bg-gray-100 text-xs px-2 py-1 rounded-full">
                  #{t} <button onClick={() => set("tags", form.tags.filter((_, idx) => idx !== i))}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">適用地區（不選＝全部地區）</label>
            <div className="flex flex-wrap gap-1.5">
              {regions.map(r => (
                <button key={r.code} type="button" onClick={() => toggleRegion(r.code)}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${form.region_codes.includes(r.code) ? "text-white" : "bg-gray-100 text-gray-600"}`}
                  style={form.region_codes.includes(r.code) ? { backgroundColor: r.color || "#14b8a6" } : {}}>
                  {r.icon} {r.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="faq_featured" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} />
            <label htmlFor="faq_featured" className="text-sm">設為熱門問題</label>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.question || !form.answer}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}