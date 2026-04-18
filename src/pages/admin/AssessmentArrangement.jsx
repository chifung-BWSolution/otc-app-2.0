import { useState, useEffect, useMemo } from "react";
import { Plus, X, Edit2, Trash2, Search, BookOpen, User, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColor = {
  "未開始": "bg-gray-100 text-gray-600",
  "進行中": "bg-blue-100 text-blue-700",
  "已完成": "bg-green-100 text-green-700",
};

const emptyForm = {
  course_id: "", course_name: "", course_code: "",
  student_email: "", student_name: "", student_staff_id: "",
  team: "", bu_name: "", position: "",
  assessment_date: "", assessment_end_date: "",
  question_file_url: "",
  max_attempts: 1, passing_score: 60, status: "未開始", remarks: "",
};

export default function AssessmentArrangement() {
  const [arrangements, setArrangements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [arr, courseList, staffList] = await Promise.all([
      base44.entities.AssessmentArrangement.list("-created_date", 500),
      base44.entities.Course.filter({ status: "已發佈" }, "title", 500),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 1000),
    ]);
    setArrangements(arr);
    setCourses(courseList);
    setStaff(staffList);
    setLoading(false);
  };

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...emptyForm, ...item }); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此考核安排？")) return;
    await base44.entities.AssessmentArrangement.delete(id);
    loadData();
  };

  const save = async () => {
    if (!form.course_id || !form.student_email) return;
    const payload = { ...form };
    if (editItem) await base44.entities.AssessmentArrangement.update(editItem.id, payload);
    else await base44.entities.AssessmentArrangement.create(payload);
    setShowForm(false);
    setEditItem(null);
    setForm(emptyForm);
    loadData();
  };

  const filtered = useMemo(() => {
    return arrangements.filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        (a.course_name || "").toLowerCase().includes(q) ||
        (a.student_name || "").toLowerCase().includes(q) ||
        (a.student_email || "").toLowerCase().includes(q) ||
        (a.team || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [arrangements, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">考核安排管理</h2>
          <p className="text-xs text-gray-400">關聯課程中心及員工目錄，學員可於「考試中心」查看</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
          <Plus size={16} /> 新增考核安排
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="總安排數" value={arrangements.length} color="blue" />
        <StatCard label="未開始" value={arrangements.filter(a => a.status === "未開始").length} color="gray" />
        <StatCard label="進行中" value={arrangements.filter(a => a.status === "進行中").length} color="orange" />
        <StatCard label="已完成" value={arrangements.filter(a => a.status === "已完成").length} color="green" />
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
            placeholder="搜尋課程、學員、團隊..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">全部狀態</option>
          <option value="未開始">未開始</option>
          <option value="進行中">進行中</option>
          <option value="已完成">已完成</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-gray-400">
          <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
          <p>{arrangements.length === 0 ? "尚未安排任何考核" : "沒有符合條件的考核"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">課程</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">學員</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">BU / Team</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">考核時間</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">合格/次數</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">狀態</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">動作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(arr => (
                <tr key={arr.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{arr.course_name}</div>
                    {arr.course_code && <div className="text-xs text-gray-400">{arr.course_code}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{arr.student_name || "—"}</div>
                    <div className="text-xs text-gray-400">{arr.student_email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="text-blue-600 font-medium">{arr.team || "—"}</div>
                    <div className="text-gray-400">{arr.bu_name || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {arr.assessment_date ? new Date(arr.assessment_date).toLocaleString("zh-HK", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    {arr.assessment_end_date && (
                      <div className="text-gray-400">至 {new Date(arr.assessment_end_date).toLocaleString("zh-HK", { dateStyle: "short", timeStyle: "short" })}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs">
                    <div className="font-bold text-gray-900">{arr.passing_score} 分</div>
                    <div className="text-gray-400">{arr.max_attempts} 次</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[arr.status] || "bg-gray-100"}`}>
                      {arr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(arr)} className="p-1.5 hover:bg-blue-100 rounded text-blue-500"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(arr.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ArrangementFormModal
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
    gray: "bg-gray-50 border-gray-100 text-gray-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    green: "bg-green-50 border-green-100 text-green-600",
  };
  return (
    <div className={`rounded-xl p-3 text-center border ${map[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ArrangementFormModal({ form, setForm, editItem, courses, staff, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSelectCourse = (e) => {
    const c = courses.find(x => x.id === e.target.value);
    if (c) set("course_id", c.id) & set("course_name", c.title) & set("course_code", c.code || "");
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
      position: s?.position || "",
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
          <h3 className="font-black text-gray-900">{editItem ? "編輯考核安排" : "新增考核安排"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Course */}
          <div>
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1">
              <BookOpen size={12} /> 關聯課程（來自課程中心） *
            </label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mb-1.5 bg-gray-50"
              placeholder="快速搜尋課程名稱或編號..." value={courseSearch} onChange={e => setCourseSearch(e.target.value)} />
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.course_id} onChange={handleSelectCourse}>
              <option value="">-- 選擇課程 --</option>
              {filteredCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code ? `[${c.code}] ` : ""}{c.title}
                </option>
              ))}
            </select>
            {form.course_id && (
              <div className="mt-1 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                ✓ 已選：{form.course_name}{form.course_code ? ` (${form.course_code})` : ""}
              </div>
            )}
          </div>

          {/* Student */}
          <div>
            <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-1">
              <User size={12} /> 學員（來自員工目錄） *
            </label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs mb-1.5 bg-gray-50"
              placeholder="快速搜尋姓名、電郵或團隊..." value={staffSearch} onChange={e => setStaffSearch(e.target.value)} />
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.student_staff_id} onChange={handleSelectStaff}>
              <option value="">-- 選擇學員 --</option>
              {filteredStaff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.display_name}{s.team_name ? ` · ${s.team_name}` : ""}{s.work_email ? ` (${s.work_email})` : ""}
                </option>
              ))}
            </select>
            {form.student_email && (
              <div className="mt-1 text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                ✓ {form.student_name} · {form.student_email}
                {form.team ? ` · ${form.team}` : ""}{form.bu_name ? ` · ${form.bu_name}` : ""}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">考核開始時間</label>
              <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.assessment_date} onChange={e => set("assessment_date", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">考核結束時間</label>
              <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.assessment_end_date} onChange={e => set("assessment_end_date", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">合格分數</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.passing_score} onChange={e => set("passing_score", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">可考核次數</label>
              <input type="number" min={1} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.max_attempts} onChange={e => set("max_attempts", Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">狀態</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={form.status} onChange={e => set("status", e.target.value)}>
                {["未開始", "進行中", "已完成"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">試題檔案 URL（選填）</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.question_file_url} onChange={e => set("question_file_url", e.target.value)}
              placeholder="https://..." />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">備註</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              value={form.remarks} onChange={e => set("remarks", e.target.value)} />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold">取消</button>
          <button onClick={handleSave} disabled={saving || !form.course_id || !form.student_email}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} 儲存
          </button>
        </div>
      </div>
    </div>
  );
}