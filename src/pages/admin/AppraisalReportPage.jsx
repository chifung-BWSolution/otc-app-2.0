import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText, Search, Eye, Users, X, CheckCircle2 } from "lucide-react";
import AppraisalReportDetail from "@/components/appraisal/AppraisalReportDetail";

export default function AppraisalReportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [fyFilter, setFyFilter] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  // Support navigating here with ?reportId=xxx
  const urlParams = new URLSearchParams(window.location.search);
  const directReportId = urlParams.get("reportId");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const all = await base44.entities.AppraisalReport.filter({}, "-created_date", 500);
    setReports(all);
    if (!fyFilter) {
      const fyCounts = {};
      for (const r of all) { fyCounts[r.fiscal_year] = (fyCounts[r.fiscal_year] || 0) + 1; }
      const best = Object.entries(fyCounts).sort((a, b) => b[1] - a[1])[0];
      if (best) setFyFilter(best[0]);
    }
    // Auto-select if navigated with reportId
    if (directReportId) {
      const found = all.find(r => r.id === directReportId);
      if (found) setSelectedReport(found);
    }
    setLoading(false);
  };

  const fyList = useMemo(() => [...new Set(reports.map(r => r.fiscal_year).filter(Boolean))].sort().reverse(), [reports]);

  const filtered = useMemo(() => {
    return reports.filter(r => {
      if (fyFilter && r.fiscal_year !== fyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (r.staff_name || "").toLowerCase().includes(q) || (r.staff_team || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [reports, fyFilter, search]);

  // Group by staff — show only latest version per staff
  const latestByStaff = useMemo(() => {
    const m = {};
    for (const r of filtered) {
      const key = r.staff_id + "_" + r.fiscal_year;
      if (!m[key] || r.version > m[key].version) m[key] = r;
    }
    return Object.values(m).sort((a, b) => (a.staff_name || "").localeCompare(b.staff_name || ""));
  }, [filtered]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }

  if (selectedReport) {
    return (
      <AppraisalReportDetail
        report={selectedReport}
        onBack={() => { setSelectedReport(null); loadData(); }}
        onUpdated={(updated) => { setSelectedReport(updated); loadData(); }}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <FileText size={20} className="text-indigo-500" /> 員工年度表現報告
        </h2>
        <p className="text-sm text-gray-500">AI 生成的年度表現整合報告</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-40 max-w-72">
          <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="搜尋姓名、Team..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={fyFilter} onChange={e => setFyFilter(e.target.value)}>
          {fyList.map(fy => <option key={fy} value={fy}>{fy}</option>)}
        </select>
        {search && <button onClick={() => setSearch("")} className="text-xs text-red-500"><X size={11} /></button>}
        <span className="text-xs text-gray-400 ml-auto">{latestByStaff.length} 位員工</span>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 font-semibold bg-gray-50">
              <th className="px-4 py-2.5 text-left">員工</th>
              <th className="px-4 py-2.5 text-left">Team / BU</th>
              <th className="px-4 py-2.5 text-center">版本</th>
              <th className="px-4 py-2.5 text-center">狀態</th>
              <th className="px-4 py-2.5 text-center">總分</th>
              <th className="px-4 py-2.5 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {latestByStaff.map(r => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{r.staff_name}</div>
                  <div className="text-xs text-gray-400">{r.staff_position}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className="text-blue-600 font-medium">{r.staff_team}</span>
                  <span className="text-gray-400 ml-1">{r.staff_bu}</span>
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">v{r.version}</td>
                <td className="px-4 py-3 text-center">
                  {r.scoring_completed ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 justify-center"><CheckCircle2 size={10} />已評分</span>
                  ) : r.is_final ? (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">報告已確認</span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">AI 草稿</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.total_score ? (
                    <span className="text-sm font-bold text-indigo-600">{r.total_score}</span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => setSelectedReport(r)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 mx-auto">
                    <Eye size={13} /> 查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {latestByStaff.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Users size={28} className="mx-auto mb-2 opacity-30" />
            暫無報告記錄
          </div>
        )}
      </div>
    </div>
  );
}