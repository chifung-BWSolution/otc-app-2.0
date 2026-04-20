import { useState } from "react";
import { X, Upload, Loader2, AlertTriangle, CheckCircle, Database } from "lucide-react";
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

export default function ImportBubbleModal({ onClose, onDone }) {
  const [selectedEntity, setSelectedEntity] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("select"); // select | confirm | importing | done

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
    }
  };

  const handleConfirm = () => {
    if (!selectedEntity || !file) return;
    setStep("confirm");
  };

  const handleImport = async () => {
    setStep("importing");
    setImporting(true);
    setError(null);

    try {
      // 1. Upload the file
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);

      // 2. Call the import function
      const res = await base44.functions.invoke("importBubbleData", {
        entityName: selectedEntity,
        fileUrl: file_url,
      });

      setResult(res.data);
      setStep("done");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "匯入失敗");
      setStep("select");
    } finally {
      setImporting(false);
      setUploading(false);
    }
  };

  const entityLabel = ENTITIES.find(e => e.name === selectedEntity)?.label || selectedEntity;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-black text-gray-900 flex items-center gap-2">
            <Database size={18} className="text-blue-500" />
            手動匯入 Bubble 數據
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Step: Select entity + file */}
          {(step === "select" || step === "confirm") && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  目標實體 (Entity) *
                </label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={selectedEntity}
                  onChange={e => { setSelectedEntity(e.target.value); setStep("select"); }}
                >
                  <option value="">-- 選擇實體 --</option>
                  {ENTITIES.map(e => (
                    <option key={e.name} value={e.name}>{e.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  上傳 JSON 檔案 *
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  請上傳從 Bubble Data API 導出的 JSON 檔案（支援陣列或 {`{ results: [...] }`} 格式）
                </p>
                <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 cursor-pointer transition-colors">
                  <Upload size={28} className="mx-auto mb-2 text-gray-400" />
                  {file ? (
                    <div>
                      <div className="text-sm font-semibold text-blue-600">{file.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">點擊選擇 JSON 檔案</div>
                  )}
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Confirmation warning */}
              {step === "confirm" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <AlertTriangle size={16} />
                    確認覆蓋數據
                  </div>
                  <p className="text-xs text-amber-700">
                    此操作將會<strong>刪除</strong> <span className="font-bold">{entityLabel}</span> 中的所有現有記錄，
                    然後匯入檔案中的新數據。此操作無法撤銷。
                  </p>
                  <p className="text-xs text-amber-600">
                    檔案：{file?.name} ({(file?.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="text-center py-10">
              <Loader2 size={40} className="animate-spin mx-auto text-blue-500 mb-4" />
              <div className="font-bold text-gray-800">
                {uploading ? "上傳檔案中..." : "匯入數據中..."}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                正在處理 {entityLabel}，請勿關閉此視窗
              </div>
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
                      {result.errors.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.error}</li>
                      ))}
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
              <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-bold text-gray-600">
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedEntity || !file}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                下一步
              </button>
            </>
          )}
          {step === "confirm" && (
            <>
              <button onClick={() => setStep("select")} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-bold text-gray-600">
                返回
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
              >
                確認覆蓋匯入
              </button>
            </>
          )}
          {step === "done" && (
            <button
              onClick={() => { onDone?.(); onClose(); }}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
}