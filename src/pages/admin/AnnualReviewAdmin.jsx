import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, Search, Eye, Users, X } from "lucide-react";
import AnnualReviewDetail from "@/components/annual-review/AnnualReviewDetail";
import MultiSelectDropdown from "@/components/report/MultiSelectDropdown";

export default function AnnualReviewAdmin() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fyFilter, setFyFilter] = useState("all");
  const [buFilter, setBuFilter] = useState([]);
  const [teamFilter, setTeamFilter] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const all = await base44.entities.AnnualReview.filter({}, "-created_date", 500);
    setReviews(all);
    setLoading(false);
  };

  const fyList = useMemo(() => [...new Set(reviews.map(r => r.fiscal_year).filter(Boolean))].sort().reverse(), [reviews]);
  const buList = useMemo(() => [...new Set(reviews.map(r => r.staff_bu).filter(Boolean))].sort(), [reviews]);
  const teamList = useMemo(() => {
    const src = buFilter.length > 0 ? reviews.filter(r => buFilter.includes(r.staff_bu)) : reviews;
    return [...new Set(src.map(r => r.staff_team).filter(Boolean))].sort();
  }, [reviews, buFilter]);

  const filtered = reviews.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (fyFilter !== "all" && r.fiscal_year !== fyFilter) return false;
    if (buFilter.length > 0 && !buFilter.includes(r.staff_bu)) return false;
    if (teamFilter.length > 0 && !teamFilter.includes(r.staff_team)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(r.staff_name || "").toLowerCase().includes(q) &&
          !(r.staff_team || "").toLowerCase().includes(q) &&
          !(r.staff_bu || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const submittedCount = filtered.filter(r => r.status === "submitted").length;
  const draftCount = filtered.filter(r => r.status === "draft").length;
  const hasFilters = search || statusFilter !== "all" || fyFilter !== "all" || buFilter.length > 0 || teamFilter.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (selectedReview) {
    return (
      <AnnualReviewDetail
        review={selectedReview}
        onBack={() => setSelectedReview(null)}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText size={20} className="text-indigo-500" /> 年度工作表現評估表（管理員）
        </h2>
        <p className="text-xs text-gray-400">查看所有員工提交的年度評估表</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 rounded-xl p-3 text-center border border-indigo-100">
          <div className="text-xl font-bold text-indigo-600">{filtered.length}</div>
          <div className="text-xs text-gray-500">總數</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-xl font-bold text-green-600">{submittedCount}</div>
          <div className="text-xs text-gray-500">已提交</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
          <div className="text-xl font-bold text-orange-600">{draftCount}</div>
          <div className="text-xs text-gray-500">草稿中</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40 max-w-72">
          <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="搜尋姓名、Team..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white"
          value={fyFilter}
          onChange={e => setFyFilter(e.target.value)}
        >
          <option value="all">全部年度</option>
          {fyList.map(fy => <option key={fy} value={fy}>{fy}</option>)}
        </select>
        <select
          className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">全部狀態</option>
          <option value="submitted">已提交</option>
          <option value="draft">草稿</option>
        </select>
        <MultiSelectDropdown label="BU" options={buList} selected={buFilter} onChange={setBuFilter} />
        <MultiSelectDropdown label="Team" options={teamList} selected={teamFilter} onChange={setTeamFilter} />
        {hasFilters && (
          <button onClick={() => { setSearch(""); setStatusFilter("all"); setFyFilter("all"); setBuFilter([]); setTeamFilter([]); }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-1">
            <X size={11} /> 清除
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} 筆</span>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50">
              <th className="px-4 py-2.5 text-left">員工</th>
              <th className="px-4 py-2.5 text-left">Team / BU</th>
              <th className="px-4 py-2.5 text-left">財政年度</th>
              <th className="px-4 py-2.5 text-center">狀態</th>
              <th className="px-4 py-2.5 text-left">提交時間</th>
              <th className="px-4 py-2.5 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{r.staff_name || "—"}</div>
                  <div className="text-xs text-gray-400">{r.staff_position || ""}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="text-blue-600 font-medium">{r.staff_team || "—"}</span>
                  <span className="text-gray-400 ml-1">{r.staff_bu || ""}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{r.fiscal_year}</td>
                <td className="px-4 py-3 text-center">
                  {r.status === "submitted" ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">已提交</span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">草稿</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleString("zh-HK") : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setSelectedReview(r)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 mx-auto"
                  >
                    <Eye size={13} /> 查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Users size={28} className="mx-auto mb-2 opacity-30" />
            暫無評估表記錄
          </div>
        )}
      </div>
    </div>
  );
}