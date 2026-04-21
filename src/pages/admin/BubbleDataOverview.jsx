import { useState, useEffect } from "react";
import { Database, ChevronDown, ChevronRight, BarChart2, RefreshCw, AlertTriangle, CheckCircle, XCircle, Link2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildFieldComparison } from "@/lib/bubbleFieldMapping";
import ImportBubbleModal from "@/components/bubble/ImportBubbleModal";

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

function RowMatchBadge({ bubbleRows, dbRows }) {
  if (bubbleRows === null || dbRows === null) return null;
  const diff = dbRows - bubbleRows;
  if (diff === 0) return <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle size={12} /> 一致</span>;
  if (diff > 0) return <span className="flex items-center gap-1 text-xs text-orange-600 font-bold"><AlertTriangle size={12} /> +{diff}</span>;
  return <span className="flex items-center gap-1 text-xs text-red-600 font-bold"><XCircle size={12} /> {diff}</span>;
}

function FieldRow({ row }) {
  const { bubbleName, dbName, bubbleStats, dbStats } = row;
  const bFilled = bubbleStats?.estimatedFilled ?? null;
  const bTotal = bubbleStats?.estimatedTotal ?? null;
  const dFilled = dbStats?.filled ?? null;
  const dTotal = dbStats ? (dbStats.filled + dbStats.empty) : null;
  const matched = bubbleName && dbName;
  const hasBoth = bFilled !== null && dFilled !== null;
  const diff = hasBoth ? dFilled - bFilled : null;

  // Bar width based on max of both
  const maxVal = Math.max(bFilled || 0, dFilled || 0, 1);

  return (
    <div className={`flex items-center gap-1 text-xs py-1.5 border-b border-gray-50 last:border-0 ${!matched ? "opacity-60" : ""}`}>
      {/* Bubble field name */}
      <div className="w-[170px] shrink-0 truncate text-right pr-2" title={bubbleName || ""}>
        {bubbleName ? (
          <span className="text-purple-700 font-medium">{bubbleName}</span>
        ) : (
          <span className="text-gray-300 italic">—</span>
        )}
      </div>

      {/* Bubble count */}
      <div className="w-16 shrink-0 text-right font-bold tabular-nums">
        {bFilled !== null ? (
          <span className="text-purple-600">{bFilled.toLocaleString()}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* Visual bars */}
      <div className="flex-1 min-w-20 flex flex-col gap-0.5 px-1">
        <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
          {bFilled !== null && (
            <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.round((bFilled / maxVal) * 100)}%` }} />
          )}
        </div>
        <div className="h-[5px] bg-gray-100 rounded-full overflow-hidden">
          {dFilled !== null && (
            <div className={`h-full rounded-full ${hasBoth && dFilled >= bFilled ? "bg-green-400" : "bg-blue-400"}`}
              style={{ width: `${Math.round(((dFilled || 0) / maxVal) * 100)}%` }} />
          )}
        </div>
      </div>

      {/* DB count */}
      <div className="w-16 shrink-0 text-left font-bold tabular-nums">
        {dFilled !== null ? (
          <span className="text-blue-600">{dFilled.toLocaleString()}</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </div>

      {/* DB field name */}
      <div className="w-[170px] shrink-0 truncate pl-2" title={dbName || ""}>
        {dbName ? (
          <span className="text-blue-700 font-medium">{dbName}</span>
        ) : (
          <span className="text-gray-300 italic">—</span>
        )}
      </div>

      {/* Link icon for matched */}
      <div className="w-5 shrink-0 text-center">
        {matched ? <Link2 size={10} className="text-green-400 inline" /> : null}
      </div>

      {/* Diff */}
      <div className="w-14 shrink-0 text-right">
        {hasBoth ? (
          diff === 0 ? (
            <span className="text-green-600 font-bold">✓</span>
          ) : diff > 0 ? (
            <span className="text-orange-500 font-semibold">+{diff.toLocaleString()}</span>
          ) : (
            <span className="text-red-500 font-semibold">{diff.toLocaleString()}</span>
          )
        ) : null}
      </div>
    </div>
  );
}

function EntityCard({ entity, bubbleInfo, dbStats, bubbleFieldStats, onExpand, expanded }) {
  const bubbleRows = bubbleInfo?.bubbleTotalRows ?? null;
  const dbRows = dbStats?.totalCount ?? null;
  const loading = expanded && (!bubbleFieldStats || !dbStats);

  const bubbleFields = bubbleFieldStats?.fields || {};
  const dbFields = dbStats?.fields || {};
  const comparison = buildFieldComparison(entity.name, bubbleFields, dbFields);
  const matchedCount = comparison.filter(r => r.bubbleName && r.dbName).length;
  const unmatchedBubble = comparison.filter(r => r.bubbleName && !r.dbName).length;
  const unmatchedDb = comparison.filter(r => !r.bubbleName && r.dbName).length;

  // Count fields with significant value-count differences (>1% tolerance)
  const fieldMismatches = comparison.filter(r => {
    if (!r.bubbleName || !r.dbName) return false;
    const bF = r.bubbleStats?.estimatedFilled ?? null;
    const dF = r.dbStats?.filled ?? null;
    if (bF === null || dF === null) return false;
    const threshold = Math.max(bubbleRows * 0.01, 5); // 1% or 5, whichever is larger
    return Math.abs(dF - bF) > threshold;
  }).length;
  const hasFieldStats = Object.keys(bubbleFields).length > 0 && Object.keys(dbFields).length > 0;

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
        <div className="shrink-0 w-auto text-right">
          {hasFieldStats && fieldMismatches > 0 ? (
            <span className="flex items-center gap-1 text-xs text-orange-600 font-bold">
              <AlertTriangle size={12} /> {fieldMismatches} 欄差異
            </span>
          ) : (
            <RowMatchBadge bubbleRows={bubbleRows} dbRows={dbRows} />
          )}
        </div>
        {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          {/* Row count summary */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-purple-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-purple-600">{bubbleRows !== null ? bubbleRows.toLocaleString() : "—"}</div>
              <div className="text-xs text-gray-500">Bubble 總行數</div>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
              <div className="text-sm font-bold text-blue-600">{dbRows !== null ? dbRows.toLocaleString() : "—"}</div>
              <div className="text-xs text-gray-500">DB 總行數</div>
            </div>
            <div className={`flex-1 rounded-lg px-3 py-2 text-center ${
              bubbleRows !== null && dbRows !== null ? (dbRows === bubbleRows ? "bg-green-50" : "bg-orange-50") : "bg-gray-50"
            }`}>
              <div className={`text-sm font-bold ${
                bubbleRows !== null && dbRows !== null ? (dbRows === bubbleRows ? "text-green-600" : "text-orange-600") : "text-gray-400"
              }`}>
                {bubbleRows !== null && dbRows !== null ? (dbRows === bubbleRows ? "✓ Match" : `差 ${Math.abs(dbRows - bubbleRows)}`) : "—"}
              </div>
              <div className="text-xs text-gray-500">行數對比</div>
            </div>
            {hasFieldStats && (
              <div className={`flex-1 rounded-lg px-3 py-2 text-center ${
                fieldMismatches === 0 ? "bg-green-50" : "bg-orange-50"
              }`}>
                <div className={`text-sm font-bold ${
                  fieldMismatches === 0 ? "text-green-600" : "text-orange-600"
                }`}>
                  {fieldMismatches === 0 ? "✓ OK" : `${fieldMismatches} 欄有差異`}
                </div>
                <div className="text-xs text-gray-500">欄位對比</div>
              </div>
            )}
          </div>

          {/* Field mapping stats */}
          {comparison.length > 0 && (
            <div className="flex gap-2 mb-2 text-xs">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                已配對 {matchedCount}
              </span>
              {unmatchedBubble > 0 && (
                <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">
                  Bubble 未配對 {unmatchedBubble}
                </span>
              )}
              {unmatchedDb > 0 && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                  DB 未配對 {unmatchedDb}
                </span>
              )}
            </div>
          )}

          {/* Field comparison table */}
          {comparison.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Header */}
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1.5 border-b border-gray-200 mb-1">
                <div className="w-[170px] shrink-0 text-right pr-2">Bubble 欄位</div>
                <div className="w-16 shrink-0 text-right">有值數</div>
                <div className="flex-1 min-w-20 text-center">
                  <span className="text-purple-500">■</span> Bubble &nbsp;
                  <span className="text-blue-500">■</span> DB
                </div>
                <div className="w-16 shrink-0 text-left">有值數</div>
                <div className="w-[170px] shrink-0 pl-2">DB 欄位</div>
                <div className="w-5 shrink-0"></div>
                <div className="w-14 shrink-0 text-right">差異</div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {comparison.map((row, i) => (
                  <FieldRow key={i} row={row} />
                ))}
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
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { loadBubbleInfo(); }, []);

  const loadBubbleInfo = async () => {
    setLoadingBubble(true);
    const res = await base44.functions.invoke("bubbleTableInfo", {});
    setBubbleInfo(res.data);
    setLoadingBubble(false);
  };

  const loadEntityDetails = async (entityName) => {
    if (expandedEntity === entityName) { setExpandedEntity(null); return; }
    setExpandedEntity(entityName);
    const promises = [];
    if (!dbStats[entityName]) {
      promises.push(base44.functions.invoke("bubbleDataStats", { entityName }).then(res => {
        setDbStats(prev => ({ ...prev, [entityName]: res.data }));
      }));
    }
    if (!bubbleFieldStats[entityName]) {
      promises.push(base44.functions.invoke("bubbleFieldStats", { entityName }).then(res => {
        setBubbleFieldStats(prev => ({ ...prev, [entityName]: res.data }));
      }));
    }
    await Promise.all(promises);
  };

  const loadAllDb = async () => {
    setLoadingAll(true);
    for (const entity of ENTITIES) {
      try {
        const dbRes = await base44.functions.invoke("bubbleDataStats", { entityName: entity.name });
        setDbStats(prev => ({ ...prev, [entity.name]: dbRes.data }));
      } catch (e) {
        console.warn(`Failed to load DB stats for ${entity.name}:`, e);
      }
      try {
        const bfRes = await base44.functions.invoke("bubbleFieldStats", { entityName: entity.name });
        setBubbleFieldStats(prev => ({ ...prev, [entity.name]: bfRes.data }));
      } catch (e) {
        console.warn(`Failed to load Bubble field stats for ${entity.name}:`, e);
      }
    }
    setLoadingAll(false);
  };

  const bubbleTotal = ENTITIES.reduce((sum, e) => sum + (bubbleInfo[e.name]?.bubbleTotalRows || 0), 0);
  const dbTotal = ENTITIES.reduce((sum, e) => sum + (dbStats[e.name]?.totalCount || 0), 0);
  const matchCount = ENTITIES.filter(e =>
    bubbleInfo[e.name]?.bubbleTotalRows !== undefined && dbStats[e.name]?.totalCount !== undefined &&
    bubbleInfo[e.name].bubbleTotalRows === dbStats[e.name].totalCount
  ).length;
  const mismatchCount = ENTITIES.filter(e =>
    bubbleInfo[e.name]?.bubbleTotalRows !== undefined && dbStats[e.name]?.totalCount !== undefined &&
    bubbleInfo[e.name].bubbleTotalRows !== dbStats[e.name].totalCount
  ).length;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} className="text-blue-500" /> Bubble 數據遷移總覽
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">逐個欄位對比 Bubble.io 同 DB 嘅有值數量</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">
            <Upload size={14} /> 手動匯入
          </button>
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

      {showImport && (
        <ImportBubbleModal
          onClose={() => setShowImport(false)}
          onDone={() => { loadBubbleInfo(); loadAllDb(); }}
        />
      )}
    </div>
  );
}