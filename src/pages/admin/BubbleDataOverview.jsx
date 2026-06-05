import { useState, useEffect, useCallback } from "react";
import {
  Database, ChevronDown, ChevronRight, BarChart2, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, Link2, Upload, CloudDownload, Settings, Search,
  Filter, Clock, Zap, Eye, EyeOff, Pencil, Save, X, ArrowUpDown
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildFieldComparison } from "@/lib/bubbleFieldMapping";
import FIELD_MAPS from "@/lib/bubbleFieldMapping";
import ImportBubbleModal from "@/components/bubble/ImportBubbleModal";

const ENTITIES = [
  { name: "Staff", label: "Staff（員工）" },
  { name: "StaffInformation", label: "Staff Information（員工個人資料）" },
  { name: "BubbleOT", label: "OT（加班）" },
  { name: "BubbleLeave", label: "Leave（假期）" },
  { name: "BubbleClockin", label: "Clockin（打卡）" },
  { name: "BubbleManHourDate", label: "Man Hour Date（工時日期）" },
  { name: "BubbleManHourTask", label: "Man Hour Task（工時任務）" },
  { name: "BubbleProject", label: "Project（項目）" },
  { name: "BubbleStaffKPI", label: "Staff KPI（員工KPI）" },
  { name: "BubbleStaffKPIMonth", label: "Staff KPI Month（KPI月份）" },
];

// ============================================================
// Field Mapping Editor Modal
// ============================================================
function MappingEditorModal({ entityName, currentMap, onSave, onClose }) {
  const [editMap, setEditMap] = useState(() => {
    const entries = Object.entries(currentMap || {}).filter(([key]) => /[A-Z\s&\-]/.test(key));
    return entries.map(([bubble, db]) => ({ bubble, db, id: Math.random() }));
  });
  const [newBubble, setNewBubble] = useState("");
  const [newDb, setNewDb] = useState("");

  const handleAdd = () => {
    if (newBubble.trim() && newDb.trim()) {
      setEditMap(prev => [...prev, { bubble: newBubble.trim(), db: newDb.trim(), id: Math.random() }]);
      setNewBubble("");
      setNewDb("");
    }
  };

  const handleRemove = (id) => {
    setEditMap(prev => prev.filter(r => r.id !== id));
  };

  const handleChange = (id, field, value) => {
    setEditMap(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = () => {
    const newMap = {};
    for (const { bubble, db } of editMap) {
      if (bubble.trim() && db.trim()) {
        newMap[bubble.trim()] = db.trim();
      }
    }
    onSave(entityName, newMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">欄位 Mapping 編輯器</h3>
            <p className="text-xs text-gray-400">{entityName} — Bubble Field Name ↔ Supabase Column Name</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-[1fr_1fr_40px] gap-2 mb-2 text-xs font-bold text-gray-500 uppercase">
            <div>Bubble Field Name</div>
            <div>DB Column Name</div>
            <div></div>
          </div>

          {editMap.map(row => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_40px] gap-2 mb-1.5">
              <input
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                value={row.bubble}
                onChange={e => handleChange(row.id, "bubble", e.target.value)}
                placeholder="Bubble field..."
              />
              <input
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                value={row.db}
                onChange={e => handleChange(row.id, "db", e.target.value)}
                placeholder="db_column..."
              />
              <button onClick={() => handleRemove(row.id)} className="text-red-400 hover:text-red-600 p-1 rounded">
                <X size={14} />
              </button>
            </div>
          ))}

          <div className="grid grid-cols-[1fr_1fr_40px] gap-2 mt-3 pt-3 border-t border-dashed border-gray-200">
            <input
              className="border border-green-200 rounded-lg px-3 py-1.5 text-sm bg-green-50 focus:ring-2 focus:ring-green-300"
              value={newBubble}
              onChange={e => setNewBubble(e.target.value)}
              placeholder="新增 Bubble field..."
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <input
              className="border border-green-200 rounded-lg px-3 py-1.5 text-sm font-mono bg-green-50 focus:ring-2 focus:ring-green-300"
              value={newDb}
              onChange={e => setNewDb(e.target.value)}
              placeholder="新增 db_column..."
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <button onClick={handleAdd} className="text-green-600 hover:text-green-800 font-bold text-lg">+</button>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <span className="text-xs text-gray-400">共 {editMap.length} 個映射</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">取消</button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              <Save size={14} /> 儲存映射
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Deep Diff Analysis Modal
// ============================================================
function DeepDiffModal({ entityName, bubbleField, dbColumn, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("bubbleDeepDiff", {
          entityName,
          dbColumn,
          bubbleField,
          sampleSize: 10,
        });
        setData(res?.data || res);
      } catch (e) {
        setError(e.message || "載入失敗");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entityName, bubbleField, dbColumn]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">🔍 欄位深度差異分析</h3>
            <p className="text-xs text-gray-400">
              {entityName} — <span className="text-purple-600 font-semibold">{bubbleField}</span> ↔ <span className="text-blue-600 font-semibold">{dbColumn}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> 分析中...
            </div>
          )}
          {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl">{error}</div>}
          {data && !loading && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-purple-600">{data.summary?.bubbleFilled?.toLocaleString() ?? "—"}</div>
                  <div className="text-[10px] text-gray-500">Bubble 有值</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-600">{data.summary?.dbFilled?.toLocaleString() ?? "—"}</div>
                  <div className="text-[10px] text-gray-500">DB 有值</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">{data.summary?.bubbleEmpty?.toLocaleString() ?? "—"}</div>
                  <div className="text-[10px] text-gray-500">Bubble 無值</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${data.summary?.diff === 0 ? "bg-green-50" : "bg-red-50"}`}>
                  <div className={`text-lg font-bold ${data.summary?.diff === 0 ? "text-green-600" : "text-red-600"}`}>
                    {data.summary?.diff > 0 ? "+" : ""}{data.summary?.diff?.toLocaleString() ?? "—"}
                  </div>
                  <div className="text-[10px] text-gray-500">差異 (DB - Bubble)</div>
                </div>
              </div>

              {/* Cross-Reference: DB empty but Bubble has value */}
              {data.crossRefSamples && data.crossRefSamples.length > 0 && (
                <div className="border border-orange-200 rounded-xl overflow-hidden">
                  <div className="bg-orange-50 px-4 py-2 font-bold text-sm text-orange-700">
                    ⚠️ DB 無值但 Bubble 有值的記錄（抽樣 {data.crossRefSamples.length} 筆）
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Bubble ID</th>
                          <th className="px-3 py-2 text-left font-semibold text-purple-600">Bubble 值</th>
                          <th className="px-3 py-2 text-left font-semibold text-blue-600">DB 值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.crossRefSamples.map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-1.5 font-mono text-gray-600 truncate max-w-[120px]">{row.bubble_id}</td>
                            <td className="px-3 py-1.5 text-purple-700 font-medium truncate max-w-[200px]">
                              {row.bubbleValue !== null && row.bubbleValue !== "" ? String(row.bubbleValue) : <span className="text-gray-300 italic">空</span>}
                            </td>
                            <td className="px-3 py-1.5 text-blue-700 truncate max-w-[200px]">
                              {row.dbValue !== null && row.dbValue !== "" ? String(row.dbValue) : <span className="text-gray-300 italic">空</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Value comparison for filled records */}
              {data.valueMismatchSamples && data.valueMismatchSamples.length > 0 && (
                <div className="border border-blue-200 rounded-xl overflow-hidden">
                  <div className="bg-blue-50 px-4 py-2 font-bold text-sm text-blue-700">
                    🔎 有值記錄數值對比（抽樣 {data.valueMismatchSamples.length} 筆）
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">Bubble ID</th>
                          <th className="px-3 py-2 text-left font-semibold text-purple-600">Bubble 值</th>
                          <th className="px-3 py-2 text-left font-semibold text-blue-600">DB 值</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-500">狀態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.valueMismatchSamples.map((row, i) => {
                          const bStr = row.bubbleValue === null || row.bubbleValue === undefined ? "" : String(row.bubbleValue);
                          const dStr = row.dbValue === null || row.dbValue === undefined ? "" : String(row.dbValue);
                          const match = bStr === dStr;
                          return (
                            <tr key={i} className={`border-t border-gray-100 ${!match ? "bg-yellow-50/50" : ""}`}>
                              <td className="px-3 py-1.5 font-mono text-gray-600 truncate max-w-[120px]">{row.bubble_id}</td>
                              <td className="px-3 py-1.5 text-purple-700 truncate max-w-[200px]">{bStr || <span className="text-gray-300 italic">空</span>}</td>
                              <td className="px-3 py-1.5 text-blue-700 truncate max-w-[200px]">{dStr || <span className="text-gray-300 italic">空</span>}</td>
                              <td className="px-3 py-1.5">
                                {match ? (
                                  <span className="text-green-600 font-bold">✓ 一致</span>
                                ) : (
                                  <span className="text-red-600 font-bold">✗ 不一致</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bubble sample records */}
              {data.bubbleSampleRecords && data.bubbleSampleRecords.length > 0 && (
                <details className="border border-gray-200 rounded-xl overflow-hidden">
                  <summary className="bg-gray-50 px-4 py-2 font-bold text-sm text-gray-700 cursor-pointer hover:bg-gray-100">
                    📋 Bubble 有值記錄樣本（{data.bubbleSampleRecords.length} 筆）
                  </summary>
                  <div className="p-3 text-xs font-mono bg-white max-h-40 overflow-y-auto">
                    {data.bubbleSampleRecords.map((r, i) => (
                      <div key={i} className="py-0.5 border-b border-gray-50">
                        <span className="text-gray-400">{r.bubble_id}:</span>{" "}
                        <span className="text-purple-700 font-semibold">{JSON.stringify(r.value)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Row Match Badge
// ============================================================
function RowMatchBadge({ bubbleRows, dbRows }) {
  if (bubbleRows === null || dbRows === null) return null;
  const diff = dbRows - bubbleRows;
  if (diff === 0) return <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle size={12} /> 一致</span>;
  if (diff > 0) return <span className="flex items-center gap-1 text-xs text-orange-600 font-bold"><AlertTriangle size={12} /> +{diff}</span>;
  return <span className="flex items-center gap-1 text-xs text-red-600 font-bold"><XCircle size={12} /> {diff}</span>;
}

// ============================================================
// Enhanced Field Row with Deep Diff Button
// ============================================================
function FieldRow({ row, verifiedData, entityName, onDeepDiff }) {
  const { bubbleName, dbName, bubbleStats, dbStats, mappingOnly } = row;
  const vData = mappingOnly && verifiedData ? verifiedData[bubbleName] : null;
  const isVerified = vData !== null && vData !== undefined;
  const vExists = isVerified && vData.exists;
  const vCount = isVerified ? vData.count : null;

  const bFilled = vCount !== null ? vCount : (bubbleStats?.filledCount ?? null);
  const dFilled = dbStats?.filled ?? null;
  const matched = bubbleName && dbName;
  const hasBoth = bFilled !== null && dFilled !== null;
  const diff = hasBoth ? dFilled - bFilled : null;

  const maxVal = Math.max(bFilled || 0, dFilled || 0, 1);

  const rowBg = mappingOnly
    ? isVerified
      ? vExists ? "bg-green-50/50" : "bg-red-50/50"
      : "bg-amber-50/50"
    : "";

  const hasDiff = hasBoth && diff !== 0;

  return (
    <div className={`flex items-center gap-1 text-xs py-1.5 border-b border-gray-50 last:border-0 ${!matched ? "opacity-60" : ""} ${rowBg} ${hasDiff ? "hover:bg-orange-50/50" : "hover:bg-gray-50/30"} transition-colors group`}>
      {/* Bubble field name */}
      <div className="w-[170px] shrink-0 truncate text-right pr-2" title={bubbleName || ""}>
        {bubbleName ? (
          <span className={`font-medium ${mappingOnly ? (isVerified ? (vExists ? "text-green-700" : "text-red-600") : "text-amber-600 italic") : "text-purple-700"}`}>
            {bubbleName}
            {mappingOnly && !isVerified && <span className="text-[9px] ml-1 text-amber-500">(未偵測)</span>}
            {mappingOnly && isVerified && vExists && <span className="text-[9px] ml-1 text-green-500">(已驗證 ✓)</span>}
            {mappingOnly && isVerified && !vExists && <span className="text-[9px] ml-1 text-red-500">(不存在 ✗)</span>}
          </span>
        ) : (
          <span className="text-gray-300 italic">—</span>
        )}
      </div>

      {/* Bubble count */}
      <div className="w-16 shrink-0 text-right font-bold tabular-nums">
        {bFilled !== null ? (
          <span className={isVerified ? "text-green-600" : "text-purple-600"}>{bFilled.toLocaleString()}</span>
        ) : mappingOnly ? (
          <span className="text-amber-400 text-[9px]">N/A</span>
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
      <div className="w-[140px] shrink-0 truncate pl-2" title={dbName || ""}>
        {dbName ? (
          <span className="text-blue-700 font-medium font-mono text-[11px]">{dbName}</span>
        ) : (
          <span className="text-gray-300 italic">—</span>
        )}
      </div>

      {/* Link icon */}
      <div className="w-5 shrink-0 text-center">
        {matched && !mappingOnly ? <Link2 size={10} className="text-green-400 inline" /> : null}
        {mappingOnly && !isVerified ? <span className="text-amber-400 text-[9px]">📋</span> : null}
        {mappingOnly && isVerified && vExists ? <span className="text-green-500 text-[9px]">✓</span> : null}
        {mappingOnly && isVerified && !vExists ? <span className="text-red-400 text-[9px]">✗</span> : null}
      </div>

      {/* Diff + Deep diff button */}
      <div className="w-20 shrink-0 text-right flex items-center justify-end gap-1">
        {hasBoth ? (
          diff === 0 ? (
            <span className="text-green-600 font-bold">✓</span>
          ) : diff > 0 ? (
            <span className="text-orange-500 font-semibold">+{diff.toLocaleString()}</span>
          ) : (
            <span className="text-red-500 font-semibold">{diff.toLocaleString()}</span>
          )
        ) : null}
        {matched && hasBoth && diff !== 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeepDiff(bubbleName, dbName); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-orange-100 text-orange-700 rounded px-1.5 py-0.5 text-[9px] font-bold hover:bg-orange-200"
            title="深度差異分析"
          >
            🔍
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Entity Card with Sync Status & Filters
// ============================================================
function EntityCard({ entity, bubbleInfo, dbStats, bubbleFieldStats, onExpand, expanded, onSyncDone, customMappings }) {
  const [verifiedFields, setVerifiedFields] = useState({});
  const [verifying, setVerifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncProgress, setSyncProgress] = useState("");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [deepDiffTarget, setDeepDiffTarget] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  const handleSync = async (e) => {
    e.stopPropagation();
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncProgress("開始同步...");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/supabase-functions-syncBubbleTable`;

      const resp = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({ entityName: entity.name }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${errText}`);
      }

      // Read streaming response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let finalResult = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Each line is a JSON object
        const lines = chunk.split("\n").filter(l => l.trim());
        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            if (msg.type === "progress" || msg.type === "warning") {
              setSyncProgress(msg.message);
            } else if (msg.type === "debug") {
              setSyncProgress(`🔍 ${msg.message}`);
              console.log("[sync debug]", msg);
            } else if (msg.type === "done") {
              finalResult = msg.data;
            } else if (msg.type === "error") {
              throw new Error(msg.message);
            }
          } catch (parseErr) {
            // If it's not JSON, might be the whole response as JSON
            // (in case response is not streaming)
            if (line.includes("totalFetched")) {
              try {
                const parsed = JSON.parse(line);
                finalResult = parsed.data || parsed;
              } catch (e) { /* ignore */ }
            }
          }
        }
      }

      if (finalResult) {
        setSyncResult(finalResult);
      } else {
        setSyncResult({ totalFetched: 0, totalUpserted: 0, totalErrors: 0 });
      }
      if (onSyncDone) onSyncDone(entity.name);
    } catch (err) {
      console.error("Sync error:", err);
      setSyncResult({ totalFetched: 0, totalUpserted: 0, totalErrors: -1, errorMsg: err.message || "同步失敗" });
    } finally {
      setSyncing(false);
      setSyncProgress("");
    }
  };

  const bubbleRows = bubbleInfo?.bubbleTotalRows ?? null;
  const bubbleError = bubbleInfo?.error ?? null;
  const dbRows = dbStats?.totalCount ?? null;
  const loading = expanded && (!bubbleFieldStats || !dbStats);

  const bubbleFields = bubbleFieldStats?.fields || {};
  const dbFields = dbStats?.fields || {};
  const comparison = buildFieldComparison(entity.name, bubbleFields, dbFields);
  const matchedCount = comparison.filter(r => r.bubbleName && r.dbName && !r.mappingOnly).length;
  const mappingOnlyCount = comparison.filter(r => r.mappingOnly).length;
  const unmatchedBubble = comparison.filter(r => r.bubbleName && !r.dbName).length;
  const unmatchedDb = comparison.filter(r => !r.bubbleName && r.dbName).length;

  // Filter comparison rows
  const filteredComparison = comparison.filter(row => {
    if (fieldFilter === "all") return true;
    if (fieldFilter === "diff") {
      const bF = row.bubbleStats?.filledCount ?? null;
      const dF = row.dbStats?.filled ?? null;
      if (bF === null || dF === null) return false;
      return dF !== bF;
    }
    if (fieldFilter === "rowMatchValueDiff") {
      const bF = row.bubbleStats?.filledCount ?? null;
      const dF = row.dbStats?.filled ?? null;
      if (bF === null || dF === null) return false;
      const rowsMatch = bubbleRows !== null && dbRows !== null && bubbleRows === dbRows;
      return rowsMatch && dF !== bF;
    }
    if (fieldFilter === "unmapped") {
      return (!row.bubbleName || !row.dbName);
    }
    return true;
  });

  const verifyUndetectedFields = async () => {
    const undetected = comparison.filter(r => r.mappingOnly).map(r => r.bubbleName);
    if (undetected.length === 0) return;
    setVerifying(true);
    try {
      const res = await base44.functions.invoke("bubbleFieldStats", {
        entityName: entity.name,
        verifyFields: undetected,
      });
      setVerifiedFields(res?.data?.verifiedFields || {});
    } catch (e) {
      console.warn("Failed to verify fields:", e);
    } finally {
      setVerifying(false);
    }
  };

  // Count fields with significant value-count differences
  const fieldMismatches = comparison.filter(r => {
    if (!r.bubbleName || !r.dbName) return false;
    const bF = r.bubbleStats?.filledCount ?? null;
    const dF = r.dbStats?.filled ?? null;
    if (bF === null || dF === null) return false;
    const threshold = Math.max((bubbleRows || 0) * 0.01, 5);
    return Math.abs(dF - bF) > threshold;
  }).length;
  const hasFieldStats = Object.keys(bubbleFields).length > 0 && Object.keys(dbFields).length > 0;

  // Load last sync time
  useEffect(() => {
    if (expanded) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      fetch(`${supabaseUrl}/rest/v1/sync_progress?entity_name=eq.${entity.name}&order=updated_at.desc&limit=1`, {
        headers: { "apikey": supabaseAnonKey, "Authorization": `Bearer ${supabaseAnonKey}` }
      })
        .then(r => r.json())
        .then(data => { if (data && data.length > 0) setLastSync(data[0]); })
        .catch(() => {});
    }
  }, [expanded, entity.name, syncResult]);

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
          <div className="text-sm font-bold text-purple-600">
            {bubbleError ? <span className="text-red-400 text-[10px]" title={bubbleError}>ERR</span> : (bubbleRows !== null ? bubbleRows.toLocaleString() : "—")}
          </div>
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

      {/* Sync button & result */}
      <div className="flex items-center gap-2 px-4 pb-2 -mt-1 flex-wrap">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-60 transition-colors"
        >
          <CloudDownload size={12} className={syncing ? "animate-bounce" : ""} />
          {syncing ? "同步中..." : "⬇️ 全量同步"}
        </button>
        {lastSync && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock size={10} />
            上次同步: {new Date(lastSync.updated_at || lastSync.created_at).toLocaleString("zh-HK")}
            {lastSync.status && <span className={`ml-1 font-semibold ${lastSync.status === "done" ? "text-green-600" : "text-orange-600"}`}>({lastSync.status})</span>}
          </span>
        )}
        {syncing && syncProgress && (
          <span className="text-xs text-blue-600 animate-pulse max-w-xs truncate">{syncProgress}</span>
        )}
        {syncResult && (
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${syncResult.totalErrors > 0 || syncResult.totalErrors === -1 ? "text-red-600" : "text-green-600"}`}>
              {syncResult.totalErrors === -1 ? (
                `❌ ${syncResult.errorMsg || "同步失敗"}`
              ) : (
                `✓ 拉取 ${syncResult.totalFetched?.toLocaleString()} 筆，寫入 ${syncResult.totalUpserted?.toLocaleString()} 筆${syncResult.totalErrors > 0 ? `，失敗 ${syncResult.totalErrors}` : ""}`
              )}
            </span>
            {syncResult.errors && syncResult.errors.length > 0 && (
              <div className="text-[10px] text-red-500 mt-0.5 max-w-md truncate" title={syncResult.errors.join("\n")}>
                {syncResult.errors[0]}
              </div>
            )}
          </div>
        )}
      </div>

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
            <div className="flex gap-2 mb-2 text-xs flex-wrap items-center">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                已配對 {matchedCount}
              </span>
              {mappingOnlyCount > 0 && (
                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                  已定義未偵測 {mappingOnlyCount}
                </span>
              )}
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
              {mappingOnlyCount > 0 && (
                <button
                  onClick={verifyUndetectedFields}
                  disabled={verifying}
                  className="ml-auto bg-amber-500 text-white px-2.5 py-0.5 rounded-full font-semibold hover:bg-amber-600 disabled:opacity-60 transition-colors flex items-center gap-1"
                >
                  <RefreshCw size={10} className={verifying ? "animate-spin" : ""} />
                  {verifying ? "驗證中..." : "🔍 驗證未偵測欄位"}
                </button>
              )}
            </div>
          )}

          {/* Filter bar */}
          {hasFieldStats && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {[
                { key: "all", label: "全部", icon: null },
                { key: "diff", label: "只顯示有差異", icon: <AlertTriangle size={10} /> },
                { key: "rowMatchValueDiff", label: "行數一致但值不夾", icon: <Zap size={10} /> },
                { key: "unmapped", label: "未配對", icon: <EyeOff size={10} /> },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFieldFilter(f.key)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                    fieldFilter === f.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
              <span className="text-[10px] text-gray-400 self-center ml-2">
                顯示 {filteredComparison.length}/{comparison.length} 欄位
              </span>
            </div>
          )}

          {/* Debug: show DB stats debug info */}
          {dbStats?._debug && (
            <details className="mb-2 text-xs border border-blue-200 rounded-lg bg-blue-50 p-2">
              <summary className="cursor-pointer text-blue-700 hover:text-blue-900 font-semibold">
                🔍 DB Stats Debug: 發現 {dbStats._debug.columnsDiscovered} 欄, 成功統計 {dbStats._debug.columnsCounted} 欄
                {dbStats._debug.skippedColumns?.length > 0 && <span className="text-red-500 ml-1">(跳過 {dbStats._debug.skippedColumns.length} 欄)</span>}
              </summary>
              {dbStats._debug.skippedColumns?.length > 0 && (
                <div className="mt-1 bg-white rounded p-2 font-mono text-[10px] max-h-32 overflow-y-auto whitespace-pre-wrap break-all border border-blue-100">
                  <span className="text-red-600 font-bold">跳過的欄位: </span>{dbStats._debug.skippedColumns.join(", ")}
                </div>
              )}
            </details>
          )}

          {/* Debug: show raw Bubble field keys */}
          {bubbleFieldStats?.allKeys && bubbleFieldStats.allKeys.length > 0 && (
            <details className="mb-2 text-xs border border-yellow-200 rounded-lg bg-yellow-50 p-2" open>
              <summary className="cursor-pointer text-yellow-700 hover:text-yellow-900 font-semibold">🔍 All Bubble Keys ({bubbleFieldStats.allKeys.length} fields, sample: {bubbleFieldStats.sampleSize} records)</summary>
              <div className="mt-1 bg-white rounded p-2 font-mono text-[10px] max-h-32 overflow-y-auto whitespace-pre-wrap break-all border border-yellow-100">
                {bubbleFieldStats.allKeys.join(", ")}
              </div>
            </details>
          )}
          {bubbleFieldStats?.sampleRecord && (
            <details className="mb-2 text-xs border border-orange-200 rounded-lg bg-orange-50 p-2">
              <summary className="cursor-pointer text-orange-700 hover:text-orange-900 font-semibold">🔍 Sample Record (first row)</summary>
              <div className="mt-1 bg-white rounded p-2 font-mono text-[10px] max-h-40 overflow-y-auto whitespace-pre-wrap break-all border border-orange-100">
                {JSON.stringify(bubbleFieldStats.sampleRecord, null, 2)}
              </div>
            </details>
          )}

          {/* Field comparison table */}
          {filteredComparison.length > 0 ? (
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
                <div className="w-[140px] shrink-0 pl-2">DB 欄位</div>
                <div className="w-5 shrink-0"></div>
                <div className="w-20 shrink-0 text-right">差異</div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {filteredComparison.map((row, i) => (
                  <FieldRow
                    key={i}
                    row={row}
                    verifiedData={verifiedFields}
                    entityName={entity.name}
                    onDeepDiff={(bubbleField, dbColumn) => setDeepDiffTarget({ bubbleField, dbColumn })}
                  />
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              <RefreshCw size={14} className="animate-spin inline mr-1" /> 載入欄位統計中...
            </div>
          ) : hasFieldStats && filteredComparison.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              ✓ 符合目前篩選條件的欄位為 0
            </div>
          ) : null}
        </div>
      )}

      {/* Deep Diff Modal */}
      {deepDiffTarget && (
        <DeepDiffModal
          entityName={entity.name}
          bubbleField={deepDiffTarget.bubbleField}
          dbColumn={deepDiffTarget.dbColumn}
          onClose={() => setDeepDiffTarget(null)}
        />
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
  const [showMappingEditor, setShowMappingEditor] = useState(null);
  const [customMappings, setCustomMappings] = useState(() => {
    try {
      const saved = localStorage.getItem("bubble_custom_mappings");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  useEffect(() => { loadBubbleInfo(); }, []);

  const loadBubbleInfo = async () => {
    setLoadingBubble(true);
    try {
      const res = await base44.functions.invoke("bubbleTableInfo", {});
      setBubbleInfo(res?.data || {});
    } catch (e) {
      console.warn("Failed to load Bubble table info:", e);
      setBubbleInfo({});
    } finally {
      setLoadingBubble(false);
    }
  };

  const loadEntityDetails = async (entityName) => {
    if (expandedEntity === entityName) { setExpandedEntity(null); return; }
    setExpandedEntity(entityName);
    if (!dbStats[entityName]) {
      try {
        const res = await base44.functions.invoke("bubbleDataStats", { entityName });
        setDbStats(prev => ({ ...prev, [entityName]: res.data }));
      } catch (e) { console.warn(`Failed DB stats for ${entityName}:`, e); }
    }
    if (!bubbleFieldStats[entityName]) {
      try {
        const res = await base44.functions.invoke("bubbleFieldStats", { entityName });
        setBubbleFieldStats(prev => ({ ...prev, [entityName]: res.data }));
      } catch (e) { console.warn(`Failed Bubble field stats for ${entityName}:`, e); }
    }
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

  const handleSaveMapping = (entityName, newMap) => {
    const updated = { ...customMappings, [entityName]: newMap };
    setCustomMappings(updated);
    localStorage.setItem("bubble_custom_mappings", JSON.stringify(updated));
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
          <p className="text-xs text-gray-400 mt-0.5">逐個欄位對比 Bubble.io 同 DB 嘅有值數量，支援深度差異分析</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowMappingEditor(expandedEntity || ENTITIES[0].name)}
            className="flex items-center gap-2 bg-gray-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-gray-700 transition-colors">
            <Settings size={14} /> Mapping 管理
          </button>
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
            customMappings={customMappings[entity.name] || null}
            onSyncDone={async (name) => {
              // Refresh DB stats for the synced entity
              try {
                const dbRes = await base44.functions.invoke("bubbleDataStats", { entityName: name });
                setDbStats(prev => ({ ...prev, [name]: dbRes.data }));
              } catch (e) { console.warn("Failed to refresh DB stats after sync:", e); }
            }}
          />
        ))}
      </div>

      {showImport && (
        <ImportBubbleModal
          onClose={() => setShowImport(false)}
          onDone={() => { loadBubbleInfo(); loadAllDb(); }}
        />
      )}

      {showMappingEditor && (
        <MappingEditorModal
          entityName={showMappingEditor}
          currentMap={FIELD_MAPS[showMappingEditor] || customMappings[showMappingEditor] || {}}
          onSave={handleSaveMapping}
          onClose={() => setShowMappingEditor(null)}
        />
      )}
    </div>
  );
}