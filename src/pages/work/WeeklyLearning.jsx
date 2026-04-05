import { useState, useEffect, useRef } from "react";
import { Plus, X, Image, Send, ChevronDown, ChevronUp, Star, BookOpen, CheckCircle, XCircle, Edit3, MessageSquare } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["管理與領導", "銷售技巧", "IT技能", "財務知識", "溝通技巧", "合規與法律", "產品知識", "其他"];
const catColor = {
  "管理與領導": "bg-red-100 text-red-700",
  "銷售技巧": "bg-orange-100 text-orange-700",
  "IT技能": "bg-blue-100 text-blue-700",
  "財務知識": "bg-green-100 text-green-700",
  "溝通技巧": "bg-purple-100 text-purple-700",
  "合規與法律": "bg-yellow-100 text-yellow-700",
  "產品知識": "bg-teal-100 text-teal-700",
  "其他": "bg-gray-100 text-gray-600",
};
const statusColor = {
  "草稿": "bg-gray-100 text-gray-500",
  "待審核": "bg-yellow-100 text-yellow-700",
  "已認證": "bg-green-100 text-green-700",
  "已拒絕": "bg-red-100 text-red-600",
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().split("T")[0];
}

function getWeekEnd(start) {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

function groupByWeek(items) {
  const map = {};
  items.forEach(i => {
    if (!map[i.week_start]) map[i.week_start] = [];
    map[i.week_start].push(i);
  });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

// ── Admin Review Panel ─────────────────────────────────
function AdminReviewPanel({ item, currentUser, onRefresh }) {
  const [score, setScore] = useState(item.score || 0);
  const [scoreNote, setScoreNote] = useState(item.score_note || "");
  const [certTitle, setCertTitle] = useState(item.certified_title || item.title);
  const [certContent, setCertContent] = useState(item.certified_content || item.content);
  const [linkedCourses, setLinkedCourses] = useState(item.linked_courses || []);
  const [showCertEdit, setShowCertEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveScore = async () => {
    setSaving(true);
    await base44.entities.KnowledgeItem.update(item.id, { score, score_note: scoreNote });
    setSaving(false);
    onRefresh();
  };

  const handleCertify = async () => {
    setSaving(true);
    await base44.entities.KnowledgeItem.update(item.id, {
      status: "已認證",
      certified_title: certTitle,
      certified_content: certContent,
      linked_courses: linkedCourses,
      reviewed_by: currentUser?.full_name,
      reviewed_at: new Date().toLocaleString("zh-HK"),
    });
    setSaving(false);
    setShowCertEdit(false);
    onRefresh();
  };

  const handleReject = async () => {
    await base44.entities.KnowledgeItem.update(item.id, {
      status: "已拒絕",
      reviewed_by: currentUser?.full_name,
      reviewed_at: new Date().toLocaleString("zh-HK"),
    });
    onRefresh();
  };

  return (
    <div className="mt-3 border-t border-dashed border-gray-200 pt-3 space-y-3">
      {/* Score */}
      <div>
        <div className="text-xs font-bold text-gray-600 mb-1.5">行政評分</div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setScore(n)}>
              <Star size={20} className={n <= score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-2">{score > 0 ? `${score} 分` : "未評分"}</span>
        </div>
        <input className="w-full mt-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none" placeholder="評分備注（選填）" value={scoreNote} onChange={e => setScoreNote(e.target.value)} />
        <button onClick={handleSaveScore} disabled={saving || score === 0} className="mt-1.5 text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors">
          {saving ? "儲存中..." : "儲存評分"}
        </button>
      </div>

      {/* Certify */}
      {item.status !== "已認證" && (
        <div>
          <button onClick={() => setShowCertEdit(!showCertEdit)} className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 font-semibold">
            <Edit3 size={12} /> {showCertEdit ? "收起" : "編輯並認證為課程知識"}
          </button>
          {showCertEdit && (
            <div className="mt-2 space-y-2">
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1">認證知識標題（可修改原文）</div>
                <input className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" value={certTitle} onChange={e => setCertTitle(e.target.value)} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1">認證知識內容（可修改原文）</div>
                <textarea className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-none" rows={4} value={certContent} onChange={e => setCertContent(e.target.value)} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 mb-1.5">放入課程分類（可多選）</div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setLinkedCourses(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c])} className={`text-xs px-2 py-1 rounded-full border transition-colors ${linkedCourses.includes(c) ? "bg-green-100 text-green-700 border-green-300" : "bg-white text-gray-500 border-gray-200"}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCertify} disabled={saving} className="flex-1 text-xs bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 font-semibold flex items-center justify-center gap-1 disabled:opacity-60">
                  <CheckCircle size={13} /> 認證並放入課程
                </button>
                <button onClick={handleReject} className="text-xs bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-1">
                  <XCircle size={13} /> 拒絕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {item.status === "已認證" && item.linked_courses?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.linked_courses.map((c, i) => (
            <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5"><BookOpen size={10} />{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Knowledge Item Card ────────────────────────────────
function KnowledgeCard({ item, isAdmin, currentUser, expanded, onToggle, onRefresh }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full text-left px-4 py-3" onClick={onToggle}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor[item.category] || "bg-gray-100 text-gray-600"}`}>{item.category}</span>
              {item.score > 0 && (
                <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                  {[...Array(item.score)].map((_, i) => <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />)}
                </span>
              )}
            </div>
            <div className="font-semibold text-sm text-gray-900 mt-1 truncate">{item.title}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[item.status]}`}>{item.status}</span>
            {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{item.content}</p>
          {item.image_url && <img src={item.image_url} alt="" className="rounded-lg w-full max-h-64 object-cover" />}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((t, i) => <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>)}
            </div>
          )}
          {item.review_note && <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1.5">備注：{item.review_note}</p>}
          {item.status === "已認證" && item.certified_title && (
            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <div className="text-xs font-bold text-green-700 mb-1">✅ 認證知識版本</div>
              <div className="text-sm font-semibold text-green-800">{item.certified_title}</div>
              <p className="text-xs text-green-700 mt-0.5 line-clamp-2">{item.certified_content}</p>
            </div>
          )}
          {isAdmin && <AdminReviewPanel item={item} currentUser={currentUser} onRefresh={onRefresh} />}
        </div>
      )}
    </div>
  );
}

// ── Add Knowledge Form ─────────────────────────────────
function AddKnowledgeForm({ currentUser, weekStart, onClose, onRefresh }) {
  const [form, setForm] = useState({ title: "", category: "管理與領導", content: "", tags: "", image_url: "" });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (draft = false) => {
    setSubmitting(true);
    await base44.entities.KnowledgeItem.create({
      title: form.title,
      category: form.category,
      content: form.content,
      image_url: form.image_url,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      week_start: weekStart,
      status: draft ? "草稿" : "待審核",
    });
    setSubmitting(false);
    onClose();
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-teal-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">✍️ 新增學習知識</h3>
        <button onClick={onClose}><X size={16} className="text-gray-400" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">分類 *</label>
          <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">知識標題 *</label>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="標題" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-600 block mb-1">知識內容 *</label>
        <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none" rows={4} placeholder="詳細描述..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-600 block mb-1">圖片（選填）</label>
        {form.image_url ? (
          <div className="relative inline-block">
            <img src={form.image_url} alt="preview" className="h-28 rounded-lg object-cover border border-gray-200" />
            <button onClick={() => setForm({...form, image_url: ""})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X size={11} /></button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors w-full justify-center">
            <Image size={15} /> {uploading ? "上傳中..." : "點擊上傳圖片"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>
      <div>
        <label className="text-xs font-bold text-gray-600 block mb-1">標籤（逗號分隔）</label>
        <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="例如：溝通, 客戶服務" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => handleSubmit(false)} disabled={submitting || !form.title || !form.content} className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
          <Send size={13} /> {submitting ? "提交中..." : "提交審核"}
        </button>
        <button onClick={() => handleSubmit(true)} disabled={submitting} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors">
          💾 草稿
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function WeeklyLearning() {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState("mine"); // mine | all
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  useEffect(() => {
    base44.auth.me().then(u => { setCurrentUser(u); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser) loadAll();
  }, [currentUser]);

  const loadAll = async () => {
    setLoading(true);
    const mine = await base44.entities.KnowledgeItem.filter({ user_email: currentUser.email }, "-created_date", 100);
    setItems(mine);
    if (currentUser?.role === "admin") {
      const all = await base44.entities.KnowledgeItem.list("-created_date", 200);
      setAllItems(all);
    }
    setLoading(false);
  };

  const isAdmin = currentUser?.role === "admin";
  const displayItems = viewMode === "mine" ? items : allItems;
  const weeklyGroups = groupByWeek(displayItems);
  const thisWeekItems = displayItems.filter(i => i.week_start === weekStart);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl p-5 text-white">
        <h2 className="text-lg font-black">每星期學習匯報</h2>
        <p className="text-sm opacity-80 mt-0.5">{weekStart} 至 {weekEnd}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
            <div className="font-bold text-lg">{thisWeekItems.length}</div>
            <div className="text-xs opacity-80">本週知識</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
            <div className="font-bold text-lg">{items.filter(i => i.status === "已認證").length}</div>
            <div className="text-xs opacity-80">已認證</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-1.5 text-center">
            <div className="font-bold text-lg">{items.filter(i => i.status === "待審核").length}</div>
            <div className="text-xs opacity-80">待審核</div>
          </div>
        </div>
      </div>

      {/* View toggle for admin */}
      {isAdmin && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setViewMode("mine")} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${viewMode === "mine" ? "bg-white shadow text-teal-600" : "text-gray-500"}`}>我的知識</button>
          <button onClick={() => setViewMode("all")} className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${viewMode === "all" ? "bg-white shadow text-teal-600" : "text-gray-500"}`}>全部同事</button>
        </div>
      )}

      {/* Add button */}
      {!showForm && (viewMode === "mine" || !isAdmin) && (
        <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-3 rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors shadow-sm">
          <Plus size={16} /> 新增本週學習知識
        </button>
      )}

      {/* Form */}
      {showForm && currentUser && (
        <AddKnowledgeForm currentUser={currentUser} weekStart={weekStart} onClose={() => setShowForm(false)} onRefresh={loadAll} />
      )}

      {/* Knowledge list grouped by week */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">載入中...</div>
      ) : weeklyGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">📖</div>
          <p className="text-sm">尚未提交任何學習知識</p>
        </div>
      ) : (
        weeklyGroups.map(([week, groupItems]) => (
          <div key={week}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-bold text-gray-500">{week} 至 {getWeekEnd(week)}</div>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">{groupItems.length} 項</span>
            </div>
            <div className="space-y-2">
              {groupItems.map(item => (
                <KnowledgeCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onRefresh={loadAll}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}