import { useState, useEffect } from "react";
import { Plus, X, Clock, CheckCircle, AlertCircle, Edit2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AssessmentArrangement() {
  const [arrangements, setArrangements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    course_name: "", student_email: "", team: "", assessment_date: "", 
    assessment_end_date: "", question_file_url: "", max_attempts: 1, 
    passing_score: 60, status: "未開始", remarks: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [arr, courses, users] = await Promise.all([
      base44.entities.AssessmentArrangement.list("-created_date", 200),
      base44.entities.CourseResource.filter({ status: "已發布" }),
      base44.entities.User.list()
    ]);
    setArrangements(arr);
    setCourses([...new Set(courses.map(c => c.title))]);
    setUsers(users);
    setLoading(false);
  };

  const saveArrangement = async () => {
    if (!form.course_name || !form.student_email) return;
    if (editItem) {
      await base44.entities.AssessmentArrangement.update(editItem.id, form);
    } else {
      await base44.entities.AssessmentArrangement.create(form);
    }
    setShowForm(false);
    setEditItem(null);
    setForm({ course_name: "", student_email: "", team: "", assessment_date: "", assessment_end_date: "", question_file_url: "", max_attempts: 1, passing_score: 60, status: "未開始", remarks: "" });
    loadData();
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm(item);
    setShowForm(true);
  };

  const statusColor = { "未開始": "bg-gray-100 text-gray-600", "進行中": "bg-blue-100 text-blue-700", "已完成": "bg-green-100 text-green-600" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">考核安排管理</h2>
        <button onClick={() => { setShowForm(true); setEditItem(null); }} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
          <Plus size={16} /> 新增考核安排
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{arrangements.length}</div>
          <div className="text-xs text-gray-500">總安排數</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{arrangements.filter(a => a.status === "進行中").length}</div>
          <div className="text-xs text-gray-500">進行中</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{arrangements.filter(a => a.status === "已完成").length}</div>
          <div className="text-xs text-gray-500">已完成</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">課程</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">學員</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">團隊</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">考核時間</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">狀態</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">合格分數</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">動作</th>
              </tr>
            </thead>
            <tbody>
              {arrangements.map(arr => (
                <tr key={arr.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{arr.course_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{arr.student_name || arr.student_email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{arr.team}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{arr.assessment_date?.slice(0, 10)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[arr.status]}`}>{arr.status}</span></td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{arr.passing_score}</td>
                  <td className="px-4 py-3 flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(arr)} className="p-1 hover:bg-blue-100 rounded text-blue-500"><Edit2 size={14} /></button>
                    <button className="p-1 hover:bg-orange-100 rounded text-orange-500"><Clock size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b bg-white">
              <h3 className="font-black text-gray-900">{editItem ? "編輯考核安排" : "新增考核安排"}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">課程 *</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.course_name} onChange={e => setForm({...form, course_name: e.target.value})}>
                    <option value="">-- 選擇課程 --</option>
                    {courses.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">學員 *</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.student_email} onChange={e => { const u = users.find(x => x.email === e.target.value); setForm({...form, student_email: e.target.value, student_name: u?.full_name, team: u?.department || ""}); }}>
                    <option value="">-- 選擇學員 --</option>
                    {users.map(u => <option key={u.email} value={u.email}>{u.full_name} ({u.email})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">團隊</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.team} onChange={e => setForm({...form, team: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">合格分數</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.passing_score} onChange={e => setForm({...form, passing_score: Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">考核開始時間</label>
                  <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.assessment_date} onChange={e => setForm({...form, assessment_date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">考核結束時間</label>
                  <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.assessment_end_date} onChange={e => setForm({...form, assessment_end_date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">考核次數</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.max_attempts} onChange={e => setForm({...form, max_attempts: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">狀態</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    {["未開始", "進行中", "已完成"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">備註</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows={2} value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-2">
              <button onClick={saveArrangement} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">儲存</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}