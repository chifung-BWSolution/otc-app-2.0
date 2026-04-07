import { useState, useEffect } from "react";
import { Plus, X, Search, ExternalLink, CreditCard, Calendar, Users, BookOpen, MessageSquare, ChevronRight, Edit2, Play, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIES = ["全部", "生產力工具", "溝通協作", "銷售CRM", "財務會計", "HR管理", "設計創意", "IT安全", "數據分析", "其他"];
const DEPTS = ["市場部", "銷售部", "IT部", "財務部", "人事部", "行政部", "全體"];
const catColor = {
  "生產力工具": "bg-blue-100 text-blue-700", "溝通協作": "bg-purple-100 text-purple-700",
  "銷售CRM": "bg-orange-100 text-orange-700", "財務會計": "bg-green-100 text-green-700",
  "HR管理": "bg-pink-100 text-pink-700", "設計創意": "bg-yellow-100 text-yellow-700",
  "IT安全": "bg-red-100 text-red-700", "數據分析": "bg-teal-100 text-teal-700", "其他": "bg-gray-100 text-gray-600",
};
const statusIcon = {
  "使用中": <span className="flex items-center gap-1"><CheckCircle size={11} className="text-green-500" />使用中</span>,
  "即將到期": <span className="flex items-center gap-1"><AlertCircle size={11} className="text-orange-500" />即將到期</span>,
  "已暫停": <span className="flex items-center gap-1"><Clock size={11} className="text-gray-400" />已暫停</span>,
  "已取消": <span className="flex items-center gap-1"><X size={11} className="text-red-400" />已取消</span>,
};
const platformBadge = { "PC": "🖥️ PC", "Mobile": "📱 Mobile", "Web": "🌐 Web" };

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

// ── App Detail Panel ───────────────────────────────────
function AppDetailPanel({ app, currentUser, onClose, onRefresh }) {
  const [tab, setTab] = useState("info");
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [fbForm, setFbForm] = useState({ type: "問題報告", content: "", priority: "中" });
  const [submitting, setSubmitting] = useState(false);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    base44.entities.AppFeedback.filter({ app_id: app.id }, "-created_date", 50).then(setFeedbacks);
    if (isAdmin) base44.entities.AppFeedback.filter({ app_id: app.id }, "-created_date", 100).then(setAllFeedbacks);
  }, [app.id]);

  const submitFeedback = async () => {
    setSubmitting(true);
    await base44.entities.AppFeedback.create({
      app_id: app.id, app_name: app.name,
      user_email: currentUser.email, user_name: currentUser.full_name,
      ...fbForm,
    });
    setSubmitting(false);
    setShowFeedbackForm(false);
    setFbForm({ type: "問題報告", content: "", priority: "中" });
    base44.entities.AppFeedback.filter({ app_id: app.id }, "-created_date", 50).then(setFeedbacks);
  };

  const replyFeedback = async (fb, reply) => {
    await base44.entities.AppFeedback.update(fb.id, {
      admin_reply: reply, replied_by: currentUser.full_name,
      replied_at: new Date().toLocaleString("zh-HK"), status: "已完成",
    });
    base64 = null;
    if (isAdmin) base44.entities.AppFeedback.filter({ app_id: app.id }, "-created_date", 100).then(setAllFeedbacks);
  };

  const days = daysUntil(app.expiry_date);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-100">
          {app.icon_url ? (
            <img src={app.icon_url} alt="" className="w-14 h-14 rounded-2xl object-cover border border-gray-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">{app.name[0]}</div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-gray-900 text-lg">{app.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor[app.category] || "bg-gray-100 text-gray-600"}`}>{app.category}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">{statusIcon[app.status]}</span>
              {app.platform?.map(p => <span key={p} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{platformBadge[p]}</span>)}
            </div>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {[["info","資訊"],["login","登入"],["learn","學習"],["feedback","意見"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === k ? "text-blue-600 border-b-2 border-blue-500 bg-white" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Info Tab */}
          {tab === "info" && (
            <div className="space-y-3">
              {app.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-bold text-gray-500 mb-1">App 簡介</div>
                  <p className="text-sm text-gray-700">{app.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {app.monthly_cost > 0 && (
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <div className="text-xs text-gray-500 mb-0.5">每月費用</div>
                    <div className="font-bold text-green-700 text-lg">HK${app.monthly_cost}</div>
                  </div>
                )}
                {app.expiry_date && (
                  <div className={`rounded-xl p-3 border ${days !== null && days < 30 ? "bg-orange-50 border-orange-100" : "bg-blue-50 border-blue-100"}`}>
                    <div className="text-xs text-gray-500 mb-0.5">到期日</div>
                    <div className={`font-bold text-sm ${days !== null && days < 30 ? "text-orange-600" : "text-blue-700"}`}>{app.expiry_date}</div>
                    {days !== null && <div className="text-xs text-gray-400">{days > 0 ? `${days}天後到期` : "已到期"}</div>}
                  </div>
                )}
              </div>
              {app.card_last4 && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <CreditCard size={16} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">付款信用卡</div>
                    <div className="text-sm font-semibold text-gray-700">•••• •••• •••• {app.card_last4}</div>
                  </div>
                  {app.auto_renew && <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">自動續期</span>}
                </div>
              )}
              {app.departments?.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1.5"><Users size={12} className="inline mr-1" />分配部門</div>
                  <div className="flex flex-wrap gap-1.5">
                    {app.departments.map((d, i) => <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{d}</span>)}
                  </div>
                </div>
              )}
              {app.workflows && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs font-bold text-gray-500 mb-1">工作流程</div>
                  <p className="text-sm text-gray-700">{app.workflows}</p>
                </div>
              )}
              {app.subscription_plan && <div className="text-xs text-gray-500">訂閱計劃：<span className="font-semibold text-gray-700">{app.subscription_plan}</span></div>}
              {app.contact_person && <div className="text-xs text-gray-500">負責人：<span className="font-semibold text-gray-700">{app.contact_person}</span></div>}
            </div>
          )}

          {/* Login Tab */}
          {tab === "login" && (
            <div className="space-y-3">
              {isAdmin ? (
                <>
                  {app.login_url && (
                    <a href={app.login_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3 hover:bg-blue-100 transition-colors">
                      <ExternalLink size={16} className="text-blue-500" />
                      <div>
                        <div className="text-xs text-gray-500">登入網址</div>
                        <div className="text-sm font-semibold text-blue-600">{app.login_url}</div>
                      </div>
                    </a>
                  )}
                  {app.login_account && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-0.5">帳號</div>
                      <div className="text-sm font-mono font-semibold text-gray-800">{app.login_account}</div>
                    </div>
                  )}
                  {app.login_note && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                      <div className="text-xs font-bold text-yellow-700 mb-1">登入備注</div>
                      <p className="text-sm text-gray-700">{app.login_note}</p>
                    </div>
                  )}
                  {!app.login_url && !app.login_account && <p className="text-sm text-gray-400 text-center py-6">尚未設定登入資料</p>}
                </>
              ) : (
                <div className="text-center py-8">
                  {app.login_url ? (
                    <a href={app.login_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                      <ExternalLink size={16} /> 前往登入
                    </a>
                  ) : <p className="text-sm text-gray-400">請聯絡行政同事獲取登入資料</p>}
                </div>
              )}
            </div>
          )}

          {/* Learn Tab */}
          {tab === "learn" && (
            <div className="space-y-3">
              {app.learning_resources?.length > 0 ? (
                app.learning_resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-shadow group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${r.type === "YouTube" ? "bg-red-100" : "bg-blue-100"}`}>
                      {r.type === "YouTube" ? <Play size={16} className="text-red-500" /> : <BookOpen size={16} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">{r.title}</div>
                      <div className="text-xs text-gray-400">{r.type}</div>
                    </div>
                    <ExternalLink size={13} className="text-gray-300 group-hover:text-blue-400 shrink-0" />
                  </a>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">尚無學習資源</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {tab === "feedback" && (
            <div className="space-y-3">
              <button onClick={() => setShowFeedbackForm(!showFeedbackForm)} className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600 transition-colors">
                <Plus size={15} /> 提交意見給行政
              </button>
              {showFeedbackForm && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">類型</label>
                      <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={fbForm.type} onChange={e => setFbForm({...fbForm, type: e.target.value})}>
                        {["問題報告","功能建議","使用疑問","其他"].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">優先級</label>
                      <select className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={fbForm.priority} onChange={e => setFbForm({...fbForm, priority: e.target.value})}>
                        {["低","中","高"].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300" rows={3} placeholder="詳細描述..." value={fbForm.content} onChange={e => setFbForm({...fbForm, content: e.target.value})} />
                  <div className="flex gap-2">
                    <button onClick={submitFeedback} disabled={submitting || !fbForm.content} className="flex-1 bg-teal-500 text-white py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60">
                      {submitting ? "提交中..." : "提交"}
                    </button>
                    <button onClick={() => setShowFeedbackForm(false)} className="flex-1 bg-gray-200 text-gray-600 py-1.5 rounded-lg text-xs">取消</button>
                  </div>
                </div>
              )}

              {/* Feedback list */}
              {(isAdmin ? allFeedbacks : feedbacks).map(fb => (
                <FeedbackCard key={fb.id} fb={fb} isAdmin={isAdmin} currentUser={currentUser} onReply={replyFeedback} />
              ))}
              {feedbacks.length === 0 && !showFeedbackForm && (
                <p className="text-center text-sm text-gray-400 py-6">尚無意見</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({ fb, isAdmin, currentUser, onReply }) {
  const [reply, setReply] = useState("");
  const [showReply, setShowReply] = useState(false);
  const priorityColor = { "低": "bg-gray-100 text-gray-500", "中": "bg-yellow-100 text-yellow-600", "高": "bg-red-100 text-red-600" };
  const statusColor = { "待跟進": "bg-orange-100 text-orange-600", "處理中": "bg-blue-100 text-blue-600", "已完成": "bg-green-100 text-green-600" };
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-700">{fb.type}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor[fb.priority]}`}>{fb.priority}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[fb.status]}`}>{fb.status}</span>
        <span className="text-xs text-gray-400 ml-auto">{fb.user_name}</span>
      </div>
      <p className="text-sm text-gray-700">{fb.content}</p>
      {fb.admin_reply && (
        <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-xs text-blue-700">
          <span className="font-bold">行政回覆：</span>{fb.admin_reply}
        </div>
      )}
      {isAdmin && fb.status !== "已完成" && (
        showReply ? (
          <div className="space-y-1">
            <textarea className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none" rows={2} placeholder="回覆..." value={reply} onChange={e => setReply(e.target.value)} />
            <div className="flex gap-1">
              <button onClick={() => onReply(fb, reply)} disabled={!reply} className="flex-1 text-xs bg-blue-500 text-white py-1 rounded-lg">回覆</button>
              <button onClick={() => setShowReply(false)} className="flex-1 text-xs bg-gray-100 text-gray-500 py-1 rounded-lg">取消</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowReply(true)} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
            <MessageSquare size={11} /> 回覆
          </button>
        )
      )}
    </div>
  );
}

// ── Create/Edit App Modal ─────────────────────────────
function AppFormModal({ app, onClose, onSaved }) {
  const isEdit = !!app;
  const empty = { name: "", category: "生產力工具", platform: [], description: "", departments: [], workflows: "", login_url: "", login_account: "", login_note: "", subscription_plan: "", monthly_cost: "", card_last4: "", expiry_date: "", auto_renew: false, status: "使用中", contact_person: "", icon_url: "", learning_resources: [] };
  const [form, setForm] = useState(isEdit ? { ...empty, ...app } : empty);
  const [saving, setSaving] = useState(false);
  const [newResource, setNewResource] = useState({ title: "", url: "", type: "YouTube" });

  const toggleArr = (key, val) => setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const addResource = () => {
    if (!newResource.title || !newResource.url) return;
    setForm(f => ({ ...f, learning_resources: [...(f.learning_resources || []), { ...newResource }] }));
    setNewResource({ title: "", url: "", type: "YouTube" });
  };

  const save = async () => {
    setSaving(true);
    const data = { ...form, monthly_cost: Number(form.monthly_cost) || 0 };
    if (isEdit) await base44.entities.CompanyApp.update(app.id, data);
    else await base44.entities.CompanyApp.create(data);
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900">{isEdit ? "編輯 App" : "新增 App"}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">App名稱 *</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">分類 *</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">圖標URL（選填）</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="https://..." value={form.icon_url} onChange={e => setForm({...form, icon_url: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">平台</label>
            <div className="flex gap-2">
              {["PC","Mobile","Web"].map(p => (
                <button key={p} onClick={() => toggleArr("platform", p)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.platform?.includes(p) ? "bg-blue-100 text-blue-600 border-blue-300" : "bg-white text-gray-500 border-gray-200"}`}>{platformBadge[p]}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">App簡介</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1.5">分配部門</label>
            <div className="flex flex-wrap gap-1.5">
              {DEPTS.map(d => (
                <button key={d} onClick={() => toggleArr("departments", d)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${form.departments?.includes(d) ? "bg-purple-100 text-purple-600 border-purple-300" : "bg-white text-gray-500 border-gray-200"}`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">工作流程說明</label>
            <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" rows={2} value={form.workflows} onChange={e => setForm({...form, workflows: e.target.value})} />
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-bold text-gray-500 mb-2">🔐 登入資料</div>
            <div className="space-y-2">
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="登入網址" value={form.login_url} onChange={e => setForm({...form, login_url: e.target.value})} />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="帳號" value={form.login_account} onChange={e => setForm({...form, login_account: e.target.value})} />
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="登入備注" value={form.login_note} onChange={e => setForm({...form, login_note: e.target.value})} />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-bold text-gray-500 mb-2">💳 訂閱及付款</div>
            <div className="grid grid-cols-2 gap-2">
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="訂閱計劃" value={form.subscription_plan} onChange={e => setForm({...form, subscription_plan: e.target.value})} />
              <input type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="每月費用(HKD)" value={form.monthly_cost} onChange={e => setForm({...form, monthly_cost: e.target.value})} />
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder="信用卡後4位" maxLength={4} value={form.card_last4} onChange={e => setForm({...form, card_last4: e.target.value})} />
              <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="autorenew" checked={form.auto_renew} onChange={e => setForm({...form, auto_renew: e.target.checked})} className="rounded" />
              <label htmlFor="autorenew" className="text-xs text-gray-600">自動續期</label>
              <select className="ml-auto border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {["使用中","即將到期","已暫停","已取消"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">負責人</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} />
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-bold text-gray-500 mb-2">📚 學習資源</div>
            {(form.learning_resources || []).map((r, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5 text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                <span className="flex-1 truncate font-medium">{r.title}</span>
                <span className="text-gray-400">{r.type}</span>
                <button onClick={() => setForm(f => ({ ...f, learning_resources: f.learning_resources.filter((_, j) => j !== i) }))}><X size={12} className="text-red-400" /></button>
              </div>
            ))}
            <div className="flex gap-1.5 mt-2">
              <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" placeholder="標題" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} />
              <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" placeholder="URL" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} />
              <select className="border border-gray-200 rounded-lg px-1 py-1.5 text-xs focus:outline-none" value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})}>
                {["YouTube","文件","教學","其他"].map(t => <option key={t}>{t}</option>)}
              </select>
              <button onClick={addResource} className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs hover:bg-blue-600"><Plus size={13} /></button>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100">
          <button onClick={save} disabled={saving || !form.name} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors">
            {saving ? "儲存中..." : isEdit ? "儲存更改" : "新增 App"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function AppStore() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("全部");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editApp, setEditApp] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    const data = await base44.entities.CompanyApp.list("-created_date", 100);
    setApps(data);
    setLoading(false);
  };

  const isAdmin = currentUser?.role === "admin";

  const filtered = apps.filter(a =>
    (catFilter === "全部" || a.category === catFilter) &&
    (a.name?.toLowerCase().includes(search.toLowerCase()) || a.description?.includes(search))
  );

  const expiringApps = apps.filter(a => { const d = daysUntil(a.expiry_date); return d !== null && d <= 30 && d >= 0; });
  const totalMonthly = apps.filter(a => a.status === "使用中").reduce((s, a) => s + (a.monthly_cost || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-xl font-bold text-blue-600">{apps.filter(a => a.status === "使用中").length}</div>
          <div className="text-xs text-gray-500">使用中</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-xl font-bold text-green-600">HK${totalMonthly.toLocaleString()}</div>
          <div className="text-xs text-gray-500">每月總費用</div>
        </div>
        <div className={`rounded-xl p-3 text-center border ${expiringApps.length > 0 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
          <div className={`text-xl font-bold ${expiringApps.length > 0 ? "text-orange-500" : "text-gray-400"}`}>{expiringApps.length}</div>
          <div className="text-xs text-gray-500">即將到期</div>
        </div>
      </div>

      {/* Expiry warnings */}
      {expiringApps.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
          <div className="text-xs font-bold text-orange-700 mb-1.5">⚠️ 即將到期</div>
          {expiringApps.map(a => (
            <div key={a.id} className="text-xs text-orange-600 flex items-center justify-between">
              <span>{a.name}</span><span>{daysUntil(a.expiry_date)}天後到期 ({a.expiry_date})</span>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-36">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50" placeholder="搜尋App..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {isAdmin && (
          <button onClick={() => { setEditApp(null); setShowForm(true); }} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            <Plus size={14} /> 新增App
          </button>
        )}
      </div>

      {/* App Grid */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-2">📱</div>
          <p className="text-sm">{isAdmin ? "尚未新增任何App，點擊右上角新增" : "暫無可用App"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(app => {
            const days = daysUntil(app.expiry_date);
            return (
              <button key={app.id} onClick={() => setSelectedApp(app)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-3">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shrink-0">{app.name?.[0]}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{app.name}</span>
                      {isAdmin && (
                        <button onClick={e => { e.stopPropagation(); setEditApp(app); setShowForm(true); }} className="ml-auto p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded">
                          <Edit2 size={12} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${catColor[app.category] || "bg-gray-100 text-gray-600"}`}>{app.category}</span>
                      {app.platform?.map(p => <span key={p} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{platformBadge[p]}</span>)}
                    </div>
                    {app.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{app.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-400 font-medium">{statusIcon[app.status]}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {app.monthly_cost > 0 && <span className="text-green-600 font-semibold">HK${app.monthly_cost}/月</span>}
                        {days !== null && days <= 30 && days >= 0 && <span className="text-orange-500 font-semibold">{days}天後到期</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedApp && (
        <AppDetailPanel app={selectedApp} currentUser={currentUser} onClose={() => setSelectedApp(null)} onRefresh={loadApps} />
      )}
      {showForm && (
        <AppFormModal app={editApp} onClose={() => { setShowForm(false); setEditApp(null); }} onSaved={() => { setShowForm(false); setEditApp(null); loadApps(); }} />
      )}
    </div>
  );
}