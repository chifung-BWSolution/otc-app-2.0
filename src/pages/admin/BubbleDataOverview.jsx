import { useState, useEffect } from "react";
import { Database, ChevronDown, ChevronRight, BarChart2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
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

function RowMatchBadge({ bubbleRows, dbRows }) {
  if (bubbleRows === null || dbRows === null) return null;
  const diff = dbRows - bubbleRows;
  if (diff === 0) return <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle size={12} /> 完全一致</span>;
  if (diff > 0) return <span className="flex items-center gap-1 text-xs text-orange-600 font-bold"><AlertTriangle size={12} /> DB多{diff}條</span>;
  return <span className="flex items-center gap-1 text-xs text-red-600 font-bold"><XCircle size={12} /> DB少{Math.abs(diff)}條</span>;
}

function EntityCard({ entity, bubbleInfo, dbStats, onLoadDb }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    if (!dbStats) onLoadDb(entity.name);
    setExpanded(!expanded);
  };

  const bubbleRows = bubbleInfo?.bubbleTotalRows ?? null;
  const dbRows = dbStats?.totalCount ?? null;
  const bubbleFields = bubbleInfo?.bubbleFields || [];
  const dbFields = dbStats?.fields || {};
  const dbFieldNames = Object.keys(dbFields);

  const sortedDbFields = Object.entries(dbFields).sort((a, b) => b[1].percentage - a[1].percentage);

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

        {/* Bubble count */}
        <div className="text-right shrink-0 mr-1">
          <div className="text-xs text-gray-400">Bubble</div>
          <div className="text-sm font-bold text-purple-600">{bubbleRows !== null ? bubbleRows.toLocaleString() : "—"}</div>
        </div>

        {/* DB count */}
        <div className="text-right shrink-0 mr-1">
          <div className="text-xs text-gray-400">DB</div>
          <div className="text-sm font-bold text-blue-600">{dbRows !== null ? dbRows.toLocaleString() : "—"}</div>
        </div>

        {/* Match status */}
        <div className="shrink-0 w-28 text-right">
          <RowMatchBadge bubbleRows={bubbleRows} dbRows={dbRows} />
        </div>

        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {/* Row count comparison */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-purple-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-purple-600">{bubbleRows !== null ? bubbleRows.toLocaleString() : "—"}</div>
              <div className="text-xs text-gray-500">Bubble Rows</div>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-blue-600">{dbRows !== null ? dbRows.toLocaleString() : "—"}</div>
              <div className="text-xs text-gray-500">DB Rows</div>
            </div>
            <div className={`flex-1 rounded-lg px-3 py-2 text-center ${
              bubbleRows !== null && dbRows !== null
                ? (dbRows === bubbleRows ? "bg-green-50" : "bg-orange-50")
                : "bg-gray-50"
            }`}>
              <div className={`text-sm font-bold ${
                bubbleRows !== null && dbRows !== null
                  ? (dbRows === bubbleRows ? "text-green-600" : "text-orange-600")
                  : "text-gray-400"
              }`}>
                {bubbleRows !== null && dbRows !== null
                  ? (dbRows === bubbleRows ? "✓ Match" : `差 ${Math.abs(dbRows - bubbleRows)}`)
                  : "—"}
              </div>
              <div className="text-xs text-gray-500">行數對比</div>
            </div>
          </div>

          {/* Bubble Fields Section */}
          {bubbleFields.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-bold text-purple-600 mb-1.5">
                Bubble 欄位 ({bubbleFields.length} 個)
              </div>
              <div className="flex flex-wrap gap-1">
                {bubbleFields.map(f => (
                  <span key={f} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* DB Fields Coverage */}
          {sortedDbFields.length > 0 && (
            <div>
              <div className="text-xs font-bold text-blue-600 mb-1.5">
                DB 欄位覆蓋率 ({sortedDbFields.length} 個)
              </div>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {sortedDbFields.map(([field, info]) => (
                  <div key={field} className="flex items-center gap-2 text-xs">
                    <span className="w-48 truncate text-gray-700 font-medium shrink-0" title={field}>{field}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pctColor(info.percentage)}`}
                        style={{ width: `${Math.max(info.percentage, 2)}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right font-bold shrink-0 ${pctTextColor(info.percentage)}`}>
                      {info.percentage}%
                    </span>
                    <span className="w-24 text-right text-gray-400 shrink-0">
                      {info.filled.toLocaleString()} / {(info.filled + info.empty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!dbStats && (
            <div className="text-center py-4 text-gray-400 text-sm">
              <RefreshCw size={14} className="animate-spin inline mr-1" /> 載入 DB 統計中...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BubbleDataOverview() {
  const [bubbleInfo, setBubbleInfo] = useState({});
  const [dbStats, setDbStats] = useState({});
  const [loadingBubble, setLoadingBubble] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  // Load Bubble info on mount
  useEffect(() => {
    loadBubbleInfo();
  }, []);

  const loadBubbleInfo = async () => {
    setLoadingBubble(true);
    const res = await base44.functions.invoke("bubbleTableInfo", {});
    setBubbleInfo(res.data);
    setLoadingBubble(false);
  };

  const loadDbStats = async (entityName) => {
    if (dbStats[entityName]) return;
    const res = await base44.functions.invoke("bubbleDataStats", { entityName });
    setDbStats(prev => ({ ...prev, [entityName]: res.data }));
  };

  const loadAllDb = async () => {
    setLoadingAll(true);
    const results = {};
    for (const entity of ENTITIES) {
      const res = await base44.functions.invoke("bubbleDataStats", { entityName: entity.name });
      results[entity.name] = res.data;
    }
    setDbStats(results);
    setLoadingAll(false);
  };

  // Summary stats
  const bubbleTotal = ENTITIES.reduce((sum, e) => sum + (bubbleInfo[e.name]?.bubbleTotalRows || 0), 0);
  const dbTotal = ENTITIES.reduce((sum, e) => sum + (dbStats[e.name]?.totalCount || 0), 0);
  const matchCount = ENTITIES.filter(e =>
    bubbleInfo[e.name]?.bubbleTotalRows !== undefined &&
    dbStats[e.name]?.totalCount !== undefined &&
    bubbleInfo[e.name].bubbleTotalRows === dbStats[e.name].totalCount
  ).length;
  const mismatchCount = ENTITIES.filter(e =>
    bubbleInfo[e.name]?.bubbleTotalRows !== undefined &&
    dbStats[e.name]?.totalCount !== undefined &&
    bubbleInfo[e.name].bubbleTotalRows !== dbStats[e.name].totalCount
  ).length;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-500" />
            Bubble 數據遷移總覽
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">對比 Bubble.io 同 Base44 DB 嘅數據</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadBubbleInfo}
            disabled={loadingBubble}
            className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-purple-600 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={14} className={loadingBubble ? "animate-spin" : ""} />
            {loadingBubble ? "讀取中..." : "刷新 Bubble"}
          </button>
          <button
            onClick={loadAllDb}
            disabled={loadingAll}
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={14} className={loadingAll ? "animate-spin" : ""} />
            {loadingAll ? "載入中..." : "載入全部 DB"}
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-purple-600">{bubbleTotal > 0 ? bubbleTotal.toLocaleString() : "—"}</div>
          <div className="text-xs text-gray-500">Bubble 總行數</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{dbTotal > 0 ? dbTotal.toLocaleString() : "—"}</div>
          <div className="text-xs text-gray-500">DB 總行數</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{matchCount}</div>
          <div className="text-xs text-gray-500">完全一致</div>
        </div>
        <div className={`border rounded-xl p-3 text-center ${mismatchCount > 0 ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
          <div className={`text-xl font-bold ${mismatchCount > 0 ? "text-orange-500" : "text-gray-400"}`}>{mismatchCount}</div>
          <div className="text-xs text-gray-500">數量不符</div>
        </div>
      </div>

      {/* Entity Cards */}
      <div className="space-y-2">
        {ENTITIES.map(entity => (
          <EntityCard
            key={entity.name}
            entity={entity}
            bubbleInfo={bubbleInfo[entity.name] || null}
            dbStats={dbStats[entity.name] || null}
            onLoadDb={loadDbStats}
          />
        ))}
      </div>

      {loadingBubble && (
        <div className="text-center py-2 text-xs text-gray-400">
          正在從 Bubble.io 讀取各 table 資訊...
        </div>
      )}
    </div>
  );
}