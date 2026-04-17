import { useState, useEffect } from "react";
import { Search, FileText, Filter, Award, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReviewRow from "../../components/certification/ReviewRow";

const TABS = [
  { key: "pending", label: "待審核", color: "text-yellow-600" },
  { key: "scored", label: "已評分", color: "text-blue-600" },
  { key: "certified", label: "已認證", color: "text-green-600" },
  { key: "rejected", label: "已拒絕", color: "text-red-600" },
  { key: "all", label: "全部", color: "text-gray-600" },
];

export default function KnowledgeCertification() {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (currentUser) load();
  }, [currentUser]);

  const load = async () => {
    setLoading(true);
    const [data, cats, crs] = await Promise.all([
      base44.entities.KnowledgeItem.list("-created_date", 500),
      base44.entities.CourseCategory.filter({ is_active: true }, "sort_order", 100),
      base44.entities.Course.filter({ status: "已發佈" }, "-created_date", 300),
    ]);
    setItems(data);
    setCategories(cats);
    setCourses(crs);
    setLoading(false);
  };

  const role = currentUser?.role === "admin" || currentUser?.role === "management" ? "admin" : "team_leader";

  // Tab filtering
  const byTab = items.filter(i => {
    if (tab === "pending") return i.status === "待審核" && !(role === "admin" ? i.admin_score : i.team_leader_score);
    if (tab === "scored") return (role === "admin" ? i.admin_score : i.team_leader_score) > 0 && i.status !== "已認證";
    if (tab === "certified") return i.status === "已認證";
    if (tab === "rejected") return i.status === "已拒絕";
    return true;
  });

  const filtered = byTab.filter(i => {
    const matchSearch = !search || i.title?.includes(search) || i.content?.includes(search) || i.user_name?.includes(search);
    const matchCat = !catFilter || i.category_id === catFilter;
    return matchSearch && matchCat;
  });

  const stats = {
    pending: items.filter(i => i.status === "待審核").length,
    certified: items.filter(i => i.status === "已認證").length,
    total: items.length,
    reviewers: new Set(items.map(i => i.user_email)).size,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black text-gray-900">知識認證中心</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            統一審核每週匯報，你的身份：
            <span className={`ml-1 font-bold ${role === "admin" ? "text-blue-600" : "text-purple-600"}`}>
              {role === "admin" ? "Admin / Management" : "Team Leader"}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="總匯報" value={stats.total} color="gray" />
        <StatCard icon={Filter} label="待審核" value={stats.pending} color="yellow" />
        <StatCard icon={Award} label="已認證" value={stats.certified} color="green" />
        <StatCard icon={Users} label="參與同事" value={stats.reviewers} color="blue" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
            placeholder="搜尋標題、內容、同事..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">全部知識範疇</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
              tab === t.key ? `bg-white shadow ${t.color}` : "text-gray-500"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-gray-400">
          <FileText size={40} className="mx-auto mb-2 opacity-30" />
          <p>暫無匯報</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <ReviewRow key={item.id} item={item} currentUser={currentUser} role={role}
              courses={courses} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    gray: "bg-gray-50 text-gray-600 border-gray-100",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
    green: "bg-green-50 text-green-600 border-green-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };
  return (
    <div className={`rounded-xl p-4 border ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-1">{label}</div>
          <div className="text-2xl font-black">{value}</div>
        </div>
        <Icon size={22} className="opacity-60" />
      </div>
    </div>
  );
}