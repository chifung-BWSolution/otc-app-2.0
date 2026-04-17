import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import { useRegionalItems } from "@/lib/useRegionalItems";
import RegionBadge from "@/components/RegionBadge";

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];
const EVENT_TYPES = ["假期", "公司活動", "培訓", "會議", "其他"];
const TYPE_COLOR = {
  "假期": "#ef4444",
  "公司活動": "#14b8a6",
  "培訓": "#8b5cf6",
  "會議": "#0ea5e9",
  "其他": "#6b7280",
};

export default function CompanyCalendar() {
  const { regions } = useRegion();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "management";

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.CompanyEvent.filter({ is_active: true }, "event_date", 500);
    setEvents(data);
    setLoading(false);
  };

  const regionalEvents = useRegionalItems(events);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const getEventsForDay = (d) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return regionalEvents.filter(e => e.event_date === ds);
  };

  const upcoming = regionalEvents
    .filter(e => e.event_date >= today.toISOString().split("T")[0])
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 10);

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此活動？")) return;
    await base44.entities.CompanyEvent.delete(id);
    load();
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-black text-gray-900">公司日曆</h2>
          <RegionBadge />
        </div>
        {isAdmin && (
          <button onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700">
            <Plus size={16} /> 新增活動
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronLeft size={16} />
          </button>
          <div className="font-black text-lg text-gray-900">{year} 年 {MONTH_LABELS[month]}</div>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500 mb-1">
          {DAY_LABELS.map(d => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dayEvents = getEventsForDay(d);
            return (
              <div key={i} className={`min-h-[56px] border border-gray-100 rounded-md p-1 text-xs ${isToday(d) ? "bg-teal-50 border-teal-300" : ""}`}>
                <div className={`font-bold ${isToday(d) ? "text-teal-600" : "text-gray-700"}`}>{d}</div>
                <div className="space-y-0.5 mt-0.5">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className="text-[10px] px-1 py-0.5 rounded truncate text-white"
                      style={{ backgroundColor: e.color || TYPE_COLOR[e.event_type] || "#14b8a6" }}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-gray-400">+{dayEvents.length - 2}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><CalIcon size={15} /> 即將到來的活動</h3>
        {loading ? <div className="text-center py-6 text-gray-400 text-sm">載入中...</div> :
          upcoming.length === 0 ? <div className="text-center py-6 text-gray-400 text-sm">暫無活動</div> :
          <div className="space-y-2">
            {upcoming.map(e => (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
                <div className="w-1 h-10 rounded-full" style={{ backgroundColor: e.color || TYPE_COLOR[e.event_type] || "#14b8a6" }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-gray-900">{e.title}</div>
                  <div className="text-xs text-gray-500">{e.event_date}{e.time_range && ` · ${e.time_range}`}{e.location && ` · 📍${e.location}`}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: e.color || TYPE_COLOR[e.event_type] || "#14b8a6" }}>{e.event_type}</span>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditItem(e); setShowForm(true); }} className="p-1 hover:bg-blue-50 rounded text-blue-500"><Edit2 size={11} /></button>
                    <button onClick={() => handleDelete(e.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={11} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        }
      </div>

      {showForm && (
        <EventEditor item={editItem} regions={regions} onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function EventEditor({ item, regions, onClose, onSaved }) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    event_date: item?.event_date || "",
    end_date: item?.end_date || "",
    time_range: item?.time_range || "",
    location: item?.location || "",
    event_type: item?.event_type || "公司活動",
    color: item?.color || TYPE_COLOR["公司活動"],
    region_codes: item?.region_codes || [],
    is_active: item?.is_active !== false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleRegion = (code) => {
    set("region_codes", form.region_codes.includes(code)
      ? form.region_codes.filter(c => c !== code)
      : [...form.region_codes, code]);
  };

  const handleSave = async () => {
    setSaving(true);
    if (isEdit) await base44.entities.CompanyEvent.update(item.id, form);
    else await base44.entities.CompanyEvent.create(form);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black">{isEdit ? "編輯活動" : "新增活動"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">活動名稱 *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">描述</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">開始日期 *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.event_date} onChange={e => set("event_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">結束日期</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">時間</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.time_range} onChange={e => set("time_range", e.target.value)} placeholder="09:00-17:00" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">地點</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">類型</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.event_type} onChange={e => { set("event_type", e.target.value); set("color", TYPE_COLOR[e.target.value]); }}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
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
        </div>
        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.title || !form.event_date}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}