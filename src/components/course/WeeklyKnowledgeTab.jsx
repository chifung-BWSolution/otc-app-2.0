import { useState, useEffect, useRef } from "react";
import { Plus, X, Image, Send, CheckCircle, XCircle, MessageSquare, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["管理與領導", "銷售技巧", "IT技能", "財務知識", "溝通技巧", "合規與法律", "產品知識", "其他"];
const statusColor = {
  "草稿": "bg-gray-100 text-gray-600",
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

export default function WeeklyKnowledgeTab({ currentUser }) {
  const [items, setItems] = useState([]);
  const [allPending, setAllPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const [showNoteFor, setShowNoteFor] = useState(null);
  const [linkingFor, setLinkingFor] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const isAdmin = currentUser?.role === "admin";
  const weekStart = getWeekStart();

  const [form, setForm] = useState({ title: "", content: "", image_url: "", tags: "" });

  useEffect(() => {
    loadAll();
  }, [currentUser]);

  const loadAll = async () => {
    setLoading(true);
    if (currentUser?.email) {
      const mine = await base44.entities.KnowledgeItem.filter({ user_email: currentUser.email }, "-created_date", 50);
      setItems(mine);
    }
    if (isAdmin) {
      const pending = await base44.entities.KnowledgeItem.filter({ status: "待審核" }, "-created_date", 50);
      setAllPending(pending);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (asDraft = false) => {
    setSubmitting(true);
    await base44.entities.KnowledgeItem.create({
      title: form.title,
      content: form.content,
      image_url: form.image_url,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      user_email: currentUser.email,
      user_name: currentUser.full_name,
      week_start: weekStart,
      status: asDraft ? "草稿" : "待審核",
    });
    setSubmitting(false);
    setShowForm(false);
    setForm({ title: "", content: "", image_url: "", tags: "" });
    loadAll();
  };

  const handleReview = async (item, approve) => {
    await base44.entities.KnowledgeItem.update(item.id, {
      status: approve ? "已認證" : "已拒絕",
      reviewed_by: currentUser?.full_name,
      reviewed_at: new Date().toLocaleString("zh-HK"),
      review_note: reviewNotes[item.id] || "",
    });
    setShowNoteFor(null);
    loadAll();
  };

  const handleLinkCourses = async (item) => {
    await base44.entities.KnowledgeItem.update(item.id, { linked_courses: selectedCourses });
    setLinkingFor(null);
    setSelectedCourses([]);
    loadAll();
  };

  const thisWeekItems = items.filter(i => i.week_start === weekStart);
  const pastItems = items.filter(i => i.week_start !== weekStart);

  return (
    <div className="space-y-4">
      {/* This Week */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">本週學習知識</h3>
            <p className="text-xs text-gray-500">週開始：{weekStart}</p>
          </div>
          <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full font-bold">{thisWeekItems.length} 篇</span>
        </div>
        <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors">
          <Plus size={15} /> 新增學習知識
        </button>
      </div>

      {/* Add Knowledge Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">✍️ 新增學習知識</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-gray-400" /></button>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">知識標題 *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" placeholder="這週學到了什麼？" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">知識內容 *</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none" rows={5} placeholder="詳細描述學習內容、心得、應用方法..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">圖片（選填）</label>
            {form.image_url ? (
              <div className="relative inline-block">
                <img src={form.image_url} alt="preview" className="h-32 rounded-lg object-cover border border-gray-200" />
                <button onClick={() => setForm({...form, image_url: ""})} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors w-full justify-center">
                <Image size={16} /> {uploading ? "上傳中..." : "點擊上傳圖片"}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">標籤（逗號分隔）</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="例如：溝通技巧, 客戶服務" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => handleSubmit(false)} disabled={submitting || !form.title || !form.content} className="flex-1 bg-teal-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-teal-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-1">
              <Send size={14} /> {submitting ? "提交中..." : "提交審核"}
            </button>
            <button onClick={() => handleSubmit(true)} disabled={submitting} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              💾 儲存草稿
            </button>
          </div>
        </div>
      )}

      {/* My Knowledge List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">載入中...</div>
      ) : (
        <>
          {thisWeekItems.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-2">本週提交</h3>
              <div className="space-y-2">
                {thisWeekItems.map(item => <KnowledgeCard key={item.id} item={item} isAdmin={isAdmin} expandedId={expandedId} setExpandedId={setExpandedId} reviewNotes={reviewNotes} setReviewNotes={setReviewNotes} showNoteFor={showNoteFor} setShowNoteFor={setShowNoteFor} handleReview={handleReview} linkingFor={linkingFor} setLinkingFor={setLinkingFor} selectedCourses={selectedCourses} setSelectedCourses={setSelectedCourses} handleLinkCourses={handleLinkCourses} />)}
              </div>
            </div>
          )}

          {pastItems.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 text-sm mb-2">過往記錄</h3>
              <div className="space-y-2">
                {pastItems.map(item => <KnowledgeCard key={item.id} item={item} isAdmin={isAdmin} expandedId={expandedId} setExpandedId={setExpandedId} reviewNotes={reviewNotes} setReviewNotes={setReviewNotes} showNoteFor={showNoteFor} setShowNoteFor={setShowNoteFor} handleReview={handleReview} linkingFor={linkingFor} setLinkingFor={setLinkingFor} selectedCourses={selectedCourses} setSelectedCourses={setSelectedCourses} handleLinkCourses={handleLinkCourses} />)}
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📖</div>
              <p className="text-sm">尚未提交任何學習知識</p>
            </div>
          )}
        </>
      )}

      {/* Admin: Pending Review */}
      {isAdmin && allPending.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{allPending.length}</span>
            待審核知識
          </h3>
          <div className="space-y-3">
            {allPending.map(item => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.user_name} · {item.week_start}</div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-3">{item.content}</p>
                    {item.image_url && <img src={item.image_url} alt="" className="mt-2 h-24 rounded-lg object-cover" />}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.map((t, i) => <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  <button onClick={() => setShowNoteFor(showNoteFor === item.id ? null : item.id)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                    <MessageSquare size={11} /> 加入備注
                  </button>
                  {showNoteFor === item.id && (
                    <textarea className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none" rows={2} placeholder="審核備注..." value={reviewNotes[item.id] || ""} onChange={e => setReviewNotes(p => ({...p, [item.id]: e.target.value}))} />
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(item, true)} className="flex-1 text-xs bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> 認證
                    </button>
                    <button onClick={() => handleReview(item, false)} className="flex-1 text-xs bg-red-100 text-red-600 py-1.5 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1">
                      <XCircle size={12} /> 拒絕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KnowledgeCard({ item, isAdmin, expandedId, setExpandedId, reviewNotes, setReviewNotes, showNoteFor, setShowNoteFor, handleReview, linkingFor, setLinkingFor, selectedCourses, setSelectedCourses, handleLinkCourses }) {
  const CATEGORIES = ["管理與領導", "銷售技巧", "IT技能", "財務知識", "溝通技巧", "合規與法律", "產品知識", "其他"];
  const statusColor = {
    "草稿": "bg-gray-100 text-gray-600",
    "待審核": "bg-yellow-100 text-yellow-700",
    "已認證": "bg-green-100 text-green-700",
    "已拒絕": "bg-red-100 text-red-600",
  };
  const expanded = expandedId === item.id;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full text-left p-3" onClick={() => setExpandedId(expanded ? null : item.id)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">{item.title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{item.week_start} · {item.user_name}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[item.status]}`}>{item.status}</span>
            {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-50 pt-3 space-y-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
          {item.image_url && <img src={item.image_url} alt="" className="rounded-lg w-full max-h-60 object-cover" />}
          {item.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.map((t, i) => <span key={i} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>)}
            </div>
          )}
          {item.review_note && <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1.5">審核備注：{item.review_note}</p>}
          {item.linked_courses?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.linked_courses.map((c, i) => <span key={i} className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-0.5"><BookOpen size={10} />{c}</span>)}
            </div>
          )}

          {/* Admin: Link to courses after certifying */}
          {isAdmin && item.status === "已認證" && (
            <div>
              {linkingFor === item.id ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-600">選擇關聯課程分類：</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setSelectedCourses(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c])} className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedCourses.includes(c) ? "bg-blue-100 text-blue-600 border-blue-300" : "bg-white text-gray-500 border-gray-200"}`}>{c}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleLinkCourses(item)} className="flex-1 text-xs bg-blue-500 text-white py-1.5 rounded-lg hover:bg-blue-600">確認關聯</button>
                    <button onClick={() => { setLinkingFor(null); setSelectedCourses([]); }} className="flex-1 text-xs bg-gray-100 text-gray-500 py-1.5 rounded-lg">取消</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setLinkingFor(item.id); setSelectedCourses(item.linked_courses || []); }} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1">
                  <BookOpen size={12} /> {item.linked_courses?.length ? "修改課程關聯" : "加入課程"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}