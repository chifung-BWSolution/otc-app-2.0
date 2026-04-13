import { useState, useEffect } from "react";
import { Database, ChevronDown, ChevronRight, BarChart2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ENTITIES = [
  { name: "Staff", label: "Staff（員工）" },
  { name: "BubbleOT", label: "OT（加班）" },
  { name: "BubbleLeave", label: "Leave（假期）" },
  { name: "BubbleClockin", label: "Clockin（打卡）" },
  { name: "BubbleManHourDate", label: "Man Hour Date（工時日期）" },
  { name: "BubbleManHourTask", label: "Man Hour Task（工時任務）" },
  { name: "BubbleProject", label: "Project（項目）" },
  { name: "BubbleStaffKPI", label: "Staff KPI（員工KPI）" },
  { name: "BubbleStaffKPIMonth", label: "Staff KPI Month（KPI月份）" },
];

function pctColor(pct) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-400";
  if (pct >= 20) return "bg-orange-400";
  return "bg-red-400";
}

function pctTextColor(pct) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 50) return "text-yellow-600";
  if (pct >= 20) return "text-orange-600";
  return "text-red-500";
}

function EntityCard({ entity }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("bubbleDataStats", { entityName: entity.name });
    setStats(res.data);
    setLoading(false);
    setLoaded(true);
  };

  const handleExpand = () => {
    if (!loaded) loadStats();
    setExpanded(!expanded);
  };

  const fields = stats?.fields || {};
  const sortedFields = Object.entries(fields).sort((a, b) => b[1].percentage - a[1].percentage);
  const totalFields = sortedFields.length;
  const highCoverage = sortedFields.filter(([, v]) => v.percentage >= 80).length;
  const lowCoverage = sortedFields.filter(([, v]) => v.percentage < 20).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <Database size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900">{entity.label}</div>
          <div className="text-xs text-gray-400 font-mono">{entity.name}</div>
        </div>
        {loading && <RefreshCw size={14} className="animate-spin text-gray-400" />}
        {stats && (
          <div className="text-right shrink-0 mr-2">
            <div className="text-lg font-bold text-blue-600">{stats.totalCount.toLocaleString()}</div>
            <div className="text-xs text-gray-400">rows</div>
          </div>
        )}
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {expanded && stats && (
        <div className="border-t border-gray-100 px-4 py-3">
          {/* Summary */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-blue-600">{totalFields}</div>
              <div className="text-xs text-gray-500">總欄位</div>
            </div>
            <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-green-600">{highCoverage}</div>
              <div className="text-xs text-gray-500">≥80%</div>
            </div>
            <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-red-500">{lowCoverage}</div>
              <div className="text-xs text-gray-500">&lt;20%</div>
            </div>
          </div>

          {/* Field list */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {sortedFields.map(([field, info]) => (
              <div key={field} className="flex items-center gap-2 text-xs">
                <span className="w-40 truncate text-gray-700 font-medium shrink-0" title={field}>{field}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pctColor(info.percentage)}`}
                    style={{ width: `${Math.max(info.percentage, 2)}%` }}
                  />
                </div>
                <span className={`w-10 text-right font-bold shrink-0 ${pctTextColor(info.percentage)}`}>
                  {info.percentage}%
                </span>
                <span className="w-20 text-right text-gray-400 shrink-0">
                  {info.filled.toLocaleString()} / {(info.filled + info.empty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {stats.totalCount === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">無數據</div>
          )}
        </div>
      )}

      {expanded && loading && (
        <div className="border-t border-gray-100 px-4 py-6 text-center text-gray-400 text-sm">
          載入中，大數據量可能需時較久...
        </div>
      )}
    </div>
  );
}

export default function BubbleDataOverview() {
  const [loadingAll, setLoadingAll] = useState(false);
  const [allStats, setAllStats] = useState({});

  const loadAll = async () => {
    setLoadingAll(true);
    const results = {};
    for (const entity of ENTITIES) {
      const res = await base44.functions.invoke("bubbleDataStats", { entityName: entity.name });
      results[entity.name] = res.data;
    }
    setAllStats(results);
    setLoadingAll(false);
  };

  const totalRows = Object.values(allStats).reduce((sum, s) => sum + (s?.totalCount || 0), 0);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-500" />
            Bubble 數據遷移總覽
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">點擊展開查看各 Entity 欄位覆蓋率</p>
        </div>
        <button
          onClick={loadAll}
          disabled={loadingAll}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-60 transition-colors"
        >
          <RefreshCw size={14} className={loadingAll ? "animate-spin" : ""} />
          {loadingAll ? "載入中..." : "一鍵載入全部"}
        </button>
      </div>

      {/* Overall stats if loaded */}
      {Object.keys(allStats).length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 text-white">
          <div className="text-xs opacity-80">全部 Bubble 數據</div>
          <div className="text-3xl font-bold mt-1">{totalRows.toLocaleString()} <span className="text-lg opacity-80">rows</span></div>
          <div className="flex gap-4 mt-2 text-xs opacity-80">
            {ENTITIES.map(e => allStats[e.name] ? (
              <span key={e.name}>{e.name.replace('Bubble', '')}: {allStats[e.name].totalCount.toLocaleString()}</span>
            ) : null)}
          </div>
        </div>
      )}

      {/* Entity Cards */}
      <div className="space-y-2">
        {ENTITIES.map(entity => {
          // If allStats loaded, pass it down
          if (allStats[entity.name]) {
            return (
              <EntityCardWithData key={entity.name} entity={entity} stats={allStats[entity.name]} />
            );
          }
          return <EntityCard key={entity.name} entity={entity} />;
        })}
      </div>
    </div>
  );
}

function EntityCardWithData({ entity, stats }) {
  const [expanded, setExpanded] = useState(false);

  const fields = stats?.fields || {};
  const sortedFields = Object.entries(fields).sort((a, b) => b[1].percentage - a[1].percentage);
  const totalFields = sortedFields.length;
  const highCoverage = sortedFields.filter(([, v]) => v.percentage >= 80).length;
  const lowCoverage = sortedFields.filter(([, v]) => v.percentage < 20).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <Database size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900">{entity.label}</div>
          <div className="text-xs text-gray-400 font-mono">{entity.name}</div>
        </div>
        <div className="text-right shrink-0 mr-2">
          <div className="text-lg font-bold text-blue-600">{stats.totalCount.toLocaleString()}</div>
          <div className="text-xs text-gray-400">rows</div>
        </div>
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-blue-600">{totalFields}</div>
              <div className="text-xs text-gray-500">總欄位</div>
            </div>
            <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-green-600">{highCoverage}</div>
              <div className="text-xs text-gray-500">≥80%</div>
            </div>
            <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-red-500">{lowCoverage}</div>
              <div className="text-xs text-gray-500">&lt;20%</div>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {sortedFields.map(([field, info]) => (
              <div key={field} className="flex items-center gap-2 text-xs">
                <span className="w-40 truncate text-gray-700 font-medium shrink-0" title={field}>{field}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pctColor(info.percentage)}`}
                    style={{ width: `${Math.max(info.percentage, 2)}%` }}
                  />
                </div>
                <span className={`w-10 text-right font-bold shrink-0 ${pctTextColor(info.percentage)}`}>
                  {info.percentage}%
                </span>
                <span className="w-20 text-right text-gray-400 shrink-0">
                  {info.filled.toLocaleString()} / {(info.filled + info.empty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {stats.totalCount === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">無數據</div>
          )}
        </div>
      )}
    </div>
  );
}