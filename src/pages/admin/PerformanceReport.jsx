import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart2, Search, X, Users } from "lucide-react";
import StaffAppraisalCard from "@/components/report/StaffAppraisalCard";
import DateRangeFilter from "@/components/report/DateRangeFilter";
import ProjectContributionModal from "@/components/report/ProjectContributionModal";

async function loadAll(entity, sort = "id", batchSize = 5000) {
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await entity.filter({}, sort, batchSize, offset);
    all.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
  }
  return all;
}

export default function PerformanceReport() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("90");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [buFilter, setBuFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [sortBy, setSortBy] = useState("hours"); // hours | kpi | name | late
  const [expandedStaff, setExpandedStaff] = useState(null);
  const [contributionProject, setContributionProject] = useState(null);

  const [staff, setStaff] = useState([]);
  const [dates, setDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [nosTasks, setNosTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [kpiMonths, setKpiMonths] = useState([]);
  const [kpiItems, setKpiItems] = useState([]);


  useEffect(() => { loadData(); }, [dateRange, customFrom, customTo]);

  const loadData = async () => {
    setLoading(true);
    let cutoffStr, endStr;
    if (customFrom && customTo) {
      cutoffStr = customFrom;
      endStr = customTo;
    } else {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
      cutoffStr = cutoff.toISOString().split("T")[0];
      endStr = new Date().toISOString().split("T")[0];
    }

    const [staffList, dateList, taskTypeList, nosTaskList, projectList, kpiMonthList, kpiItemList] = await Promise.all([
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 500),
      loadAll(base44.entities.BubbleManHourDate, "-report_date"),
      base44.entities.NOSTaskType.filter({}, "display", 200),
      loadAll(base44.entities.NOSTask, "display"),
      loadAll(base44.entities.BubbleProject, "display_name"),
      loadAll(base44.entities.BubbleStaffKPIMonth, "-report_month"),
      loadAll(base44.entities.BubbleStaffKPI, "id"),
    ]);

    setStaff(staffList);
    setTaskTypes(taskTypeList);
    setNosTasks(nosTaskList);
    setProjects(projectList);

    // Parse date: handles both "2026-03-01" (new) and "2026-03-01T16:00:00Z" (legacy)
    const toLocalDate = (isoStr) => {
      if (!isoStr) return null;
      if (isoStr.length === 10) return isoStr;
      const d = new Date(isoStr);
      const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
      return hkt.toISOString().slice(0, 10);
    };
    const filteredDates = dateList.filter(d => {
      if (!d.report_date) return false;
      const rd = toLocalDate(d.report_date);
      return rd && rd >= cutoffStr && rd <= endStr;
    });
    setDates(filteredDates);

    const filteredKpiMonths = kpiMonthList.filter(m => {
      if (!m.report_month) return false;
      const rm = toLocalDate(m.report_month);
      return rm && rm >= cutoffStr && rm <= endStr;
    });
    setKpiMonths(filteredKpiMonths);
    const kpiMonthIds = new Set(filteredKpiMonths.map(m => m.bubble_id).filter(Boolean));
    setKpiItems(kpiItemList.filter(k => kpiMonthIds.has(k.staff_kpi_month_id)));

    const dateIds = new Set(filteredDates.map(d => d.bubble_id).filter(Boolean));
    const taskList = await loadAll(base44.entities.BubbleManHourTask, "-created_date");
    setTasks(taskList.filter(t => dateIds.has(t.man_hour_date_id)));

    setLoading(false);
  };

  // Lookups
  const staffBubbleMap = useMemo(() => { const m = {}; for (const s of staff) { if (s.bubble_id) m[s.bubble_id] = s; } return m; }, [staff]);
  // dateToStaff for contribution modal
  const dateToStaffMap = useMemo(() => { const m = {}; for (const d of dates) { if (d.bubble_id && d.staff_id) m[d.bubble_id] = d.staff_id; } return m; }, [dates]);
  const taskTypeMap = useMemo(() => { const m = {}; for (const t of taskTypes) { if (t.bubble_id) m[t.bubble_id] = t; } return m; }, [taskTypes]);
  const nosTaskMap = useMemo(() => { const m = {}; for (const t of nosTasks) { if (t.bubble_id) m[t.bubble_id] = t; } return m; }, [nosTasks]);
  const projectMap = useMemo(() => { const m = {}; for (const p of projects) { if (p.bubble_id) m[p.bubble_id] = p; } return m; }, [projects]);
  // Map man_hour_date bubble_id -> report_date (for task date resolution)
  const dateMap = useMemo(() => { const m = {}; for (const d of dates) { if (d.bubble_id) m[d.bubble_id] = d.report_date; } return m; }, [dates]);

  // Pre-compute per-staff stats for sorting and filtering
  const staffStats = useMemo(() => {
    const hoursByStaff = {};
    const dateToStaff = {};
    for (const d of dates) {
      if (!d.staff_id) continue;
      hoursByStaff[d.staff_id] = (hoursByStaff[d.staff_id] || 0) + (d.total_work_hour || 0);
      if (d.bubble_id) dateToStaff[d.bubble_id] = d.staff_id;
    }
    const tasksByStaff = {};
    for (const t of tasks) {
      const sid = dateToStaff[t.man_hour_date_id];
      if (sid) tasksByStaff[sid] = (tasksByStaff[sid] || 0) + 1;
    }
    // KPI
    const kpiMonthMap = {};
    for (const m of kpiMonths) { if (m.bubble_id) kpiMonthMap[m.bubble_id] = m; }
    const kpiByStaff = {};
    for (const k of kpiItems) {
      const m = kpiMonthMap[k.staff_kpi_month_id];
      if (!m) continue;
      if (!kpiByStaff[m.staff_id]) kpiByStaff[m.staff_id] = { total: 0, count: 0 };
      if (k.score) { kpiByStaff[m.staff_id].total += k.score; kpiByStaff[m.staff_id].count++; }
    }
    const result = {};
    for (const s of staff) {
      if (!s.bubble_id) continue;
      const kpi = kpiByStaff[s.bubble_id];
      result[s.bubble_id] = {
        hours: hoursByStaff[s.bubble_id] || 0,
        tasks: tasksByStaff[s.bubble_id] || 0,
        avgKpi: kpi?.count > 0 ? Math.round(kpi.total / kpi.count * 10) / 10 : null,
      };
    }
    return result;
  }, [staff, dates, tasks, kpiMonths, kpiItems]);

  // Filter options
  const buList = useMemo(() => [...new Set(staff.map(s => s.bu_name).filter(Boolean))].sort(), [staff]);
  const teamList = useMemo(() => {
    const filtered = buFilter === "all" ? staff : staff.filter(s => s.bu_name === buFilter);
    return [...new Set(filtered.map(s => s.team_name).filter(Boolean))].sort();
  }, [staff, buFilter]);

  // Filter and sort staff
  const filteredStaff = useMemo(() => {
    let list = staff.filter(s => {
      if (!s.bubble_id) return false;
      const stats = staffStats[s.bubble_id];
      // Only show staff that have any data
      if (!stats || (stats.hours === 0 && stats.tasks === 0 && stats.avgKpi === null)) return false;
      if (buFilter !== "all" && s.bu_name !== buFilter) return false;
      if (teamFilter !== "all" && s.team_name !== teamFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(s.display_name || "").toLowerCase().includes(q) && !(s.full_name || "").toLowerCase().includes(q) && !(s.team_name || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      const sa = staffStats[a.bubble_id] || {};
      const sb = staffStats[b.bubble_id] || {};
      switch (sortBy) {
      case "hours": return (sb.hours || 0) - (sa.hours || 0);
      case "kpi": return (sb.avgKpi || 0) - (sa.avgKpi || 0);
      case "name": return (a.display_name || "").localeCompare(b.display_name || "");
      default: return 0;
      }
    });

    return list;
  }, [staff, staffStats, buFilter, teamFilter, search, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Project Contribution Modal */}
      {contributionProject && (
        <ProjectContributionModal
          projectName={contributionProject.name}
          projectBubbleId={contributionProject.bubbleId}
          allTasks={tasks}
          dateToStaff={dateToStaffMap}
          allStaff={staff}
          staffMap={staffBubbleMap}
          nosTaskMap={nosTaskMap}
          taskTypeMap={taskTypeMap}
          onClose={() => setContributionProject(null)}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-500" /> 員工績效評核報告
          </h2>
          <p className="text-xs text-gray-400">逐個員工查看工時、任務、KPI、考勤數據，方便做 Appraisal</p>
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          customFrom={customFrom}
          customTo={customTo}
          onPresetChange={(v) => { setCustomFrom(""); setCustomTo(""); setDateRange(v); }}
          onCustomChange={(from, to) => { setCustomFrom(from); setCustomTo(to); }}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="搜尋員工姓名、Team..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={buFilter} onChange={e => { setBuFilter(e.target.value); setTeamFilter("all"); }}>
          <option value="all">全部 BU</option>
          {buList.map(b => <option key={b}>{b}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
          <option value="all">全部 Team</option>
          {teamList.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="border border-gray-200 rounded-lg px-2 py-2 text-xs bg-white" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="hours">按工時排序 ↓</option>
          <option value="kpi">按KPI排序 ↓</option>
          <option value="name">按姓名排序</option>
        </select>
        {(search || buFilter !== "all" || teamFilter !== "all") && (
          <button onClick={() => { setSearch(""); setBuFilter("all"); setTeamFilter("all"); }}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-1">
            <X size={11} /> 清除
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{filteredStaff.length} 位員工</span>
      </div>

      {/* Staff cards */}
      <div className="space-y-2">
        {filteredStaff.map(s => (
          <StaffAppraisalCard
            key={s.id}
            staffRec={s}
            manHourDates={dates}
            manHourTasks={tasks}
            kpiMonths={kpiMonths}
            kpiItems={kpiItems}
            projectMap={projectMap}
            taskTypeMap={taskTypeMap}
            nosTaskMap={nosTaskMap}
            dateRange={dateRange}
            customFrom={customFrom}
            customTo={customTo}
            dateMap={dateMap}
            expanded={expandedStaff === s.id}
            onToggle={() => setExpandedStaff(expandedStaff === s.id ? null : s.id)}
            onShowProjectContribution={(name, bubbleId) => setContributionProject({ name, bubbleId })}
          />
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Users size={36} className="mx-auto mb-2 opacity-30" />
          <div className="text-sm">沒有符合條件的員工，或該時段內無匯報數據</div>
        </div>
      )}
    </div>
  );
}