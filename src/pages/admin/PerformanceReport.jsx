import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BarChart2 } from "lucide-react";
import WorkHourSection from "@/components/report/WorkHourSection";
import KPIOverviewSection from "@/components/report/KPIOverviewSection";
import AttendanceSection from "@/components/report/AttendanceSection";

const TABS = [
  { key: "all", label: "📋 總覽" },
  { key: "workhour", label: "📊 工時分析" },
  { key: "kpi", label: "🎯 KPI 評核" },
  { key: "attendance", label: "⏰ 考勤" },
];

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
  const [tab, setTab] = useState("all");
  const [dateRange, setDateRange] = useState("90");

  // Data
  const [staff, setStaff] = useState([]);
  const [dates, setDates] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [nosTasks, setNosTasks] = useState([]);
  const [kpiMonths, setKpiMonths] = useState([]);
  const [kpiItems, setKpiItems] = useState([]);
  const [clockins, setClockins] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [ots, setOts] = useState([]);

  useEffect(() => { loadData(); }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const [staffList, dateList, taskTypeList, nosTaskList, kpiMonthList, kpiItemList, clockinList, leaveList, otList] = await Promise.all([
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 500),
      base44.entities.BubbleManHourDate.filter({}, "-report_date", 5000),
      base44.entities.NOSTaskType.filter({}, "display", 200),
      loadAll(base44.entities.NOSTask, "display"),
      loadAll(base44.entities.BubbleStaffKPIMonth, "-report_month"),
      loadAll(base44.entities.BubbleStaffKPI, "id"),
      base44.entities.BubbleClockin.filter({}, "-clockin_time", 5000),
      base44.entities.BubbleLeave.filter({}, "-start_date_time", 5000),
      base44.entities.BubbleOT.filter({}, "-start_date_time", 5000),
    ]);

    setStaff(staffList);
    setTaskTypes(taskTypeList);
    setNosTasks(nosTaskList);

    // Filter by date range
    const filteredDates = dateList.filter(d => d.report_date && d.report_date >= cutoffStr);
    setDates(filteredDates);

    // Filter KPI months within range
    const filteredKpiMonths = kpiMonthList.filter(m => m.report_month && m.report_month >= cutoffStr);
    setKpiMonths(filteredKpiMonths);
    const kpiMonthIds = new Set(filteredKpiMonths.map(m => m.bubble_id).filter(Boolean));
    setKpiItems(kpiItemList.filter(k => kpiMonthIds.has(k.staff_kpi_month_id)));

    // Filter clockins within range
    setClockins(clockinList.filter(c => c.clockin_time && c.clockin_time >= cutoffStr));
    setLeaves(leaveList.filter(l => l.start_date_time && l.start_date_time >= cutoffStr));
    setOts(otList.filter(o => o.start_date_time && o.start_date_time >= cutoffStr));

    // Load tasks linked to filtered dates
    const dateIds = new Set(filteredDates.map(d => d.bubble_id).filter(Boolean));
    const taskList = await base44.entities.BubbleManHourTask.filter({}, "-created_date", 5000);
    setTasks(taskList.filter(t => dateIds.has(t.man_hour_date_id)));

    setLoading(false);
  };

  // Build lookups
  const staffMap = useMemo(() => {
    const m = {};
    for (const s of staff) { if (s.bubble_id) m[s.bubble_id] = s; }
    return m;
  }, [staff]);

  const taskTypeMap = useMemo(() => {
    const m = {};
    for (const tt of taskTypes) { if (tt.bubble_id) m[tt.bubble_id] = tt; }
    return m;
  }, [taskTypes]);

  const nosTaskMap = useMemo(() => {
    const m = {};
    for (const t of nosTasks) { if (t.bubble_id) m[t.bubble_id] = t; }
    return m;
  }, [nosTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  const showWorkHour = tab === "all" || tab === "workhour";
  const showKPI = tab === "all" || tab === "kpi";
  const showAttendance = tab === "all" || tab === "attendance";

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-500" /> 績效總覽報告
          </h2>
          <p className="text-xs text-gray-400">整合工時、KPI、考勤數據的綜合分析</p>
        </div>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
          <option value="30">最近 30 天</option>
          <option value="60">最近 60 天</option>
          <option value="90">最近 90 天</option>
          <option value="180">最近 180 天</option>
          <option value="365">最近 1 年</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      {showWorkHour && (
        <WorkHourSection
          dates={dates}
          tasks={tasks}
          staffMap={staffMap}
          taskTypeMap={taskTypeMap}
          nosTaskMap={nosTaskMap}
        />
      )}

      {showWorkHour && showKPI && <hr className="border-gray-200" />}

      {showKPI && (
        <KPIOverviewSection
          kpiMonths={kpiMonths}
          kpiItems={kpiItems}
          staff={staff}
          staffMap={staffMap}
        />
      )}

      {showKPI && showAttendance && <hr className="border-gray-200" />}

      {showAttendance && (
        <AttendanceSection
          clockins={clockins}
          leaves={leaves}
          ots={ots}
          staffMap={staffMap}
        />
      )}
    </div>
  );
}