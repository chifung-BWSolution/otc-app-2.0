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
  if (diff === 0) return <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle size={12} /> 一致</span>;
  if (diff > 0) return <span className="flex items-center gap-1 text-xs text-orange-600 font-bold"><AlertTriangle size={12} /> DB多{diff}</span>;
  return <span className="flex items-center gap-1 text-xs text-red-600 font-bold"><XCircle size={12} /> DB少{Math.abs(diff)}</span>;
}

function FieldCompareRow({ fieldName, bubbleField, dbField }) {
  const bubbleFilled = bubbleField?.estimatedFilled ?? null;
  const bubbleTotal = bubbleField?.estimatedTotal ?? null;
  const dbFilled = dbField?.filled ?? null;
  const dbTotal = dbField ? (dbField.filled + dbField.empty) : null;

  // If we have both, show comparison
  const hasBoth = bubbleFilled !== null && dbFilled !== null;
  const match = hasBoth && dbFilled === bubbleFilled;
  const diff = hasBoth ? dbFilled - bubbleFilled : null;

  return (
    <div className="flex items-center gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
      <span className="w-48 truncate text-gray-700 font-medium shrink-0" title={fieldName}>{fieldName}</span>

      {/* Bubble */}
      <div className="w-24 text-right shrink-0">
        {bubbleFilled !== null ? (
          <span className="text-purple-600 font-semibold">{bubbleFilled.toLocaleString()}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* DB */}
      <div className="w-24 text-right shrink-0">
        {dbFilled !== null ? (
          <span className="text-blue-600 font-semibold">{dbFilled.toLocaleString()}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* Visual bar — use bubble as baseline denominator */}
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden relative">
        {bubbleFilled !== null && bubbleFilled > 0 && (
          <div className="absolute inset-0 bg-purple-200 rounded-full" style={{ width: "100%" }} />
        )}
        {dbFilled !== null && bubbleFilled !== null && bubbleFilled > 0 && (
          <div
            className={`absolute inset-0 rounded-full ${dbFilled >= bubbleFilled ? "bg-green-400" : "bg-blue-400"}`}
            style={{ width: `${Math.min(100, Math.round((dbFilled / bubbleFilled) * 100))}%` }}
          />
        )}
        {bubbleFilled === null && dbFilled !== null && dbTotal > 0 && (
          <div
            className="absolute inset-0 bg-blue-400 rounded-full"
            style={{ width: `${Math.round((dbFilled / dbTotal) * 100)}%` }}
          />
        )}
      </div>

      {/* Status */}
      <div className="w-20 text-right shrink-0">
        {hasBoth ? (
          match ? (
            <span className="text-green-600 font-bold">✓</span>
          ) : diff > 0 ? (
            <span className="text-orange-500 font-semibold">+{diff.toLocaleString()}</span>
          ) : (
            <span className="text-red-500 font-semibold">{diff.toLocaleString()}</span>
          )
        ) : bubbleFilled !== null ? (
          <span className="text-purple-400">Bubble only</span>
        ) : dbFilled !== null ? (
          <span className="text-blue-400">DB only</span>
        ) : null}
      </div>
    </div>
  );
}

function EntityCard({ entity, bubbleInfo, dbStats, bubbleFieldStats, onExpand, expanded }) {
  const bubbleRows = bubbleInfo?.bubbleTotalRows ?? null;
  const dbRows = dbStats?.totalCount ?? null;
  const loading = expanded && !bubbleFieldStats && !dbStats;

  // Merge field lists from both sources
  const bubbleFields = bubbleFieldStats?.fields || {};
  const dbFields = dbStats?.fields || {};
  const allFieldNames = new Set([...Object.keys(bubbleFields), ...Object.keys(dbFields)]);

  // Build a mapping: try to find matching DB field for each Bubble field
  // This is approximate — Bubble fields are display names, DB fields are snake_case
  const sortedFields = [...allFieldNames].sort((a, b) => {
    const aBubble = bubbleFields[a]?.estimatedFilled || 0;
    const bBubble = bubbleFields[b]?.estimatedFilled || 0;
    return bBubble - aBubble;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => onExpand(entity.name)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
          <Database size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900">{entity.label}</div>
          <div className="text-xs text-gray-400 font-mono">{entity.name}</div>
        </div>
        <div className="text-right shrink-0 mr-1">
          <div className="text-xs text-gray-400">Bubble</div>
          <div className="text-sm font-bold text-purple-600">{bubbleRows !== null ? bubbleRows.toLocaleString() : "—"}</div>
        </div>
        <div className="text-right shrink-0 mr-1">
          <div className="text-xs text-gray-400">DB</div>
          <div className="text-sm font-bold text-blue-600">{dbRows !== null ? dbRows.toLocaleString() : "—"}</div>
        </div>
        <div className="shrink-0 w-24 text-right">
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

          {/* Field-by-field comparison */}
          {(Object.keys(bubbleFields).length > 0 || Object.keys(dbFields).length > 0) ? (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 px-0">
                <span className="w-48 shrink-0">欄位名</span>
                <span className="w-24 text-right shrink-0 text-purple-600">Bubble 有值</span>
                <span className="w-24 text-right shrink-0 text-blue-600">DB 有值</span>
                <span className="flex-1 text-center">覆蓋率</span>
                <span className="w-20 text-right shrink-0">差異</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto space-y-0">
                {/* Show Bubble fields first */}
                {Object.keys(bubbleFields).length > 0 && (
                  <>
                    <div className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded mb-1 mt-1">
                      Bubble 欄位 ({Object.keys(bubbleFields).length})
                    </div>
                    {Object.entries(bubbleFields)
                      .sort((a, b) => (b[1].estimatedFilled || 0) - (a[1].estimatedFilled || 0))
                      .map(([field, stats]) => (
                        <FieldCompareRow key={`b-${field}`} fieldName={field} bubbleField={stats} dbField={null} />
                      ))
                    }
                  </>
                )}
                {Object.keys(dbFields).length > 0 && (
                  <>
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded mb-1 mt-3">
                      DB 欄位 ({Object.keys(dbFields).length})
                    </div>
                    {Object.entries(dbFields)
                      .sort((a, b) => b[1].percentage - a[1].percentage)
                      .map(([field, stats]) => (
                        <FieldCompareRow key={`d-${field}`} fieldName={field} bubbleField={null} dbField={stats} />
                      ))
                    }
                  </>
                )}
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <RefreshCw size={14} className="animate-spin inline mr-1" /> 載入欄位統計中...
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function BubbleDataOverview() {
  const [bubbleInfo, setBubbleInfo] = useState({});
  const [dbStats, setDbStats] = useState({});
  const [bubbleFieldStats, setBubbleFieldStats] = useState({});
  const [loadingBubble, setLoadingBubble] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [expandedEntity, setExpandedEntity] = useState(null);

  useEffect(() => { loadBubbleInfo(); }, []);

  const loadBubbleInfo = async () => {
    setLoadingBubble(true);
    const res = await base44.functions.invoke("bubbleTableInfo", {});
    setBubbleInfo(res.data);
    setLoadingBubble(false);
  };

  const loadEntityDetails = async (entityName) => {
    if (expandedEntity === entityName) {
      setExpandedEntity(null);
      return;
    }
    setExpandedEntity(entityName);

    // Load both in parallel if not cached
    const promises = [];
    if (!dbStats[entityName]) {
      promises.push(
        base44.functions.invoke("bubbleDataStats", { entityName }).then(res => {
          setDbStats(prev => ({ ...prev, [entityName]: res.data }));
        })
      );
    }
    if (!bubbleFieldStats[entityName]) {
      promises.push(
        base44.functions.invoke("bubbleFieldStats", { entityName }).then(res => {
          setBubbleFieldStats(prev => ({ ...prev, [entityName]: res.data }));
        })
      );
    }
    await Promise.all(promises);
  };

  const loadAllDb = async () => {
    setLoadingAll(true);
    for (const entity of ENTITIES) {
      const [dbRes, bfRes] = await Promise.all([
        base44.functions.invoke("bubbleDataStats", { entityName: entity.name }),
        base44.functions.invoke("bubbleFieldStats", { entityName: entity.name }),
      ]);
      setDbStats(prev => ({ ...prev, [entity.name]: dbRes.data }));
      setBubbleFieldStats(prev => ({ ...prev, [entity.name]: bfRes.data }));
    }
    setLoadingAll(false);
  };

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
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-500" />
            Bubble 數據遷移總覽
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">對比 Bubble.io 同 Base44 DB 嘅數據（行數 + 每個欄位有值數量）</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadBubbleInfo} disabled={loadingBubble}
            className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-purple-600 disabled:opacity-60 transition-colors">
            <RefreshCw size={14} className={loadingBubble ? "animate-spin" : ""} />
            {loadingBubble ? "讀取中..." : "刷新 Bubble"}
          </button>
          <button onClick={loadAllDb} disabled={loadingAll}
            className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-60 transition-colors">
            <RefreshCw size={14} className={loadingAll ? "animate-spin" : ""} />
            {loadingAll ? "載入中..." : "一鍵載入全部"}
          </button>
        </div>
      </div>

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

      <div className="space-y-2">
        {ENTITIES.map(entity => (
          <EntityCard
            key={entity.name}
            entity={entity}
            bubbleInfo={bubbleInfo[entity.name] || null}
            dbStats={dbStats[entity.name] || null}
            bubbleFieldStats={bubbleFieldStats[entity.name] || null}
            onExpand={loadEntityDetails}
            expanded={expandedEntity === entity.name}
          />
        ))}
      </div>
    </div>
  );
}