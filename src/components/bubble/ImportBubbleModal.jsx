import { useState, useEffect } from "react";
import { X, Upload, Loader2, AlertTriangle, CheckCircle, Database, ChevronRight, Link2, Minus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { IMPORT_FIELD_MAPS, getEntityDbFields } from "@/lib/importFieldMaps";

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

function parseCSV(text) {
  // Proper CSV parser that handles quoted fields with newlines inside
  if (!text.trim()) return { headers: [], rows: [] };

  const records = [];
  let current = "";
  let inQuotes = false;
  const chars = text;

  // Split into records respecting quoted newlines
  const rawRecords = [];
  let rec = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      rec += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && chars[i + 1] === '\n') i++; // skip \r\n
      if (rec.trim()) rawRecords.push(rec);
      rec = "";
    } else {
      rec += ch;
    }
  }
  if (rec.trim()) rawRecords.push(rec);

  if (rawRecords.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let field = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { field += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        result.push(field);
        field = "";
      } else {
        field += ch;
      }
    }
    result.push(field);
    return result;
  };

  const headers = parseLine(rawRecords[0]).map(h => h.trim());
  const rows = [];
  for (let i = 1; i < rawRecords.length; i++) {
    const vals = parseLine(rawRecords[i]);
    const obj = {};
    headers.forEach((h, j) => { obj[h] = (vals[j] ?? "").trim(); });
    rows.push(obj);
  }
  return { headers, rows };
}

function autoMatchFields(fileHeaders, entityName) {
  const knownMap = IMPORT_FIELD_MAPS[entityName] || {};
  const mapping = {};
  for (const header of fileHeaders) {
    const h = header.trim();
    if (knownMap[h]) {
      mapping[h] = knownMap[h];
    } else {
      // Try lowercase / normalized match
      const hLow = h.toLowerCase().replace(/[\s_\-]+/g, "_");
      for (const [k, v] of Object.entries(knownMap)) {
        if (k.toLowerCase().replace(/[\s_\-]+/g, "_") === hLow) {
          mapping[h] = v;
          break;
        }
      }
    }
    if (!mapping[h]) mapping[h] = ""; // unmatched
  }
  return mapping;
}

export default function ImportBubbleModal({ onClose, onDone }) {
  const [selectedEntity, setSelectedEntity] = useState("");
  const [file, setFile] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [fileRowCount, setFileRowCount] = useState(0);
  const [sampleRows, setSampleRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("select"); // select | mapping | confirm | importing | done

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);

    // Parse file client-side to extract headers
    setParsing(true);
    const text = await f.text();
    const isJSON = f.name.endsWith(".json");

    let headers = [];
    let rowCount = 0;
    let samples = [];

    if (isJSON) {
      let parsed;
      try { parsed = JSON.parse(text); } catch { setError("JSON 格式錯誤"); setParsing(false); return; }
      const rows = Array.isArray(parsed) ? parsed : (parsed.results || parsed.response?.results || []);
      if (rows.length > 0) {
        headers = Object.keys(rows[0]);
        rowCount = rows.length;
        samples = rows.slice(0, 3);
      }
    } else {
      const { headers: h, rows } = parseCSV(text);
      headers = h;
      rowCount = rows.length;
      samples = rows.slice(0, 3);
    }

    setFileHeaders(headers);
    setFileRowCount(rowCount);
    setSampleRows(samples);
    setParsing(false);

    // Auto-match if entity already selected
    if (selectedEntity) {
      setMapping(autoMatchFields(headers, selectedEntity));
    }
  };

  // Re-match when entity changes
  useEffect(() => {
    if (selectedEntity && fileHeaders.length > 0) {
      setMapping(autoMatchFields(fileHeaders, selectedEntity));
    }
  }, [selectedEntity]);

  const dbFields = selectedEntity ? getEntityDbFields(selectedEntity) : [];
  const mappedCount = Object.values(mapping).filter(v => v).length;

  const handleGoToMapping = () => {
    if (!selectedEntity || !file || fileHeaders.length === 0) return;
    setStep("mapping");
  };

  const handleGoToConfirm = () => setStep("confirm");

  const [importStatus, setImportStatus] = useState("");

  const handleImport = async () => {
    setStep("importing");
    setImporting(true);
    setError(null);

    try {
      // Step 1: Upload file
      setImportStatus("上傳檔案中...");
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);

      // Step 2: Delete existing records from frontend (avoids backend timeout)
      setImportStatus("清除舊記錄中...(大數據量可能需要幾分鐘)");
      const entitySDK = base44.entities[selectedEntity];
      if (entitySDK?.deleteMany) {
        let totalDel = 0;
        for (let round = 0; round < 100; round++) {
          try {
            const result = await entitySDK.deleteMany({});
            const d = result?.deleted || 0;
            totalDel += d;
            setImportStatus(`清除舊記錄中... 已刪除 ${totalDel} 筆`);
            if (d === 0) break;
            // Small delay between rounds
            await new Promise(r => setTimeout(r, 1000));
          } catch (delErr) {
            // On connection error, wait and retry
            console.warn("deleteMany error, retrying...", delErr);
            await new Promise(r => setTimeout(r, 3000));
          }
        }
      }

      // Step 3: Call backend to insert only (skip delete)
      setImportStatus("匯入數據中...");
      const res = await base44.functions.invoke("importBubbleData", {
        entityName: selectedEntity,
        fileUrl: file_url,
        fieldMapping: mapping,
        fileType: file.name.endsWith(".json") ? "json" : "csv",
        skipDelete: true,
      });

      setResult(res.data);
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "匯入失敗");
      setStep("mapping");
    } finally {
      setImporting(false);
      setUploading(false);
      setImportStatus("");
    }
  };

  const entityLabel = ENTITIES.find(e => e.name === selectedEntity)?.label || selectedEntity;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black text-gray-900 flex items-center gap-2">
            <Database size={18} className="text-blue-500" />
            手動匯入 Bubble 數據
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Step: Select */}
          {step === "select" && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">目標實體 (Entity) *</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={selectedEntity}
                  onChange={e => setSelectedEntity(e.target.value)}
                >
                  <option value="">-- 選擇實體 --</option>
                  {ENTITIES.map(e => <option key={e.name} value={e.name}>{e.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">上傳 CSV 或 JSON 檔案 *</label>
                <p className="text-xs text-gray-400 mb-2">支援 CSV 及 JSON 格式</p>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 cursor-pointer transition-colors">
                  <Upload size={28} className="mx-auto mb-2 text-gray-400" />
                  {file ? (
                    <div>
                      <div className="text-sm font-semibold text-blue-600">{file.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB · {fileRowCount} 行 · {fileHeaders.length} 欄
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">點擊選擇檔案</div>
                  )}
                  <input type="file" accept=".json,.csv" className="hidden" onChange={handleFileChange} />
                </label>
                {parsing && <div className="text-xs text-blue-500 mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 解析中...</div>}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}
            </>
          )}

          {/* Step: Mapping */}
          {step === "mapping" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-800">欄位映射設定</div>
                  <div className="text-xs text-gray-400">{entityLabel} · {fileRowCount} 行 · 已配對 {mappedCount}/{fileHeaders.length} 欄</div>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">已配對 {mappedCount}</span>
                  <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">未配對 {fileHeaders.length - mappedCount}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-200 bg-gray-100">
                  <div className="w-[200px] shrink-0">檔案欄位</div>
                  <div className="w-8 shrink-0 text-center"></div>
                  <div className="flex-1">DB 欄位（可修改）</div>
                  <div className="w-[140px] shrink-0 text-right">範例值</div>
                </div>
                <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                  {fileHeaders.map(header => {
                    const dbVal = mapping[header] || "";
                    const sample = sampleRows[0]?.[header] ?? "";
                    const sampleStr = typeof sample === "object" ? JSON.stringify(sample).slice(0, 40) : String(sample).slice(0, 40);
                    const matched = !!dbVal;
                    return (
                      <div key={header} className={`flex items-center gap-2 px-3 py-2 ${matched ? "" : "bg-amber-50/50"}`}>
                        <div className="w-[200px] shrink-0 text-xs font-medium text-purple-700 truncate" title={header}>{header}</div>
                        <div className="w-8 shrink-0 text-center">
                          {matched ? <Link2 size={12} className="text-green-500 inline" /> : <Minus size={12} className="text-gray-300 inline" />}
                        </div>
                        <div className="flex-1">
                          <select
                            className={`w-full border rounded-md px-2 py-1.5 text-xs ${matched ? "border-green-200 bg-green-50 text-green-800" : "border-gray-200 bg-white text-gray-600"}`}
                            value={dbVal}
                            onChange={e => setMapping(m => ({ ...m, [header]: e.target.value }))}
                          >
                            <option value="">-- 不匯入 --</option>
                            {dbFields.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div className="w-[140px] shrink-0 text-right text-[10px] text-gray-400 truncate" title={sampleStr}>{sampleStr || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm"><AlertTriangle size={16} /> 確認覆蓋數據</div>
              <p className="text-xs text-amber-700">
                此操作將會<strong>刪除</strong> <span className="font-bold">{entityLabel}</span> 中的所有現有記錄，
                然後匯入檔案中的 <strong>{fileRowCount}</strong> 筆新數據。此操作無法撤銷。
              </p>
              <p className="text-xs text-amber-600">已配對 {mappedCount} 個欄位</p>
              <p className="text-xs text-amber-600">檔案：{file?.name}</p>
            </div>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="text-center py-10">
              <Loader2 size={40} className="animate-spin mx-auto text-blue-500 mb-4" />
              <div className="font-bold text-gray-800">{importStatus || "處理中..."}</div>
              <div className="text-sm text-gray-400 mt-1">正在處理 {entityLabel}，請勿關閉此視窗</div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && result && (
            <div className="space-y-3">
              <div className="text-center py-4">
                <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
                <div className="font-bold text-lg text-gray-900">匯入完成！</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-red-600">{result.deleted}</div>
                  <div className="text-xs text-gray-500">已刪除舊記錄</div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{result.created}</div>
                  <div className="text-xs text-gray-500">已匯入新記錄</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-600">{result.totalInFile}</div>
                  <div className="text-xs text-gray-500">檔案總行數</div>
                </div>
              </div>
              {result.transformErrors > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  ⚠ {result.transformErrors} 筆記錄轉換失敗
                  {result.errors?.length > 0 && (
                    <ul className="mt-1 space-y-0.5 list-disc list-inside">
                      {result.errors.map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t flex gap-2">
          {step === "select" && (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-bold text-gray-600">取消</button>
              <button onClick={handleGoToMapping} disabled={!selectedEntity || !file || fileHeaders.length === 0 || parsing}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                下一步：欄位映射 <ChevronRight size={14} />
              </button>
            </>
          )}
          {step === "mapping" && (
            <>
              <button onClick={() => setStep("select")} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-bold text-gray-600">返回</button>
              <button onClick={handleGoToConfirm} disabled={mappedCount === 0}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                下一步：確認匯入 <ChevronRight size={14} />
              </button>
            </>
          )}
          {step === "confirm" && (
            <>
              <button onClick={() => setStep("mapping")} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-bold text-gray-600">返回</button>
              <button onClick={handleImport} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
                確認覆蓋匯入
              </button>
            </>
          )}
          {step === "done" && (
            <button onClick={() => { onDone?.(); onClose(); }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}