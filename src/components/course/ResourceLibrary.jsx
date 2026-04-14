import { useState, useEffect } from "react";
import { Search, Plus, Star, Clock, Upload, X, CheckCircle, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["管理與領導", "銷售技巧", "IT技能", "財務知識", "溝通技巧", "合規與法律", "產品知識", "其他"];
const FORMATS = ["PPT", "YouTube", "PDF", "Workbook", "圖文筆記", "其他"];
const METHODS = ["自學", "課堂", "混合"];
const DEPTS = ["全部部門", "市場部", "銷售部", "IT部", "財務部", "人事部", "行政部"];

const formatIcon = { PPT: "📊", YouTube: "▶️", PDF: "📄", Workbook: "📓", "圖文筆記": "🖼️", 其他: "📎" };
const difficultyColor = ["", "bg-green-100 text-green-700", "bg-lime-100 text-lime-700", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];

export default function ResourceLibrary({ currentUser }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("全部");
  const [deptFilter, setDeptFilter] = useState("全部部門");
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "管理與領導", format: "PDF",
    url: "", tags: "", difficulty: 1, target_dept: [], target_role: "",
    learning_method: "自學", duration_minutes: 30
  });
  const [submitting, setSubmitting] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(false);

  useEffect(() => {
    setIsAdmin(currentUser?.role === "admin");
    loadResources();
  }, [currentUser]);

  const loadResources = async () => {
    setLoading(true);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) { setLoading(false); return; }
    const data = await base44.entities.CourseResource.list("-created_date", 100);
    setResources(data);
    setLoading(false);
  };

  const handleUpload = async () => {
    setSubmitting(true);
    await base44.entities.CourseResource.create({
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      target_dept: form.target_dept,
      status: "待審核",
      uploaded_by: currentUser?.full_name || currentUser?.email,
    });
    setSubmitting(false);
    setShowUpload(false);
    setForm({ title: "", description: "", category: "管理與領導", format: "PDF", url: "", tags: "", difficulty: 1, target_dept: [], target_role: "", learning_method: "自學", duration_minutes: 30 });
    loadResources();
  };

  const handleApprove = async (id, approve) => {
    await base44.entities.CourseResource.update(id, {
      status: approve ? "已發佈" : "已拒絕",
      reviewed_by: currentUser?.full_name,
    });
    loadResources();
  };

  const userDept = currentUser?.dept;
  const filtered = resources.filter(r => {
    const matchSearch = r.title?.includes(search) || r.description?.includes(search);
    const matchCat = catFilter === "全部" || r.category === catFilter;
    const matchDept = deptFilter === "全部部門" || !r.target_dept?.length || r.target_dept.includes(deptFilter.replace("全部部門", ""));
    const matchPending = !pendingOnly || r.status === "待審核";
    const visible = isAdmin || r.status === "已發佈";
    return matchSearch && matchCat && matchDept && matchPending && visible;
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 bg-gray-50" placeholder="搜尋資源..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="全部">全部分類</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          {DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
        {isAdmin && (
          <button onClick={() => setPendingOnly(!pendingOnly)} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${pendingOnly ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-white text-gray-500 border-gray-200"}`}>
            <Filter size={13} /> 待審核
          </button>
        )}
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-1.5 bg-teal-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors">
          <Plus size={14} /> 上傳資源
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
          <div className="text-xl font-bold text-teal-600">{resources.filter(r => r.status === "已發佈").length}</div>
          <div className="text-xs text-gray-500">已發佈</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
          <div className="text-xl font-bold text-orange-600">{resources.filter(r => r.status === "待審核").length}</div>
          <div className="text-xs text-gray-500">待審核</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-xl font-bold text-blue-600">{CATEGORIES.length}</div>
          <div className="text-xs text-gray-500">分類數</div>
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400"><div className="text-4xl mb-2">📚</div><p>暫無資源</p></div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{formatIcon[r.format] || "📎"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-sm">{r.title}</h4>
                    {r.status === "待審核" && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">待審核</span>}
                    {r.status === "已拒絕" && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">已拒絕</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{r.category}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.format}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[r.difficulty] || "bg-gray-100 text-gray-600"}`}>Level {r.difficulty}</span>
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{r.learning_method}</span>
                  </div>
                  {r.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {r.duration_minutes && <span className="flex items-center gap-1"><Clock size={11} />{r.duration_minutes}分鐘</span>}
                    {r.target_role && <span>👤 {r.target_role}</span>}
                  </div>
                  {r.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.tags.map((tag, i) => <span key={i} className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded">#{tag}</span>)}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-teal-600 hover:underline">🔗 開啟資源</a>}
                    {isAdmin && r.status === "待審核" && (
                      <div className="flex gap-1 ml-auto">
                        <button onClick={() => handleApprove(r.id, true)} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200">✓ 批准</button>
                        <button onClick={() => handleApprove(r.id, false)} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded hover:bg-red-200">✕ 拒絕</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 my-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">上傳學習資源</h3>
              <button onClick={() => setShowUpload(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">標題 *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="資源標題" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">大分類 *</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">格式 *</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.format} onChange={e => setForm({...form, format: e.target.value})}>
                    {FORMATS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">難度 Level (1-5) *</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.difficulty} onChange={e => setForm({...form, difficulty: Number(e.target.value)})}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>Level {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">學習方式 *</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.learning_method} onChange={e => setForm({...form, learning_method: e.target.value})}>
                    {METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">目標對象</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.target_role} onChange={e => setForm({...form, target_role: e.target.value})} placeholder="例如：Team Leader、所有員工" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">標籤 Tags（用逗號分隔）</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="例如：領導力, 溝通, 進階" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">連結/URL</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">預計學習時間（分鐘）</label>
                <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">描述</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="資源描述..." />
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-orange-700">
                ⚠️ 上傳後須等待 Admin 審核通過才會發佈
              </div>
              <button onClick={handleUpload} disabled={submitting || !form.title} className="w-full bg-teal-500 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-teal-600 transition-colors disabled:opacity-60">
                {submitting ? "提交中..." : "📤 提交審核"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}