import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, X, BarChart2, Search, Trash2, BookOpen, User, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

const emptyForm = {
  student_staff_id: "", student_email: "", student_name: "",
  course_id: "", course_name: "", course_code: "", assessment_type: "",
  team: "", bu_name: "", office: "",
  primary_exam_date: "", primary_exam_score: "",
  retest_exam_date: "", retest_exam_score: "",
  score: "", remarks: "",
};

export default function AssessmentResultRegistry() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("全部");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [res, courseList, staffList] = await Promise.all([
      base44.entities.AssessmentResult.list("-created_date", 1000),
      base44.entities.Course.filter({ status: "已發佈" }, "title", 500),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 1000),
    ]);
    setResults(res);
    setCourses(courseList);
    setStaff(staffList);
    setLoading(false);
  };

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...emptyForm, ...item }); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此成績記錄？")) return;
    await base44.entities.AssessmentResult.delete(id);
    loadAll();
  };

  const save = async () => {
    if (!form.student_name || !form.course_name) return;
    const payload = {
      ...form,
      primary_exam_score: form.primary_exam_score === "" ? null : Number(form.primary_exam_score),
      retest_exam_score: form.retest_exam_score === "" ? null : Number(form.retest_exam_score),
      score: Number(form.retest_exam_score || form.primary_exam_score || 0),
    };
    if (editItem) await base44.entities.AssessmentResult.update(editItem.id, payload);
    else await base44.entities.AssessmentResult.create(payload);
    setShowForm(false);
    setEditItem(null);
    setForm(emptyForm);
    loadAll();
  };

  const courseOptions = useMemo(() => ["全部", ...new Set(results.map(r => r.course_name).filter(Boolean))], [results]);

  const filtered = useMemo(() => {
    return results.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (r.student_name || "").toLowerCase().includes(q) ||
        (r.course_name || "").toLowerCase().includes(q) ||
        (r.team || "").toLowerCase().includes(q) ||
        (r.assessment_type || "").toLowerCase().includes(q);
      const matchCourse = filterCourse === "全部" || r.course_name === filterCourse;
      return matchSearch && matchCourse;
    });
  }, [results, search, filterCourse]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">考核成績登記</h2>
          <p className="text-xs text-gray-400">由 Admin 負責登記 · 關聯課程中心及員工目錄</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate("/admin/assessment-dashboard")}
            className="flex items-center gap-1.5 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-200">
            <BarChart2 size={16} /> 成績儀表板
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
            <Plus size={16} /> 新增記錄
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="總記錄" value={filtered.length} color="blue" />
        <StatCard label="有補考" value={filtered.filter(r => r.retest_exam_score).length} color="yellow" />
        <StatCard label="涉及課程" value={new Set(filtered.map(r => r.course_name)).size} color="purple" />
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
            placeholder="搜尋學員、課程、團隊..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
          {courseOptions.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-gray-400">
          <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
          <p>暫無成績記錄</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">學員</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">課程 / 試卷</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">團隊</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">正考</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">補考</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">備註</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">動作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{r.student_name}</div>
                    {r.student_email && <div className="text-xs text-gray-400">{r.student_email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.course_name}</div>
                    {r.assessment_type && <div className="text-xs text-gray-500">{r.assessment_type}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="text-blue-600 font-medium">{r.team || "—"}</div>
                    <div className="text-gray-400">{r.bu_name || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{r.primary_exam_score ?? "—"}</div>
                    {r.primary_exam_date && <div className="text-xs text-gray-400">{String(r.primary_exam_date).slice(0, 10)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-700">{r.retest_exam_score ?? "—"}</div>
                    {r.retest_exam_date && <div className="text-xs text-gray-400">{String(r.retest_exam_date).slice(0, 10)}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-48 truncate">{r.remarks || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-100 rounded text-blue-500"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ResultFormModal
          form={form} setForm={setForm}
          editItem={editItem}
          courses={courses} staff={staff}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const map = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
  };
  return (
    <div className={`rounded-xl p-3 text-center border ${map[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ResultFormModal({ form, setForm, editItem, courses, staff, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSelectCourse = (e) => {
    const c = courses.find(x => x.id === e.target.value);
    setForm(f => ({
      ...f,
      course_id: c?.id || "",
      course_name: c?.title || "",
      course_code: c?.code || "",
    }));
  };

  const handleSelectStaff = (e) => {
    const s = staff.find(x => x.id === e.target.value);
    setForm(f => ({
      ...f,
      student_staff_id: s?.id || "",
      student_email: s?.work_email || "",
      student_name: s?.display_name || s?.full_name || "",
      team: s?.team_name || "",
      bu_name: s?.bu_name || "",
      office: s?.base_location || "",
    }));
  };

  const filteredCourses = useMemo(() => {
    const q = courseSearch.toLowerCase();
    return !q ? courses : courses.filter(c =>
      (c.title || "").toLowerCase().includes(q) || (c.code || "").toLowerCase().includes(q)
    );
  }, [courses, courseSearch]);

  const filteredStaff = useMemo(() => {
    const q = staffSearch.toLowerCase();
    return !q ? staff : staff.filter(s =>
      (s.display_name || "").toLowerCase().includes(q) ||
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.work_email || "").toLowerCase().includes(q) ||
      (s.team_name || "").toLowerCase().includes(q)
    );
  }, [staff, staffSearch]);

  const handleSave = async () => {
    setSaving(true);
    await onSave();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-black text-gray-900">{editItem ? "編輯成績記錄" : "新增成績記錄"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Course */}
          <div>
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1">
              <BookOpen size={12} /> 關聯課程（來自課程中心） *
            </label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mb-1.5 bg-gray-50"
              placeholder="搜尋課程..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.course_id} onChange={handleSelectCourse}>
              <option value="">-- 選擇課程 --</option>
              {filteredCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code ? `[${c.code}] ` : ""}{c.title}
                </option>
              ))}
            </select>
            {form.course_name && !form.course_id && (
              <div className="mt-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                目前值：{form.course_name}{form.course_code ? ` (${form.course_code})` : ""}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">考核試卷 / 類型（選填）</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.assessment_type} onChange={e => set("assessment_type", e.target.value)}
              placeholder="例：Test 01、BW Language [2-3]" />
          </div>

          {/* Student */}
          <div>
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1">
              <User size={12} /> 學員（來自員工目錄） *
            </label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mb-1.5 bg-gray-50"
              placeholder="搜尋員工..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.student_staff_id} onChange={handleSelectStaff}>
              <option value="">-- 選擇學員 --</option>
              {filteredStaff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.display_name}{s.team_name ? ` · ${s.team_name}` : ""}{s.work_email ? ` (${s.work_email})` : ""}
                </option>
              ))}
            </select>
            {form.student_name && !form.student_staff_id && (
              <div className="mt-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                目前值：{form.student_name}{form.team ? ` · ${form.team}` : ""}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">團隊</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.team} onChange={e => set("team", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">辦公室</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.office} onChange={e => set("office", e.target.value)} />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-xs font-bold text-gray-700 mb-2">📘 正考</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">正考時間</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.primary_exam_date || ""} onChange={e => set("primary_exam_date", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">正考分數</label>
                <input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.primary_exam_score} onChange={e => set("primary_exam_score", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-xs font-bold text-gray-700 mb-2">📙 補考（選填）</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">補考時間</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.retest_exam_date || ""} onChange={e => set("retest_exam_date", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">補考分數</label>
                <input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.retest_exam_score} onChange={e => set("retest_exam_score", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">備註</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              value={form.remarks} onChange={e => set("remarks", e.target.value)} />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.student_name || !form.course_name}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}