import { useState, useEffect } from "react";
import { Plus, Users, Clock, MapPin, Calendar, X, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DEPTS = ["市場部", "銷售部", "IT部", "財務部", "人事部", "行政部", "全體"];

export default function WorkshopTab({ currentUser }) {
  const [workshops, setWorkshops] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isAdmin = currentUser?.role === "admin";

  const [form, setForm] = useState({
    title: "", description: "", trainer_name: "", date: "",
    start_time: "10:00", end_time: "12:00", duration_hours: 2,
    location: "", max_capacity: 20, target_dept: [], materials_url: ""
  });

  useEffect(() => {
    loadAll();
  }, [currentUser]);

  const loadAll = async () => {
    setLoading(true);
    const ws = await base44.entities.Workshop.list("-date", 50);
    setWorkshops(ws);
    if (currentUser?.email) {
      const att = await base44.entities.WorkshopAttendance.filter({ user_email: currentUser.email });
      setMyAttendance(att);
    }
    setLoading(false);
  };

  const getAttendeeCount = async (workshopId) => {
    const att = await base44.entities.WorkshopAttendance.filter({ workshop_id: workshopId });
    return att.length;
  };

  const isRegistered = (workshopId) => myAttendance.some(a => a.workshop_id === workshopId);

  const handleRegister = async (workshop) => {
    if (isRegistered(workshop.id)) return;
    await base44.entities.WorkshopAttendance.create({
      workshop_id: workshop.id,
      workshop_title: workshop.title,
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      status: "已報名",
      registered_at: new Date().toISOString(),
    });
    loadAll();
  };

  const handleCreate = async () => {
    setSubmitting(true);
    const start = new Date(`${form.date}T${form.start_time}`);
    const end = new Date(`${form.date}T${form.end_time}`);
    const hours = (end - start) / 3600000;
    await base44.entities.Workshop.create({
      ...form,
      duration_hours: hours > 0 ? hours : form.duration_hours,
      trainer_email: currentUser?.email,
      status: "報名中",
      is_valid: false,
      trainer_hours_logged: 0,
    });
    setSubmitting(false);
    setShowCreate(false);
    setForm({ title: "", description: "", trainer_name: "", date: "", start_time: "10:00", end_time: "12:00", duration_hours: 2, location: "", max_capacity: 20, target_dept: [], materials_url: "" });
    loadAll();
  };

  const handleMarkComplete = async (workshop) => {
    const att = await base44.entities.WorkshopAttendance.filter({ workshop_id: workshop.id, status: "出席" });
    const isValid = att.length >= 3;
    await base44.entities.Workshop.update(workshop.id, {
      status: "已完成",
      is_valid: isValid,
      trainer_hours_logged: workshop.duration_hours,
    });
    loadAll();
  };

  const today = new Date().toISOString().split("T")[0];
  const upcoming = workshops.filter(w => w.date >= today && w.status === "報名中");
  const past = workshops.filter(w => w.date < today || w.status === "已完成");

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      {isAdmin && (
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition-colors">
          <Plus size={14} /> 建立工作坊
        </button>
      )}

      {/* My Schedule */}
      {myAttendance.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> 我的日程</h3>
          <div className="space-y-1">
            {myAttendance.map(a => {
              const ws = workshops.find(w => w.id === a.workshop_id);
              if (!ws) return null;
              return (
                <div key={a.id} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2">
                  <span className="font-medium text-gray-800">{ws.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{ws.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "已報名" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>{a.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Workshops */}
      <div>
        <h3 className="font-bold text-gray-700 mb-2">即將舉行</h3>
        {loading ? <p className="text-xs text-gray-400 text-center py-6">載入中...</p> : (
          <div className="space-y-3">
            {upcoming.length === 0 && <p className="text-xs text-gray-400 text-center py-6 bg-white rounded-xl border border-gray-100">暫無即將舉行的工作坊</p>}
            {upcoming.map(w => {
              const registered = isRegistered(w.id);
              return (
                <div key={w.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{w.title}</h4>
                      {w.description && <p className="text-xs text-gray-500 mt-0.5">{w.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={11} />{w.date}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{w.start_time} - {w.end_time} ({w.duration_hours}h)</span>
                        {w.location && <span className="flex items-center gap-1"><MapPin size={11} />{w.location}</span>}
                        <span className="flex items-center gap-1"><Users size={11} />主講：{w.trainer_name}</span>
                      </div>
                      {w.target_dept?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {w.target_dept.map((d, i) => <span key={i} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{d}</span>)}
                        </div>
                      )}
                      {w.materials_url && <a href={w.materials_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 block">📎 相關資料</a>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleRegister(w)} disabled={registered} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${registered ? "bg-green-100 text-green-600 cursor-default" : "bg-indigo-500 text-white hover:bg-indigo-600"}`}>
                      {registered ? <><CheckCircle size={14} /> 已報名</> : "📝 立即報名"}
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleMarkComplete(w)} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                        標記完成
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-700 mb-2">過往記錄</h3>
          <div className="space-y-2">
            {past.map(w => (
              <div key={w.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-gray-700">{w.title}</span>
                    <div className="text-xs text-gray-500 mt-0.5">{w.date} · {w.trainer_name} · {w.duration_hours}h</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === "已完成" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>{w.status}</span>
                    {w.is_valid !== undefined && w.status === "已完成" && (
                      <div className={`text-xs mt-0.5 ${w.is_valid ? "text-green-600" : "text-red-500"}`}>
                        {w.is_valid ? "✓ 有效培訓" : "✗ 出席不足"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Workshop Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 my-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">建立工作坊</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">工作坊主題 *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="主題名稱" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">主講人 *</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.trainer_name} onChange={e => setForm({...form, trainer_name: e.target.value})} placeholder="主講人姓名" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">日期 *</label>
                  <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">開始時間</label>
                  <input type="time" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">結束時間</label>
                  <input type="time" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">最大人數</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none" value={form.max_capacity} onChange={e => setForm({...form, max_capacity: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">地點</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="會議室/線上/地址" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">目標部門</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEPTS.map(d => (
                    <button key={d} onClick={() => setForm(f => ({ ...f, target_dept: f.target_dept.includes(d) ? f.target_dept.filter(x => x !== d) : [...f.target_dept, d] }))} className={`text-xs px-2 py-1 rounded-full border transition-colors ${form.target_dept.includes(d) ? "bg-indigo-100 text-indigo-600 border-indigo-300" : "bg-white text-gray-500 border-gray-200"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">相關資料連結</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.materials_url} onChange={e => setForm({...form, materials_url: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">描述</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="工作坊簡介..." />
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700">
                ℹ️ 出席人數 ≥ 3 人且有完整記錄才視為有效培訓，培訓師時數計入KPI
              </div>
              <button onClick={handleCreate} disabled={submitting || !form.title || !form.date} className="w-full bg-indigo-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors disabled:opacity-60">
                {submitting ? "建立中..." : "🗓️ 建立工作坊"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}