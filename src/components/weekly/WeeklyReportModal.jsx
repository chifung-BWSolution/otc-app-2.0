import { useState, useEffect, useRef } from "react";
import { X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const emptyReport = () => ({
  category_id: "",
  category_name: "",
  course_id: "",
  course_name: "",
  title: "",
  content: "",
  image_url: "",
});

export default function WeeklyReportModal({ currentUser, weekStart, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([emptyReport()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([
      base44.entities.CourseCategory.filter({ is_active: true }, "sort_order", 100),
      base44.entities.Course.filter({ status: "已發佈" }, "-created_date", 300),
    ]).then(([cats, crs]) => {
      setCategories(cats);
      setCourses(crs);
    });
  }, []);

  const current = reports[activeIdx];
  const setCurrent = (patch) => {
    setReports(rs => rs.map((r, i) => i === activeIdx ? { ...r, ...patch } : r));
  };

  const addReport = () => {
    setReports(rs => [...rs, emptyReport()]);
    setActiveIdx(reports.length);
  };

  const removeReport = (idx) => {
    if (reports.length === 1) return;
    setReports(rs => rs.filter((_, i) => i !== idx));
    setActiveIdx(i => Math.max(0, Math.min(i, reports.length - 2)));
  };

  const handleCategory = (catId) => {
    const cat = categories.find(c => c.id === catId);
    setCurrent({ category_id: catId, category_name: cat?.name || "", course_id: "", course_name: "" });
  };

  const handleCourse = (courseId) => {
    const c = courses.find(x => x.id === courseId);
    setCurrent({ course_id: courseId, course_name: c?.title || "" });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(activeIdx);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCurrent({ image_url: file_url });
    setUploadingIdx(null);
  };

  const canSubmit = reports.every(r => r.category_id && r.title && r.content);

  const handleSubmitAll = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await Promise.all(reports.map(r =>
      base44.entities.KnowledgeItem.create({
        title: r.title,
        content: r.content,
        image_url: r.image_url,
        category_id: r.category_id,
        category_name: r.category_name,
        course_id: r.course_id,
        course_name: r.course_name,
        category: r.category_name,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        week_start: weekStart,
        status: "待審核",
      })
    ));
    setSubmitting(false);
    onSaved();
  };

  const availableCourses = current.category_id
    ? courses.filter(c => c.category_id === current.category_id)
    : [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h3 className="font-black text-gray-900">提交每星期匯報</h3>
            <p className="text-xs text-gray-500 mt-0.5">一次提交多個匯報，每個可以獨立設定知識範疇、分類和圖片</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {/* Report tabs */}
        <div className="px-5 pt-3 border-b pb-3 flex gap-2 overflow-x-auto items-center">
          {reports.map((_, i) => (
            <button key={i} onClick={() => setActiveIdx(i)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeIdx === i ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"
              }`}>
              匯報 {i + 1}
              {reports.length > 1 && (
                <span onClick={(e) => { e.stopPropagation(); removeReport(i); }}
                  className="hover:text-red-300">
                  <X size={11} />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">知識範疇 <span className="text-red-500">*</span></label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white"
              value={current.category_id} onChange={e => handleCategory(e.target.value)}>
              <option value="">選擇知識範疇</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">知識分類 <span className="text-red-500">*</span></label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
              value={current.course_id} onChange={e => handleCourse(e.target.value)}
              disabled={!current.category_id}>
              <option value="">{current.category_id ? "選擇知識分類 (課程)" : "請先選擇知識範疇"}</option>
              {availableCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">標題 <span className="text-red-500">*</span></label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="例：本週學習 React Hook 心得"
              value={current.title} onChange={e => setCurrent({ title: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">內容 <span className="text-red-500">*</span></label>
            <textarea rows={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="詳細描述您的學習或工作內容..."
              value={current.content} onChange={e => setCurrent({ content: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">附加圖片（可選）</label>
            {current.image_url ? (
              <div className="relative inline-block">
                <img src={current.image_url} alt="" className="h-32 rounded-lg object-cover border" />
                <button onClick={() => setCurrent({ image_url: "" })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5">
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploadingIdx !== null}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-purple-300 hover:text-purple-500 transition-colors">
                {uploadingIdx === activeIdx ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={22} />}
                <span className="text-xs">{uploadingIdx === activeIdx ? "上傳中..." : "點擊上傳圖片或拖放"}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t">
          <button onClick={addReport} className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-purple-600">
            <Plus size={13} /> 新增匯報
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold">取消</button>
            <button onClick={handleSubmitAll} disabled={!canSubmit || submitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold disabled:opacity-60 flex items-center gap-2">
              {submitting && <Loader2 size={13} className="animate-spin" />}
              提交全部 ({reports.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}