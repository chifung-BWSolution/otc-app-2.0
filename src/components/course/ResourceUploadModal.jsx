import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FORMATS = [
  { value: "PPT", label: "PPT / 簡報", needUrl: true, needFile: true },
  { value: "YouTube", label: "YouTube / 短片", needUrl: true, needFile: false },
  { value: "PDF", label: "PDF 文件", needUrl: false, needFile: true },
  { value: "Workbook", label: "Workbook", needUrl: true, needFile: true },
  { value: "圖文筆記", label: "圖文筆記", needUrl: false, needFile: false, needText: true },
  { value: "其他", label: "其他", needUrl: true, needFile: true },
];

export default function ResourceUploadModal({ course, currentUser, onClose, onSaved }) {
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    title: "",
    description: "",
    format: "PDF",
    url: "",
    file_url: "",
    content_text: "",
    difficulty: course?.difficulty || 1,
    duration_minutes: 30,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fmtMeta = FORMATS.find(f => f.value === form.format);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("file_url", file_url);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.title) return;
    setSubmitting(true);
    await base44.entities.CourseResource.create({
      ...form,
      course_id: course.id,
      course_name: course.title,
      category: course.category_name,
      learning_method: course.learning_method,
      status: "待審核",
      uploaded_by: currentUser?.full_name || currentUser?.email,
      uploaded_at: new Date().toISOString(),
    });
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-black text-gray-900">上載學習資源</h3>
            <p className="text-xs text-gray-500 mt-0.5">課程：{course?.title}</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">資源標題 *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => set("title", e.target.value)} placeholder="例：銷售技巧入門 PPT" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">資源類型 *</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMATS.map(f => (
                <button key={f.value} type="button" onClick={() => set("format", f.value)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    form.format === f.value ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {fmtMeta?.needUrl && (
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">
                {form.format === "YouTube" ? "YouTube 網址" : "連結 / URL"}
              </label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.url} onChange={e => set("url", e.target.value)}
                placeholder={form.format === "YouTube" ? "https://youtube.com/..." : "https://..."} />
            </div>
          )}

          {fmtMeta?.needFile && (
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">上載檔案</label>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors disabled:opacity-60">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "上載中..." : form.file_url ? "✓ 已上載，點擊替換" : "點擊上載檔案"}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {fmtMeta?.needText && (
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">圖文筆記內容</label>
              <textarea rows={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                value={form.content_text} onChange={e => set("content_text", e.target.value)}
                placeholder="在此輸入圖文筆記內容..." />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">簡短描述</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">難度</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.difficulty} onChange={e => set("difficulty", Number(e.target.value))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>Level {n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">預計學習時間 (分鐘)</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.duration_minutes} onChange={e => set("duration_minutes", Number(e.target.value))} />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-orange-700">
            ⚠️ 上傳後須等待審核員審核通過才會發佈，審核者及日期會自動記錄。
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 rounded-lg font-bold">取消</button>
          <button onClick={handleSubmit} disabled={submitting || !form.title}
            className="flex-1 py-2 bg-teal-500 text-white rounded-lg font-bold disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            📤 提交審核
          </button>
        </div>
      </div>
    </div>
  );
}