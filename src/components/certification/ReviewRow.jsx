import { useState } from "react";
import { Star, ChevronDown, ChevronUp, Edit3, CheckCircle, XCircle, BookOpen, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const statusColor = {
  "草稿": "bg-gray-100 text-gray-600",
  "待審核": "bg-yellow-100 text-yellow-700",
  "已認證": "bg-green-100 text-green-700",
  "已拒絕": "bg-red-100 text-red-600",
};

function StarRow({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} disabled={disabled} onClick={() => onChange(n)}>
          <Star size={18} className={n <= (value || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
        </button>
      ))}
      <span className="text-xs text-gray-400 ml-1">{value ? `${value}/5` : "未評分"}</span>
    </div>
  );
}

export default function ReviewRow({ item, currentUser, role, courses, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // role: "team_leader" | "admin"
  const myScore = role === "admin" ? item.admin_score : item.team_leader_score;
  const myNote = role === "admin" ? item.admin_note : item.team_leader_note;

  const [score, setScore] = useState(myScore || 0);
  const [note, setNote] = useState(myNote || "");

  // Certify state (admin only)
  const [certTitle, setCertTitle] = useState(item.certified_title || item.title);
  const [certContent, setCertContent] = useState(item.certified_content || item.content);
  const [certImage, setCertImage] = useState(item.certified_image_url || item.image_url || "");
  const [selectedCourseIds, setSelectedCourseIds] = useState(item.certified_course_ids || (item.course_id ? [item.course_id] : []));

  const saveScore = async () => {
    setSaving(true);
    const payload = role === "admin"
      ? {
          admin_score: score,
          admin_note: note,
          admin_reviewed_by: currentUser?.full_name || currentUser?.email,
          admin_reviewed_at: new Date().toISOString(),
        }
      : {
          team_leader_score: score,
          team_leader_note: note,
          team_leader_reviewed_by: currentUser?.full_name || currentUser?.email,
          team_leader_reviewed_at: new Date().toISOString(),
        };
    await base44.entities.KnowledgeItem.update(item.id, payload);
    setSaving(false);
    onRefresh();
  };

  const reject = async () => {
    await base44.entities.KnowledgeItem.update(item.id, {
      status: "已拒絕",
      review_note: note,
    });
    onRefresh();
  };

  const certifyAndPush = async () => {
    setSaving(true);
    // Update the knowledge item as certified
    await base44.entities.KnowledgeItem.update(item.id, {
      status: "已認證",
      certified_title: certTitle,
      certified_content: certContent,
      certified_image_url: certImage,
      certified_course_ids: selectedCourseIds,
      reviewed_by: currentUser?.full_name || currentUser?.email,
      reviewed_at: new Date().toISOString(),
      pushed_as_resource: true,
    });

    // Push as CourseResource for each selected course
    await Promise.all(selectedCourseIds.map(async courseId => {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;
      await base44.entities.CourseResource.create({
        title: certTitle,
        description: `來自 ${item.user_name} 的每週匯報認證知識`,
        course_id: courseId,
        course_name: course.title,
        category: course.category_name,
        format: certImage ? "圖文筆記" : "圖文筆記",
        content_text: certContent,
        file_url: certImage || "",
        learning_method: course.learning_method || "自學",
        status: "已發佈",
        uploaded_by: item.user_name,
        uploaded_at: new Date().toISOString(),
        reviewed_by: currentUser?.full_name || currentUser?.email,
        reviewed_at: new Date().toISOString(),
      });
    }));

    setSaving(false);
    setEditMode(false);
    onRefresh();
  };

  const isAdmin = role === "admin";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* Summary */}
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-gray-900">{item.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[item.status]}`}>{item.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
              <span>👤 {item.user_name}</span>
              <span>📅 {item.week_start}</span>
              {item.category_name && <span className="bg-purple-50 text-purple-600 px-1.5 rounded">{item.category_name}</span>}
              {item.course_name && <span className="bg-blue-50 text-blue-600 px-1.5 rounded">{item.course_name}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="text-purple-600 flex items-center gap-0.5">
                Leader: {item.team_leader_score ? <><Star size={10} className="fill-yellow-400 text-yellow-400" />{item.team_leader_score}</> : "—"}
              </span>
              <span className="text-blue-600 flex items-center gap-0.5">
                Admin: {item.admin_score ? <><Star size={10} className="fill-yellow-400 text-yellow-400" />{item.admin_score}</> : "—"}
              </span>
            </div>
          </div>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
          {/* Original content */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-bold text-gray-500 mb-1">原始匯報內容</div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
            {item.image_url && <img src={item.image_url} alt="" className="mt-2 rounded-lg max-h-48 object-cover" />}
          </div>

          {/* Both reviewers' scores side by side */}
          <div className="grid md:grid-cols-2 gap-2">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-2.5">
              <div className="text-xs font-bold text-purple-700 mb-1">Team Leader 評分</div>
              {item.team_leader_score ? (
                <>
                  <StarRow value={item.team_leader_score} onChange={() => {}} disabled />
                  {item.team_leader_note && <div className="text-xs text-purple-600 mt-1">備註：{item.team_leader_note}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">— {item.team_leader_reviewed_by}</div>
                </>
              ) : <div className="text-xs text-gray-400">未評分</div>}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
              <div className="text-xs font-bold text-blue-700 mb-1">Admin 評分</div>
              {item.admin_score ? (
                <>
                  <StarRow value={item.admin_score} onChange={() => {}} disabled />
                  {item.admin_note && <div className="text-xs text-blue-600 mt-1">備註：{item.admin_note}</div>}
                  <div className="text-xs text-gray-400 mt-0.5">— {item.admin_reviewed_by}</div>
                </>
              ) : <div className="text-xs text-gray-400">未評分</div>}
            </div>
          </div>

          {/* My score input */}
          <div className={`border rounded-lg p-3 ${isAdmin ? "border-blue-200 bg-blue-50/30" : "border-purple-200 bg-purple-50/30"}`}>
            <div className="text-xs font-bold text-gray-700 mb-1.5">
              我的評分 ({isAdmin ? "Admin" : "Team Leader"})
            </div>
            <StarRow value={score} onChange={setScore} />
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs mt-2 resize-none"
              placeholder="評分備註（選填）" value={note} onChange={e => setNote(e.target.value)} />
            <button onClick={saveScore} disabled={saving || score === 0}
              className={`mt-2 text-xs px-3 py-1.5 rounded-lg font-bold disabled:opacity-60 flex items-center gap-1 ${
                isAdmin ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-purple-600 text-white hover:bg-purple-700"
              }`}>
              {saving && <Loader2 size={11} className="animate-spin" />} 儲存評分
            </button>
          </div>

          {/* Admin certification section */}
          {isAdmin && item.status !== "已拒絕" && (
            <div className="border border-green-200 bg-green-50/30 rounded-lg p-3">
              {!editMode ? (
                <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 text-sm font-bold text-green-700 hover:text-green-800">
                  <Edit3 size={13} /> {item.status === "已認證" ? "重新編輯認證知識" : "編輯並認證為課程知識"}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-green-700">認證知識編輯（不影響原匯報）</div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">認證知識標題</label>
                    <input className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm bg-white"
                      value={certTitle} onChange={e => setCertTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">認證知識內容</label>
                    <textarea rows={4} className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm resize-none bg-white"
                      value={certContent} onChange={e => setCertContent(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">圖片 URL（可選）</label>
                    <input className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm bg-white"
                      value={certImage} onChange={e => setCertImage(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">加入至以下課程（可多選）</label>
                    <div className="max-h-36 overflow-y-auto bg-white border border-green-200 rounded-lg p-2 space-y-1">
                      {courses.map(c => (
                        <label key={c.id} className="flex items-center gap-2 text-xs hover:bg-green-50 rounded px-1 py-0.5 cursor-pointer">
                          <input type="checkbox" checked={selectedCourseIds.includes(c.id)}
                            onChange={() => setSelectedCourseIds(s => s.includes(c.id) ? s.filter(x => x !== c.id) : [...s, c.id])} />
                          <span className="text-gray-500">[{c.category_name}]</span>
                          <span>{c.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={certifyAndPush} disabled={saving || !certTitle || !certContent || selectedCourseIds.length === 0}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-1">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      認證並加入課程 ({selectedCourseIds.length})
                    </button>
                    <button onClick={() => setEditMode(false)}
                      className="px-3 py-2 bg-gray-100 rounded-lg text-xs font-bold">取消</button>
                    {item.status === "待審核" && (
                      <button onClick={reject}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1">
                        <XCircle size={12} /> 拒絕
                      </button>
                    )}
                  </div>
                </div>
              )}

              {item.status === "已認證" && item.certified_course_ids?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.certified_course_ids.map(cid => {
                    const c = courses.find(x => x.id === cid);
                    if (!c) return null;
                    return (
                      <span key={cid} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <BookOpen size={10} />{c.title}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}