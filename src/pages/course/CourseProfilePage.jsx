import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Star, Users, Target, BookOpen, Plus, CheckCircle, XCircle, ExternalLink, FileText, Film, FileIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ResourceUploadModal from "../../components/course/ResourceUploadModal";

const diffColor = ["", "bg-green-100 text-green-700", "bg-lime-100 text-lime-700", "bg-yellow-100 text-yellow-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];

const formatIcon = {
  PPT: FileText,
  YouTube: Film,
  PDF: FileIcon,
  Workbook: BookOpen,
  圖文筆記: ImageIcon,
  其他: FileIcon,
};

const formatLabel = {
  PPT: "PPT / 簡報",
  YouTube: "YouTube / 短片",
  PDF: "PDF 文件",
  Workbook: "Workbook",
  圖文筆記: "圖文筆記",
  其他: "其他",
};

export default function CourseProfilePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [category, setCategory] = useState(null);
  const [resources, setResources] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [tab, setTab] = useState("info");

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "management";

  useEffect(() => { load(); }, [courseId]);

  const load = async () => {
    setLoading(true);
    const [me, c] = await Promise.all([
      base44.auth.me(),
      base44.entities.Course.get(courseId),
    ]);
    setCurrentUser(me);
    setCourse(c);
    const [cat, res] = await Promise.all([
      c?.category_id ? base44.entities.CourseCategory.get(c.category_id) : Promise.resolve(null),
      base44.entities.CourseResource.filter({ course_id: courseId }, "-created_date", 200),
    ]);
    setCategory(cat);
    setResources(res);
    setLoading(false);
  };

  const handleReview = async (id, approve) => {
    await base44.entities.CourseResource.update(id, {
      status: approve ? "已發佈" : "已拒絕",
      reviewed_by: currentUser?.full_name || currentUser?.email,
      reviewed_at: new Date().toISOString(),
    });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="animate-spin text-teal-500" size={28} />
      </div>
    );
  }

  if (!course) return <div className="text-center py-20 text-gray-400">找不到課程</div>;

  // Group resources by format
  const visibleResources = isAdmin ? resources : resources.filter(r => r.status === "已發佈");
  const groupedResources = {};
  ["PPT", "YouTube", "PDF", "Workbook", "圖文筆記", "其他"].forEach(f => {
    groupedResources[f] = visibleResources.filter(r => r.format === f);
  });
  const pendingCount = resources.filter(r => r.status === "待審核").length;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Back */}
      <button onClick={() => navigate("/course/center")}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-teal-600 transition-colors">
        <ArrowLeft size={14} /> 返回課程中心
      </button>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${category?.color || "#14b8a6"}, ${category?.color ? category.color + "cc" : "#0d9488"})` }} />
        <div className="p-5 -mt-8">
          {course.cover_image ? (
            <img src={course.cover_image} alt="" className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow flex items-center justify-center text-4xl mb-3">
              {category?.icon || "📚"}
            </div>
          )}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{category?.name || "未分類"}</span>
                {course.code && <span className="text-xs text-gray-400 font-mono">{course.code}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor[course.difficulty] || "bg-gray-100"}`}>
                  <Star size={10} className="inline mr-0.5" /> Level {course.difficulty}
                </span>
              </div>
              <h1 className="text-2xl font-black text-gray-900">{course.title}</h1>
              {course.description && <p className="text-sm text-gray-600 mt-2">{course.description}</p>}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {course.duration_hours && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <Clock size={14} className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">學習時間</div>
                  <div className="text-sm font-bold">{course.duration_hours} 小時</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <BookOpen size={14} className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-400">學習方式</div>
                <div className="text-sm font-bold">{course.learning_method}</div>
              </div>
            </div>
            {course.target_audience && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <Users size={14} className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">目標對象</div>
                  <div className="text-sm font-bold truncate">{course.target_audience}</div>
                </div>
              </div>
            )}
            {course.has_assessment && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <Target size={14} className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400">考核合格分</div>
                  <div className="text-sm font-bold">{course.passing_score} 分</div>
                </div>
              </div>
            )}
          </div>

          {course.service_units?.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-gray-400 mb-1.5">服務單位</div>
              <div className="flex flex-wrap gap-1.5">
                {course.service_units.map((u, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{u}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab("info")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === "info" ? "bg-white shadow text-teal-600" : "text-gray-500"}`}>
          課程資料
        </button>
        <button onClick={() => setTab("resources")}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5 ${tab === "resources" ? "bg-white shadow text-teal-600" : "text-gray-500"}`}>
          學習資源 <span className="text-xs bg-gray-200 text-gray-600 px-1.5 rounded-full">{visibleResources.length}</span>
          {isAdmin && pendingCount > 0 && <span className="text-xs bg-orange-500 text-white px-1.5 rounded-full">{pendingCount}</span>}
        </button>
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        <div className="grid md:grid-cols-2 gap-4">
          {course.objectives?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Target size={15} className="text-teal-500" /> 學習目標</h3>
              <ul className="space-y-2">
                {course.objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.prerequisites && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-2">先修條件</h3>
              <p className="text-sm text-gray-600">{course.prerequisites}</p>
            </div>
          )}

          {course.instructors?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">導師</h3>
              <div className="flex flex-wrap gap-2">
                {course.instructors.map((i, idx) => (
                  <span key={idx} className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{i}</span>
                ))}
              </div>
            </div>
          )}

          {course.tags?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">標籤</h3>
              <div className="flex flex-wrap gap-1.5">
                {course.tags.map((t, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">#{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resources Tab */}
      {tab === "resources" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              每次上載的資源都須經審核通過才會公開
            </div>
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-600">
              <Plus size={14} /> 上載學習資源
            </button>
          </div>

          {["PPT", "YouTube", "PDF", "Workbook", "圖文筆記", "其他"].map(fmt => {
            const list = groupedResources[fmt];
            if (list.length === 0) return null;
            const Icon = formatIcon[fmt];
            return (
              <div key={fmt} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3">
                  <Icon size={15} className="text-teal-500" /> {formatLabel[fmt]}
                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-normal">{list.length}</span>
                </h4>
                <div className="space-y-2">
                  {list.map(r => <ResourceRow key={r.id} resource={r} isAdmin={isAdmin} onReview={handleReview} />)}
                </div>
              </div>
            );
          })}

          {visibleResources.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
              <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
              <p>暫無學習資源</p>
            </div>
          )}
        </div>
      )}

      {showUpload && (
        <ResourceUploadModal course={course} currentUser={currentUser}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); load(); }} />
      )}
    </div>
  );
}

function ResourceRow({ resource: r, isAdmin, onReview }) {
  const uploadedDate = r.uploaded_at || r.created_date;
  const reviewDate = r.reviewed_at;

  return (
    <div className={`border rounded-lg p-3 ${r.status === "待審核" ? "border-orange-200 bg-orange-50/30" : r.status === "已拒絕" ? "border-red-200 bg-red-50/30" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-semibold text-gray-900 text-sm">{r.title}</h5>
            {r.status === "待審核" && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">待審核</span>}
            {r.status === "已拒絕" && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">已拒絕</span>}
          </div>
          {r.description && <p className="text-xs text-gray-500 mt-1">{r.description}</p>}
          {r.content_text && r.format === "圖文筆記" && (
            <p className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border border-gray-100 whitespace-pre-wrap line-clamp-3">{r.content_text}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
            <span>👤 {r.uploaded_by || "—"}</span>
            <span>📅 上載：{uploadedDate ? new Date(uploadedDate).toLocaleDateString("zh-HK") : "—"}</span>
            {r.duration_minutes && <span>⏱ {r.duration_minutes} 分鐘</span>}
            {r.status === "已發佈" && r.reviewed_by && (
              <span className="text-green-600">✓ {r.reviewed_by} 審核於 {reviewDate ? new Date(reviewDate).toLocaleDateString("zh-HK") : "—"}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-1 items-end">
          {(r.url || r.file_url) && (
            <a href={r.url || r.file_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-semibold">
              <ExternalLink size={12} /> 開啟
            </a>
          )}
          {isAdmin && r.status === "待審核" && (
            <div className="flex gap-1">
              <button onClick={() => onReview(r.id, true)}
                className="flex items-center gap-0.5 text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                <CheckCircle size={11} /> 通過
              </button>
              <button onClick={() => onReview(r.id, false)}
                className="flex items-center gap-0.5 text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">
                <XCircle size={11} /> 拒絕
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}