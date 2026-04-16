import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, ChevronDown, ChevronRight, Loader2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FIELD_LABELS = {
  display_name: "顯示名稱", full_name: "英文姓名", chinese_name: "中文姓名",
  gender: "性別", date_of_birth: "出生日期", hkid: "身份證", nationality: "國籍",
  marital_status: "婚姻狀況", mobile: "手機", personal_email: "個人電郵", address: "住址",
  bank_name: "銀行", bank_account_number: "銀行帳號", bank_account_holder: "帳戶名稱",
  emergency_contact_name: "緊急聯絡人", emergency_contact_relation: "關係", emergency_contact_phone: "緊急電話",
  education: "學歷", work_experience: "工作經驗", skills: "技能", interests: "興趣", languages: "語言",
};

const PROFILE_FIELDS = Object.keys(FIELD_LABELS);

function DiffRow({ label, oldVal, newVal }) {
  if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;
  const formatVal = (v) => {
    if (Array.isArray(v)) return v.length > 0 ? `[${v.length} 項]` : "（空）";
    return v || "（空）";
  };
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0 text-xs">
      <span className="text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 space-y-0.5">
        <div className="line-through text-red-400">{formatVal(oldVal)}</div>
        <div className="text-green-700 font-semibold">{formatVal(newVal)}</div>
      </div>
    </div>
  );
}

function RequestCard({ request, profile, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleAction = async (action) => {
    setProcessing(true);
    await onAction(request.id, action, reviewNote);
    setProcessing(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {(request.requested_by_name || '?')[0]}
          </div>
          <div>
            <div className="font-bold text-sm text-gray-900">{request.requested_by_name}</div>
            <div className="text-xs text-gray-400">
              申請更新 · {new Date(request.created_date).toLocaleDateString('zh-HK')}
            </div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Diff */}
      {expanded && (
        <div className="px-4 pb-3 border-t border-gray-50">
          <div className="text-xs font-semibold text-gray-500 mt-2 mb-1.5">更改內容對比：</div>
          {PROFILE_FIELDS.map(field => (
            <DiffRow key={field} label={FIELD_LABELS[field]}
              oldVal={profile?.[field]} newVal={request[field]} />
          ))}

          <div className="mt-3">
            <label className="text-xs font-semibold text-gray-600 block mb-1">審批備注（選填）</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows={2} placeholder="填寫備注..." value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={() => handleAction('approve')} disabled={processing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 disabled:opacity-60 transition-colors">
              {processing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              核准
            </button>
            <button onClick={() => handleAction('reject')} disabled={processing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 disabled:opacity-60 transition-colors">
              {processing ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              拒絕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PendingUpdatesPanel({ onClose }) {
  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const loadRequests = async () => {
    setLoading(true);
    const allReqs = await base44.entities.ProfileUpdateRequest.list('-created_date', 100);
    setRequests(allReqs);

    // Load linked profiles
    const profileIds = [...new Set(allReqs.map(r => r.staff_profile_id).filter(Boolean))];
    const profileMap = {};
    await Promise.all(profileIds.map(async id => {
      const p = await base44.entities.StaffProfile.get(id);
      if (p) profileMap[id] = p;
    }));
    setProfiles(profileMap);
    setLoading(false);
  };

  useEffect(() => { loadRequests(); }, []);

  const handleAction = async (requestId, action, reviewNote) => {
    await base44.functions.invoke('approveProfileUpdate', { requestId, action, reviewNote });
    await loadRequests();
  };

  const pendingReqs = requests.filter(r => r.request_status === 'Pending Review');
  const doneReqs = requests.filter(r => r.request_status !== 'Pending Review');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-black text-gray-900 text-base">資料更新申請</h3>
            <p className="text-xs text-gray-400">{pendingReqs.length} 個待審批</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-gray-100 shrink-0">
          <button onClick={() => setTab("pending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Clock size={12} /> 待審批 ({pendingReqs.length})
          </button>
          <button onClick={() => setTab("done")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === 'done' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            已處理 ({doneReqs.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">載入中...</div>
          ) : tab === "pending" ? (
            pendingReqs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CheckCircle size={36} className="mx-auto mb-2 text-green-400 opacity-60" />
                <p className="text-sm">暫無待審批申請</p>
              </div>
            ) : (
              pendingReqs.map(req => (
                <RequestCard key={req.id} request={req} profile={profiles[req.staff_profile_id]}
                  onAction={handleAction} />
              ))
            )
          ) : (
            doneReqs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">暫無已處理申請</div>
            ) : (
              doneReqs.map(req => (
                <div key={req.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{req.requested_by_name}</div>
                      <div className="text-xs text-gray-400">{new Date(req.created_date).toLocaleDateString('zh-HK')}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${req.request_status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {req.request_status === 'Approved' ? '已核准' : '已拒絕'}
                    </span>
                  </div>
                  {req.review_note && (
                    <div className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">備注：{req.review_note}</div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}