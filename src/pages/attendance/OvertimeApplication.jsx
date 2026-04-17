import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Minus, Upload, X, AlertCircle } from "lucide-react";

const TABS = [
  { key: "apply", label: "申報頁面" },
  { key: "added", label: "加班紀錄" },
  { key: "history", label: "審批紀錄" },
  { key: "unaccepted", label: "未承接單數" },
];

const OT_TYPES = ["常規加班", "活動加班", "特別加班"];

const NOTICE = [
  "此表格供在區域網絡內的加班申報, 但算工作所産生的加班不算為活動加班",
  "申請前請確保在主管及副主管面前指示並簽名在申報表後才開始加班",
  "申請需經過行政部門審查。結果會在當員工工入天內顯示於OTC",
  "加班時需有15分鐘作為1個單位, 加班申報在30分鐘起計, 某次不足15分鐘亦作15分鐘計算",
];

function ImageUpload({ label, value, onChange }) {
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
  };

  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 block mb-1">{label}</label>
      <div
        className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors min-h-[140px]"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <div className="relative w-full">
            <img src={value} alt="uploaded" className="w-full max-h-56 object-contain rounded-xl" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(""); }}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
            <Upload size={28} />
            <span className="text-xs">上載圖片說明</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

export default function OvertimeApplication() {
  const [activeTab, setActiveTab] = useState("apply");
  const [currentUser, setCurrentUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    ot_date: "",
    ot_type: "",
    activity_name: "",
    start_date: "",
    start_image: "",
    end_date: "",
    end_image: "",
    ot_hours: 0,
    remarks: "",
    status: "審批中",
  });

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const adjustHours = (delta) => {
    setForm(f => ({ ...f, ot_hours: Math.max(0, (f.ot_hours || 0) + delta * 0.25) }));
  };

  const handleSubmit = async () => {
    if (!form.ot_date || !form.ot_type || !form.start_date || !form.end_date) return;
    setSubmitting(true);
    await base44.entities.BubbleOT.create({
      ...form,
      user_email: currentUser?.email,
      user_name: currentUser?.full_name || currentUser?.email,
    });
    setSubmitting(false);
    setSubmitted(true);
    setForm({ ot_date: "", ot_type: "", activity_name: "", start_date: "", start_image: "", end_date: "", end_image: "", ot_hours: 0, remarks: "", status: "審批中" });
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-black text-gray-900">公司活動加班申報</h2>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "apply" && (
        <div className="space-y-4">
          {/* Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
              <span className="text-sm font-bold text-yellow-700">注意事項：</span>
            </div>
            <ol className="space-y-1 pl-5">
              {NOTICE.map((n, i) => (
                <li key={i} className="text-xs text-yellow-800 list-decimal">{n}</li>
              ))}
            </ol>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            {/* Applicant */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                申請同事名 <span className="text-red-500">*</span>
              </label>
              <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700">
                {currentUser?.full_name || currentUser?.email || "載入中..."}
              </div>
            </div>

            {/* OT Date */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                加班日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="請選擇加班日期"
                value={form.ot_date}
                onChange={e => set("ot_date", e.target.value)}
              />
            </div>

            {/* OT Type */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                加班類別 <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white"
                value={form.ot_type}
                onChange={e => set("ot_type", e.target.value)}
              >
                <option value="">請選擇加班類別</option>
                {OT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Activity Name */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">活動名稱</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="輸入活動名稱"
                value={form.activity_name}
                onChange={e => set("activity_name", e.target.value)}
              />
            </div>

            {/* Start Date + Image */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                加班開始時間 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
                value={form.start_date}
                onChange={e => set("start_date", e.target.value)}
              />
              <ImageUpload label="簽到圖片說明" value={form.start_image} onChange={v => set("start_image", v)} />
            </div>

            {/* End Date + Image */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">
                加班結束 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
                value={form.end_date}
                onChange={e => set("end_date", e.target.value)}
              />
              <ImageUpload label="加班結束圖片說明" value={form.end_image} onChange={v => set("end_image", v)} />
            </div>

            {/* OT Hours */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">加班時數</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => adjustHours(-1)}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-2xl font-bold text-gray-900 w-16 text-center">{form.ot_hours}</span>
                <button
                  type="button"
                  onClick={() => adjustHours(1)}
                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
                <span className="text-sm text-gray-500">小時</span>
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">備注</label>
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                rows={2}
                placeholder="填寫備注"
                value={form.remarks}
                onChange={e => set("remarks", e.target.value)}
              />
            </div>

            {/* Status Buttons */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">及狀態:</label>
              <div className="flex gap-2">
                {["審批中", "已批核", "拒絕批核"].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                      form.status === s
                        ? s === "已批核" ? "bg-green-500 text-white border-green-500"
                          : s === "拒絕批核" ? "bg-red-500 text-white border-red-500"
                          : "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            {submitted && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm font-semibold text-center">
                ✅ 申請已成功提交！
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.ot_date || !form.ot_type || !form.start_date || !form.end_date}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "提交中..." : "提交申請"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "added" && (
        <OvertimeRecords userEmail={currentUser?.email} type="added" />
      )}
      {activeTab === "history" && (
        <OvertimeRecords userEmail={currentUser?.email} type="history" />
      )}
      {activeTab === "unaccepted" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p className="text-sm">暫無未承接單數</p>
        </div>
      )}
    </div>
  );
}

function OvertimeRecords({ userEmail, type }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.BubbleOT.filter({ user_email: userEmail }, "-created_date", 50).then(data => {
      setRecords(data);
      setLoading(false);
    });
  }, [userEmail]);

  const statusColor = {
    "審批中": "bg-yellow-100 text-yellow-700",
    "已批核": "bg-green-100 text-green-700",
    "拒絕批核": "bg-red-100 text-red-700",
  };

  if (loading) return <div className="text-center py-10 text-gray-400 text-sm">載入中...</div>;
  if (records.length === 0) return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
      <p className="text-sm">暫無記錄</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {records.map(r => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold text-gray-800 text-sm">{r.activity_name || r.ot_type || "加班申請"}</div>
              <div className="text-xs text-gray-500 mt-0.5">{r.ot_date} · {r.ot_type}</div>
              <div className="text-xs text-gray-400 mt-0.5">加班時數: {r.ot_hours} 小時</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusColor[r.status] || "bg-gray-100 text-gray-500"}`}>
              {r.status || "審批中"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}