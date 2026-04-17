import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Globe2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";

const COLORS = ["#14b8a6", "#8b5cf6", "#0ea5e9", "#f59e0b", "#ef4444", "#ec4899", "#10b981", "#6366f1"];

export default function RegionManagement() {
  const { refresh: refreshRegion } = useRegion();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Region.list("sort_order", 50);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此地區？相關模組資料不會被刪除但會失去地區綁定。")) return;
    await base44.entities.Region.delete(id);
    load();
    refreshRegion();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">地區管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">管理不同地區的辦公室，各模組內容將按員工所屬地區自動過濾</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700">
          <Plus size={16} /> 新增地區
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-gray-400">
          <Globe2 size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無地區，請新增。建議先新增「CFA 香港」和「CFB 深圳」</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              style={{ borderLeft: `4px solid ${r.color || "#14b8a6"}` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{r.icon || "🏢"}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{r.full_name || r.name}</h3>
                    <div className="text-xs text-gray-500">代碼：{r.code}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditItem(r); setShowForm(true); }}
                    className="p-1.5 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(r.id)}
                    className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              {r.office_address && <p className="text-xs text-gray-500 mt-2">📍 {r.office_address}</p>}
              {r.base_locations?.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">對應 base_location：</div>
                  <div className="flex flex-wrap gap-1">
                    {r.base_locations.map((l, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{l}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span>🕐 {r.timezone || "—"}</span>
                <span>💰 {r.currency || "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RegionForm item={editItem} onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); refreshRegion(); }} />
      )}
    </div>
  );
}

function RegionForm({ item, onClose, onSaved }) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: item?.code || "",
    name: item?.name || "",
    full_name: item?.full_name || "",
    office_address: item?.office_address || "",
    timezone: item?.timezone || "Asia/Hong_Kong",
    currency: item?.currency || "HKD",
    color: item?.color || COLORS[0],
    icon: item?.icon || "🏢",
    sort_order: item?.sort_order || 0,
    is_active: item?.is_active !== false,
    base_locations: item?.base_locations || [],
  });
  const [locInput, setLocInput] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.code || !form.name) return;
    setSaving(true);
    if (isEdit) await base44.entities.Region.update(item.id, form);
    else await base44.entities.Region.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black">{isEdit ? "編輯地區" : "新增地區"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">地區代碼 *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.code}
                onChange={e => set("code", e.target.value.toUpperCase())} placeholder="CFA" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">名稱 *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.name}
                onChange={e => set("name", e.target.value)} placeholder="香港" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">完整名稱</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.full_name}
              onChange={e => set("full_name", e.target.value)} placeholder="CFA 香港" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">辦公室地址</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.office_address}
              onChange={e => set("office_address", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">對應 base_location（員工資料的辦公室地點值）</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={locInput}
                onChange={e => setLocInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && locInput.trim()) { e.preventDefault(); set("base_locations", [...form.base_locations, locInput.trim()]); setLocInput(""); } }}
                placeholder="例：Hong Kong Office，Enter 新增" />
            </div>
            <div className="flex flex-wrap gap-1">
              {form.base_locations.map((l, i) => (
                <span key={i} className="flex items-center gap-1 bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">
                  {l}
                  <button onClick={() => set("base_locations", form.base_locations.filter((_, idx) => idx !== i))}><X size={11} /></button>
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">時區</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.timezone} onChange={e => set("timezone", e.target.value)}>
                <option>Asia/Hong_Kong</option>
                <option>Asia/Shanghai</option>
                <option>Asia/Singapore</option>
                <option>Asia/Tokyo</option>
                <option>UTC</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">貨幣</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option>HKD</option><option>CNY</option><option>USD</option><option>SGD</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">排序</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.sort_order} onChange={e => set("sort_order", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">圖標 Emoji</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.icon} onChange={e => set("icon", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">主題顏色</label>
              <div className="flex gap-1.5">
                {COLORS.map(c => (
                  <button key={c} onClick={() => set("color", c)}
                    className={`w-7 h-7 rounded-lg ${form.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="reg_active" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
            <label htmlFor="reg_active" className="text-sm">啟用此地區</label>
          </div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.code || !form.name}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}