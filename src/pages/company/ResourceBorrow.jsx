import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import { useRegionalItems } from "@/lib/useRegionalItems";
import RegionBadge from "@/components/RegionBadge";

const usageColor = {
  日常辦公: "bg-blue-100 text-blue-700",
  視像會議: "bg-purple-100 text-purple-700",
  拍攝: "bg-orange-100 text-orange-700",
  佈置: "bg-green-100 text-green-700",
  藍迪: "bg-teal-100 text-teal-700",
};

export default function ResourceBorrow() {
  const { regions } = useRegion();
  const [tab, setTab] = useState("概覽");
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("全部");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const data = await base44.entities.ResourceItem.filter({ is_active: true }, "sort_order", 500);
    setResources(data);
    setLoading(false);
  };

  const regional = useRegionalItems(resources);

  // Derive categories from data
  const categories = [...new Set(regional.map(r => r.category).filter(Boolean))].map(cat => ({
    label: cat,
    count: regional.filter(r => r.category === cat).length,
  }));

  const filtered = regional.filter(
    (r) =>
      (selectedCat === "全部" || r.category === selectedCat) &&
      (!search || (r.name || "").includes(search) || (r.category || "").includes(search) || (r.location || "").includes(search))
  );

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此物資？")) return;
    await base44.entities.ResourceItem.update(id, { is_active: false });
    load();
  };

  return (
    <div className="space-y-3">
      {/* Header tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {["概覽", "借用記錄"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
              }`}
            >
              {t}
            </button>
          ))}
          <RegionBadge />
        </div>
      </div>

      {tab === "概覽" && (
        <>
          {/* Filters row */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-40">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
                placeholder="搜尋物資名稱、分類、位置..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button onClick={() => { setEditItem(null); setShowForm(true); }}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors ml-auto">
                <Plus size={14} /> 新增物資
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCat("全部")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                selectedCat === "全部" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
              }`}
            >
              全部({regional.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCat(cat.label)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                  selectedCat === cat.label ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                }`}
              >
                {cat.label}({cat.count})
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold bg-gray-50">
                    <th className="px-3 py-3 text-left w-8">#</th>
                    <th className="px-3 py-3 text-left">物品</th>
                    <th className="px-3 py-3 text-left">位置</th>
                    <th className="px-3 py-3 text-left">借用方式</th>
                    <th className="px-3 py-3 text-left">歸還方式</th>
                    <th className="px-3 py-3 text-left">庫存</th>
                    <th className="px-3 py-3 text-left">分類</th>
                    <th className="px-3 py-3 text-left">借值</th>
                    <th className="px-3 py-3 text-left">使用用途</th>
                    <th className="px-3 py-3 text-left">主要使用者</th>
                    {isAdmin && <th className="px-3 py-3 text-left">動作</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                      <td className="px-3 py-3 text-xs text-gray-400">{idx + 1}.</td>
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <span className="text-2xl shrink-0">{item.image || "📦"}</span>
                          <span className="text-xs text-gray-800 leading-snug max-w-36">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 max-w-36 leading-snug">{item.location}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{item.borrow_method}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{item.return_method}</td>
                      <td className="px-3 py-3 text-xs font-bold text-gray-800">{item.stock}</td>
                      <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{item.category}</td>
                      <td className="px-3 py-3 text-xs text-gray-700 whitespace-nowrap">{item.value}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${usageColor[item.usage_type] || "bg-gray-100 text-gray-600"}`}>
                          {item.usage_type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{item.user_scope}</td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => { setEditItem(item); setShowForm(true); }} className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 whitespace-nowrap">編輯</button>
                            <button onClick={() => handleDelete(item.id)} className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 whitespace-nowrap">刪除</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">沒有符合條件的物資</div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "借用記錄" && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p>暫無借用記錄</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ResourceFormModal
          item={editItem}
          regions={regions}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function ResourceFormModal({ item, regions, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    image: item?.image || "",
    location: item?.location || "",
    borrow_method: item?.borrow_method || "自行取用",
    return_method: item?.return_method || "到期歸還",
    stock: item?.stock || 0,
    category: item?.category || "",
    value: item?.value || "",
    usage_type: item?.usage_type || "",
    user_scope: item?.user_scope || "",
    region_code: item?.region_code || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (item) {
      await base44.entities.ResourceItem.update(item.id, { ...form, stock: Number(form.stock), is_active: true });
    } else {
      await base44.entities.ResourceItem.create({ ...form, stock: Number(form.stock), is_active: true });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900">{item ? "編輯物資" : "新增物資"}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600">名稱 *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600">圖標 (Emoji)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="📦" value={form.image} onChange={e => setForm(f => ({...f, image: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">庫存</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.stock} onChange={e => setForm(f => ({...f, stock: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">位置</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="香港 > ..." value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600">借用方式</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.borrow_method} onChange={e => setForm(f => ({...f, borrow_method: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">歸還方式</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.return_method} onChange={e => setForm(f => ({...f, return_method: e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600">分類</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">借值</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="$100" value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600">使用用途</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.usage_type} onChange={e => setForm(f => ({...f, usage_type: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">主要使用者</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.user_scope} onChange={e => setForm(f => ({...f, user_scope: e.target.value}))} />
            </div>
          </div>
          {regions?.length > 0 && (
            <div>
              <label className="text-xs font-bold text-gray-600">地區</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.region_code} onChange={e => setForm(f => ({...f, region_code: e.target.value}))}>
                <option value="">所有地區</option>
                {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
            {saving ? "儲存中..." : "儲存"}
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium">取消</button>
        </div>
      </div>
    </div>
  );
}