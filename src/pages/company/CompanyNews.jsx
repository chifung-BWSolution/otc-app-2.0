import { useState, useEffect } from "react";
import { Bookmark, Share2, Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import { useRegionalItems } from "@/lib/useRegionalItems";
import RegionBadge from "@/components/RegionBadge";

const tabs = ["最新", "行政", "活動", "IT", "獎項", "公告"];
const catColor = { 活動: "text-red-500", 行政: "text-blue-500", 獎項: "text-yellow-500", IT: "text-purple-500", 公告: "text-green-500" };

export default function CompanyNews() {
  const { regions } = useRegion();
  const [activeTab, setActiveTab] = useState("最新");
  const [news, setNews] = useState([]);
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
    const data = await base44.entities.CompanyNews.filter({ is_active: true }, "-created_date", 100);
    setNews(data);
    setLoading(false);
  };

  const regional = useRegionalItems(news);
  const filtered = activeTab === "最新" ? regional : regional.filter((n) => n.category === activeTab);
  const mainCard = filtered[0];
  const gridCards = filtered.slice(1);

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此公告？")) return;
    await base44.entities.CompanyNews.update(id, { is_active: false });
    load();
  };

  return (
    <div className="space-y-0 -mx-4 md:-mx-6 -mt-4 md:-mt-6">
      {/* ── Tabs ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 sticky top-[53px] z-10 px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === t ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {t}
              </button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => { setEditItem(null); setShowForm(true); }}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 shrink-0">
              <Plus size={14} /> 新增
            </button>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────── */}
      <div className="px-4 md:px-6 py-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={28} />
          </div>
        ) : (
          <>
            {/* Big featured card */}
            {mainCard && (
              <div className="cursor-pointer group relative">
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={mainCard.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"} alt={mainCard.title} className="w-full h-52 md:h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      {mainCard.urgent && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">緊急</span>}
                      <span className={`text-xs font-bold ${catColor[mainCard.category] || "text-white"}`}>{mainCard.category}</span>
                    </div>
                    <h3 className="text-white font-black text-lg leading-snug">{mainCard.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-white/60 text-xs">{mainCard.author} · {mainCard.time_label}</span>
                      <div className="flex gap-2">
                        <button className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><Bookmark size={13} className="text-white" /></button>
                        <button className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"><Share2 size={13} className="text-white" /></button>
                      </div>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditItem(mainCard); setShowForm(true); }} className="p-1.5 bg-white/90 rounded-full shadow hover:bg-white"><Edit2 size={12} className="text-gray-600" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(mainCard.id); }} className="p-1.5 bg-white/90 rounded-full shadow hover:bg-white"><Trash2 size={12} className="text-red-500" /></button>
                  </div>
                )}
              </div>
            )}

            {/* 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gridCards.map((n) => (
                <div key={n.id} className="cursor-pointer group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative">
                  <div className="relative overflow-hidden">
                    <img src={n.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80"} alt={n.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
                    {n.urgent && (
                      <span className="absolute top-2 left-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">緊急</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className={`text-xs font-bold mb-1 ${catColor[n.category] || "text-gray-500"}`}>{n.category}</div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">{n.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{n.author} · {n.time_label}</span>
                      <button className="p-1 hover:text-red-500 transition-colors"><Bookmark size={13} className="text-gray-300" /></button>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditItem(n); setShowForm(true); }} className="p-1 bg-white/90 rounded-full shadow hover:bg-white"><Edit2 size={11} className="text-gray-600" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} className="p-1 bg-white/90 rounded-full shadow hover:bg-white"><Trash2 size={11} className="text-red-500" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <p>沒有相關公告</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Form Modal ─────────────────────────────────── */}
      {showForm && (
        <NewsFormModal
          item={editItem}
          regions={regions}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

function NewsFormModal({ item, regions, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    category: item?.category || "行政",
    time_label: item?.time_label || "",
    image: item?.image || "",
    author: item?.author || "",
    urgent: item?.urgent || false,
    is_featured: item?.is_featured || false,
    region_code: item?.region_code || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (item) {
      await base44.entities.CompanyNews.update(item.id, { ...form, is_active: true });
    } else {
      await base44.entities.CompanyNews.create({ ...form, is_active: true });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-gray-900">{item ? "編輯公告" : "新增公告"}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600">標題 *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600">分類</label>
              <select className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {["行政","活動","IT","獎項","公告"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600">作者</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" value={form.author} onChange={e => setForm(f => ({...f, author: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">時間標籤</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="例：2小時前" value={form.time_label} onChange={e => setForm(f => ({...f, time_label: e.target.value}))} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600">圖片 URL</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="https://..." value={form.image} onChange={e => setForm(f => ({...f, image: e.target.value}))} />
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
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.urgent} onChange={e => setForm(f => ({...f, urgent: e.target.checked}))} /> 緊急
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({...f, is_featured: e.target.checked}))} /> 精選
            </label>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} disabled={saving || !form.title.trim()} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
            {saving ? "儲存中..." : "儲存"}
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium">取消</button>
        </div>
      </div>
    </div>
  );
}