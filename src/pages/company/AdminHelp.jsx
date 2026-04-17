import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Lightbulb, ClipboardList } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRegion } from "@/lib/RegionContext";
import RegionBadge from "@/components/RegionBadge";

const requestTypes = [
  { value: "facility", label: "設施維修", icon: "🔧", desc: "冷氣、燈光、傢俬等辦公室設施問題" },
  { value: "equipment", label: "設備申請", icon: "🖥️", desc: "電腦、電話、辦公用品等設備需求" },
  { value: "cleaning", label: "清潔服務", icon: "🧹", desc: "特別清潔或衛生問題" },
  { value: "access", label: "門禁/權限", icon: "🔑", desc: "門禁卡、系統權限等申請" },
  { value: "printing", label: "文件/打印", icon: "🖨️", desc: "打印、掃描、文件處理需求" },
  { value: "travel", label: "出行安排", icon: "🚗", desc: "公務車、交通安排等" },
  { value: "suggestion", label: "改善意見", icon: "💡", desc: "對公司的建議或改善意見" },
  { value: "other", label: "其他", icon: "📋", desc: "其他行政協助需求" },
];

const urgencyOptions = [
  { value: "urgent", label: "緊急", color: "border-red-400 bg-red-50 text-red-700", icon: <AlertTriangle size={16} className="text-red-500" /> },
  { value: "normal", label: "普通", color: "border-blue-300 bg-blue-50 text-blue-700", icon: <ClipboardList size={16} className="text-blue-500" /> },
  { value: "suggestion", label: "改善意見", color: "border-yellow-300 bg-yellow-50 text-yellow-700", icon: <Lightbulb size={16} className="text-yellow-500" /> },
];

const statusColor = { 處理中: "bg-blue-100 text-blue-700", 待處理: "bg-yellow-100 text-yellow-700", 已接收: "bg-gray-100 text-gray-600", 已完成: "bg-green-100 text-green-700", 已取消: "bg-gray-100 text-gray-500" };
const urgencyBadge = { urgent: "bg-red-100 text-red-600", normal: "bg-blue-100 text-blue-600", suggestion: "bg-yellow-100 text-yellow-600" };
const urgencyLabel = { urgent: "緊急", normal: "普通", suggestion: "改善意見" };

export default function AdminHelp() {
  const { currentRegion } = useRegion();
  const [step, setStep] = useState(1); // 1=type, 2=form, 3=done
  const [selectedType, setSelectedType] = useState(null);
  const [urgency, setUrgency] = useState("normal");
  const [form, setForm] = useState({ title: "", details: "", location: "", contact: "" });
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    base44.auth.me().then(u => { setCurrentUser(u); loadMine(u); }).catch(() => {});
  }, []);

  const loadMine = async (u) => {
    const data = await base44.entities.AdminHelpRequest.filter({ user_email: u.email }, "-created_date", 20);
    setMyRequests(data);
  };

  const urgencyMap = { urgent: "高", normal: "中", suggestion: "低" };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.details.trim() || !currentUser) return;
    setSubmitting(true);
    await base44.entities.AdminHelpRequest.create({
      user_email: currentUser.email,
      user_name: currentUser.full_name || currentUser.email,
      region_code: currentRegion?.code || "",
      request_type: selectedType.label,
      title: form.title,
      description: form.details + (form.location ? `\n地點：${form.location}` : "") + (form.contact ? `\n聯絡：${form.contact}` : ""),
      urgency: urgencyMap[urgency] || "中",
      status: "待處理",
    });
    setSubmitting(false);
    setStep(3);
    loadMine(currentUser);
  };

  const reset = () => {
    setStep(1);
    setSelectedType(null);
    setUrgency("normal");
    setForm({ title: "", details: "", location: "", contact: "" });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">

      {/* Step 3: Success */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={36} className="text-green-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900">申請已提交！</h2>
          <p className="text-gray-500 mt-2 text-sm">行政部已收到您的申請，將盡快跟進。</p>
          {urgency === "urgent" && (
            <p className="text-red-500 text-sm font-semibold mt-2">⚡ 緊急申請將優先處理</p>
          )}
          <button onClick={reset} className="mt-6 bg-blue-500 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition-colors text-sm">
            再次提交
          </button>
        </div>
      )}

      {/* Step 1: Select type */}
      {step === 1 && (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-black">🛎️ 行政協助申請</h2>
              <RegionBadge className="bg-white/20 !text-white" />
            </div>
            <p className="text-sm opacity-80 mt-1">請選擇您需要的協助類型，或提交公司改善意見。</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {requestTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => { setSelectedType(t); setUrgency(t.value === "suggestion" ? "suggestion" : "normal"); setStep(2); }}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left group"
              >
                <div className="text-3xl mb-2">{t.icon}</div>
                <div className="font-bold text-sm text-gray-800 group-hover:text-blue-600">{t.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-snug">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Recent requests */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-700 mb-3 text-sm">📋 我的申請記錄</h3>
            {myRequests.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400">暫無記錄</div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b last:border-0 border-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800 truncate">{r.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{r.urgency}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{r.request_type} · {new Date(r.created_date).toLocaleDateString("zh-HK")}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statusColor[r.status] || "bg-gray-100"}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Step 2: Fill form */}
      {step === 2 && selectedType && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            ← 返回
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedType.icon}</span>
              <div>
                <h2 className="font-black text-gray-900">{selectedType.label}</h2>
                <p className="text-xs text-gray-500">{selectedType.desc}</p>
              </div>
            </div>

            {/* Urgency selector — hide for suggestion type */}
            {selectedType.value !== "suggestion" && (
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-2">優先級別</label>
                <div className="grid grid-cols-2 gap-2">
                  {urgencyOptions.filter((u) => u.value !== "suggestion").map((u) => (
                    <button
                      key={u.value}
                      onClick={() => setUrgency(u.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-semibold text-sm ${urgency === u.value ? u.color + " border-2" : "border-gray-200 bg-white text-gray-600"}`}
                    >
                      {u.icon} {u.label}
                    </button>
                  ))}
                </div>
                {urgency === "urgent" && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertTriangle size={12} /> 緊急申請將通知行政部即時跟進</p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">
                {selectedType.value === "suggestion" ? "意見標題" : "申請標題"} <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder={selectedType.value === "suggestion" ? "請簡要描述您的意見..." : "請簡要說明需要的協助..."}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">
                {selectedType.value === "suggestion" ? "詳細內容" : "詳細說明"} <span className="text-red-400">*</span>
              </label>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                rows={4}
                placeholder={selectedType.value === "suggestion" ? "請詳細說明您的建議，例如現有問題、改善方案..." : "請詳細描述問題或需求，包括發生時間、具體情況等..."}
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
              />
            </div>

            {selectedType.value !== "suggestion" && (
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-1">位置/地點</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="例如：3樓會議室A、前台、茶水間..."
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">聯絡方式（選填）</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="電話或WhatsApp，方便行政部跟進"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.title.trim() || !form.details.trim()}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "提交中..." : urgency === "urgent" ? "🚨 緊急提交" : "✅ 提交申請"}
              </button>
              <button onClick={() => setStep(1)} className="px-5 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}