import { useState, useEffect } from "react";
import { FileText, Download, Search, Plus, X, Edit2, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import { useRegionalItems } from "@/lib/useRegionalItems";
import RegionBadge from "@/components/RegionBadge";

export default function CompanyForms() {
  const { currentRegion, regions } = useRegion();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
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
    const data = await base44.entities.CompanyForm.filter({ is_active: true }, "sort_order", 200);
    setItems(data);
    setLoading(false);
  };

  const regionalItems = useRegionalItems(items);
  const categories = [...new Set(regionalItems.map(i => i.category).filter(Boolean))];
  const filtered = regionalItems.filter(i => {
    const matchSearch = !search || i.title?.includes(search) || i.description?.includes(search);
    const matchCat = category === "all" || i.category === category;
    return matchSearch && matchCat;
  });

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此表格？")) return;
    await base44.entities.CompanyForm.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-black text-gray-900">表格下載</h2>
          <RegionBadge />
        </div>
        {isAdmin && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700">
            <Plus size={16} /> 新增表格
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
            placeholder="搜尋表格..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="all">全部分類</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-gray-400">
          <FileText size={40} className="mx-auto mb-2 opacity-30" />
          <p>{currentRegion?.name || "目前地區"}暫無可下載表格</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{f.icon || "📄"}</span>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditItem(f); setShowForm(true); }}
                      className="p-1 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(f.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-900">{f.title}</h3>
              {f.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{f.description}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {f.category && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{f.category}</span>}
                {f.file_size && <span className="text-xs text-gray-400">{f.file_size}</span>}
              </div>
              {f.file_url && (
                <a href={f.file_url} target="_blank" rel="noreferrer" download
                  className="mt-3 flex items-center justify-center gap-1.5 w-full bg-teal-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-teal-600">
                  <Download size={13} /> 下載
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FormEditor item={editItem} regions={regions} onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function FormEditor({ item, regions, onClose, onSaved }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    category: item?.category || "",
    file_url: item?.file_url || "",
    file_size: item?.file_size || "",
    icon: item?.icon || "📄",
    is_active: item?.is_active !== false,
    sort_order: item?.sort_order || 0,
    region_codes: item?.region_codes || [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("file_url", file_url);
    set("file_size", `${(file.size / 1024).toFixed(0)} KB`);
    setUploading(false);
  };

  const toggleRegion = (code) => {
    set("region_codes", form.region_codes.includes(code)
      ? form.region_codes.filter(c => c !== code)
      : [...form.region_codes, code]);
  };

  const handleSave = async () => {
    setSaving(true);
    if (isEdit) await base44.entities.CompanyForm.update(item.id, form);
    else await base44.entities.CompanyForm.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black">{isEdit ? "編輯表格" : "新增表格"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">圖標</label>
              <input className="w-full border border-gray-200 rounded-lg px-2 py-2 text-center text-xl"
                value={form.icon} onChange={e => set("icon", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">名稱 *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.title} onChange={e => set("title", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">描述</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">分類</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.category} onChange={e => set("category", e.target.value)} placeholder="如：人事、財務、IT" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">適用地區（不選＝全部地區）</label>
            <div className="flex flex-wrap gap-1.5">
              {regions.map(r => (
                <button key={r.code} type="button" onClick={() => toggleRegion(r.code)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                    form.region_codes.includes(r.code) ? "text-white" : "bg-gray-100 text-gray-600"
                  }`}
                  style={form.region_codes.includes(r.code) ? { backgroundColor: r.color || "#14b8a6" } : {}}>
                  {r.icon} {r.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">檔案</label>
            {form.file_url ? (
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <FileText size={14} className="text-teal-500" />
                <a href={form.file_url} target="_blank" rel="noreferrer" className="text-xs text-teal-600 truncate flex-1">{form.file_url}</a>
                <button onClick={() => set("file_url", "")}><X size={12} /></button>
              </div>
            ) : (
              <label className="block w-full border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500 cursor-pointer hover:border-teal-300">
                {uploading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "點擊上傳檔案"}
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            )}
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}