import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, X, BarChart2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AssessmentResultRegistry() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filterCourse, setFilterCourse] = useState("全部");
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    student_email: "", student_name: "", course_name: "", team: "", office: "",
    score: 0, passing_status: "不合格", primary_exam_date: "", primary_exam_score: 0,
    retest_exam_date: "", retest_exam_score: 0, remarks: "", assessment_type: ""
  });

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    setLoading(true);
    const data = await base44.entities.AssessmentResult.list("-created_date", 500);
    setResults(data);
    const courseSet = [...new Set(data.map(r => r.course_name))];
    setCourses(["全部", ...courseSet]);
    setLoading(false);
  };

  const saveResult = async () => {
    if (!form.student_email || !form.course_name) return;
    if (editItem) {
      await base44.entities.AssessmentResult.update(editItem.id, form);
    } else {
      await base44.entities.AssessmentResult.create(form);
    }
    setShowForm(false);
    setEditItem(null);
    setForm({
      student_email: "", student_name: "", course_name: "", team: "", office: "",
      score: 0, passing_status: "不合格", primary_exam_date: "", primary_exam_score: 0,
      retest_exam_date: "", retest_exam_score: 0, remarks: "", assessment_type: ""
    });
    loadResults();
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm(item);
    setShowForm(true);
  };

  const filtered = filterCourse === "全部" ? results : results.filter(r => r.course_name === filterCourse);

  const statusBg = {
    "合格": "bg-green-100 text-green-700",
    "不合格": "bg-red-100 text-red-700",
    "需補考": "bg-yellow-100 text-yellow-700"
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">考核成績登記</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate("/admin/assessment-dashboard")} className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-200 transition-colors">
            <BarChart2 size={16} /> 成績儀表板
          </button>
          <button onClick={() => { setShowForm(true); setEditItem(null); }} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
            <Plus size={16} /> 新增記錄
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{filtered.length}</div>
          <div className="text-xs text-gray-500">總記錄</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{filtered.filter(r => r.passing_status === "合格").length}</div>
          <div className="text-xs text-gray-500">合格</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-red-600">{filtered.filter(r => r.passing_status === "不合格").length}</div>
          <div className="text-xs text-gray-500">不合格</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{filtered.filter(r => r.passing_status === "需補考").length}</div>
          <div className="text-xs text-gray-500">需補考</div>
        </div>
      </div>

      {/* Filter */}
      <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
        {courses.map(c => <option key={c}>{c}</option>)}
      </select>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">學員</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">課程</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">團隊</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">正考成績</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">補考成績</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">最終結果</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">備註</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">動作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(res => (
                <tr key={res.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{res.student_name}</td>
                  <td className="px-4 py-3 text-gray-700">{res.course_name}</td>
                  <td className="px-4 py-3 text-gray-600">{res.team}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{res.primary_exam_score || res.score}</td>
                  <td className="px-4 py-3 text-gray-700">{res.retest_exam_score || "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusBg[res.passing_status]}`}>{res.passing_status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{res.remarks}</td>
                  <td className="px-4 py-3 text-center"><button onClick={() => openEdit(res)} className="p-1 hover:bg-blue-100 rounded text-blue-500"><Edit2 size={14} /></button></td>
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
              <h3 className="font-black text-gray-900">{editItem ? "編輯記錄" : "新增記錄"}</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="學員郵箱" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.student_email} onChange={e => setForm({...form, student_email: e.target.value})} />
                <input placeholder="學員姓名" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.student_name} onChange={e => setForm({...form, student_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="課程名稱" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.course_name} onChange={e => setForm({...form, course_name: e.target.value})} />
                <input placeholder="團隊" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.team} onChange={e => setForm({...form, team: e.target.value})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <input type="number" placeholder="正考分數" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.primary_exam_score} onChange={e => setForm({...form, primary_exam_score: Number(e.target.value), score: Number(e.target.value)})} />
                <input type="number" placeholder="補考分數" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.retest_exam_score} onChange={e => setForm({...form, retest_exam_score: Number(e.target.value)})} />
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.passing_status} onChange={e => setForm({...form, passing_status: e.target.value})}>
                  {["合格", "不合格", "需補考"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <input type="date" placeholder="正考時間" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.primary_exam_date} onChange={e => setForm({...form, primary_exam_date: e.target.value})} />
              <textarea placeholder="備註" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} />
            </div>
            <div className="px-6 py-4 border-t flex gap-2">
              <button onClick={saveResult} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">儲存</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}