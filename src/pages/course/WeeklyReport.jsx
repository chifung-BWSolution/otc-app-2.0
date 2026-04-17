import { useState, useEffect } from "react";
import { Plus, FileText, Star, CheckCircle, Clock, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import WeeklyReportModal from "../../components/weekly/WeeklyReportModal";

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

const statusColor = {
  "草稿": "bg-gray-100 text-gray-600",
  "待審核": "bg-yellow-100 text-yellow-700",
  "已認證": "bg-green-100 text-green-700",
  "已拒絕": "bg-red-100 text-red-600",
};

export default function WeeklyReport() {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser?.email) load();
  }, [currentUser]);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.KnowledgeItem.filter(
      { user_email: currentUser.email }, "-created_date", 200
    );
    setItems(data);
    setLoading(false);
  };

  const thisWeek = items.filter(i => i.week_start === weekStart);
  const certifiedCount = items.filter(i => i.status === "已認證").length;
  const pendingCount = items.filter(i => i.status === "待審核").length;

  const groupedByWeek = {};
  items.forEach(i => {
    if (!groupedByWeek[i.week_start]) groupedByWeek[i.week_start] = [];
    groupedByWeek[i.week_start].push(i);
  });
  const weekList = Object.entries(groupedByWeek).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-5 text-white">
        <h2 className="text-lg font-black">每星期匯報</h2>
        <p className="text-sm opacity-90 mt-0.5">{weekStart} 至 {weekEnd}</p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <div className="font-bold text-xl">{thisWeek.length}</div>
            <div className="text-xs opacity-90">本週匯報</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <div className="font-bold text-xl">{pendingCount}</div>
            <div className="text-xs opacity-90">待審核</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center backdrop-blur-sm">
            <div className="font-bold text-xl">{certifiedCount}</div>
            <div className="text-xs opacity-90">已認證</div>
          </div>
        </div>
      </div>

      <button onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow">
        <Plus size={16} /> 提交本週匯報
      </button>

      {/* History by week */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : weekList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-gray-400">
          <FileText size={40} className="mx-auto mb-2 opacity-30" />
          <p>尚未提交任何匯報</p>
        </div>
      ) : (
        weekList.map(([week, reports]) => (
          <div key={week}>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-bold text-gray-500">{week} 至 {getWeekEnd(week)}</div>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{reports.length} 篇</span>
            </div>
            <div className="space-y-2">
              {reports.map(item => (
                <ReportCard key={item.id} item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} />
              ))}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <WeeklyReportModal currentUser={currentUser} weekStart={weekStart}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}

function ReportCard({ item, expanded, onToggle }) {
  const avgScore = ((item.team_leader_score || 0) + (item.admin_score || 0)) / 
    ((item.team_leader_score ? 1 : 0) + (item.admin_score ? 1 : 0) || 1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full text-left px-4 py-3" onClick={onToggle}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {item.category_name && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{item.category_name}</span>}
              {item.course_name && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{item.course_name}</span>}
              {item.image_url && <ImageIcon size={12} className="text-gray-400" />}
            </div>
            <div className="font-semibold text-sm text-gray-900 truncate">{item.title}</div>
            {(item.team_leader_score || item.admin_score) && (
              <div className="flex items-center gap-3 mt-1 text-xs">
                {item.team_leader_score > 0 && (
                  <span className="text-purple-600 flex items-center gap-0.5">
                    Leader: <Star size={11} className="fill-yellow-400 text-yellow-400" /> {item.team_leader_score}
                  </span>
                )}
                {item.admin_score > 0 && (
                  <span className="text-blue-600 flex items-center gap-0.5">
                    Admin: <Star size={11} className="fill-yellow-400 text-yellow-400" /> {item.admin_score}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[item.status]}`}>{item.status}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</p>
          {item.image_url && <img src={item.image_url} alt="" className="rounded-lg w-full max-h-64 object-cover" />}
          {item.team_leader_note && (
            <div className="text-xs bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
              <span className="font-bold text-purple-700">Team Leader 備註：</span>
              <span className="text-purple-600">{item.team_leader_note}</span>
            </div>
          )}
          {item.admin_note && (
            <div className="text-xs bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <span className="font-bold text-blue-700">Admin 備註：</span>
              <span className="text-blue-600">{item.admin_note}</span>
            </div>
          )}
          {item.status === "已認證" && item.pushed_as_resource && (
            <div className="text-xs bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <CheckCircle size={13} className="text-green-600" />
              <span className="text-green-700 font-semibold">已成為認證知識並加入課程</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}