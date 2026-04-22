import { useState } from "react";
import { X, FileText, Loader2, Printer, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function AppraisalReportModal({ staffRec, summary, periodLabel, onClose }) {
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    const prompt = `你是一位專業的人力資源總監。請根據以下員工數據，撰寫一份正式的「員工績效考核報告」(Appraisal Report)，格式如下：

員工數據：
${summary}

---

請輸出以下格式（用繁體中文，Markdown 格式）：

# 員工績效考核報告

**員工姓名：** ${staffRec.display_name}
**職位：** ${staffRec.position || "—"}
**團隊：** ${staffRec.team_name || "—"} / ${staffRec.bu_name || "—"}
**考核期間：** ${periodLabel}
**考核日期：** ${new Date().toISOString().split("T")[0]}

---

## 一、工作量及出勤表現
（根據工時數據、匯報天數、日均工時，與全公司及同Team比較，給出客觀評價，包含具體數字）

## 二、任務分配及工作重點
（根據任務類型分佈和參與項目，分析該員工的工作重心和專業領域）

## 三、關鍵項目貢獻
（列出主要參與的項目及貢獻情況，包含工時和任務數）

## 四、KPI 表現
（如有 KPI 數據，分析得分情況；如無則說明）

## 五、優勢與亮點
（根據數據指出 2-3 個突出表現）

## 六、改進建議
（根據數據指出 2-3 個可以改進的方向，要具體可行）

## 七、下季度發展建議
（提出具體的目標和發展方向建議）

## 八、整體評級

| 評核範疇 | 評級 |
|---------|------|
| 工作量 | ⭐⭐⭐⭐⭐ (X/5) |
| 工作質量 | ⭐⭐⭐⭐⭐ (X/5) |
| 主動性 | ⭐⭐⭐⭐⭐ (X/5) |
| 團隊合作 | ⭐⭐⭐⭐⭐ (X/5) |
| 整體表現 | ⭐⭐⭐⭐⭐ (X/5) |

## 九、考核人簽名

考核人：________________  日期：________________

員工確認：________________  日期：________________

---

請確保評語客觀、專業、有建設性，並基於提供的實際數據。每個評級都要根據數據給出合理的分數。`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setReport(res);
    setGenerating(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>績效考核報告 - ${staffRec.display_name}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6; font-size: 14px; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 24px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
  th { background: #f5f5f5; font-weight: 600; }
  strong { font-weight: 600; }
  p { margin: 8px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 20px 0; }
  @media print { body { padding: 20px; } }
</style>
</head><body>${document.getElementById("appraisal-report-content").innerHTML}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <FileText size={16} className="text-purple-500" />
              績效考核報告
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{staffRec.display_name} · {periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <>
                <button onClick={generateReport} disabled={generating}
                  className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors font-semibold">
                  <RotateCcw size={12} /> 重新生成
                </button>
                <button onClick={handlePrint}
                  className="flex items-center gap-1.5 text-xs bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-bold">
                  <Printer size={13} /> 列印 / PDF
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!report && !generating && (
            <div className="text-center py-16 space-y-4">
              <FileText size={48} className="mx-auto text-purple-200" />
              <div>
                <h4 className="font-bold text-gray-700 text-lg">生成績效考核報告</h4>
                <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                  AI 將根據 {staffRec.display_name} 的工時、任務、KPI 數據，自動撰寫一份專業的 Appraisal Report。生成後可預覽及列印。
                </p>
              </div>
              <button onClick={generateReport}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md">
                🤖 開始生成報告
              </button>
              <p className="text-[11px] text-gray-400">* 使用高級 AI 模型生成，需消耗較多積分</p>
            </div>
          )}

          {generating && (
            <div className="text-center py-20 space-y-3">
              <Loader2 size={32} className="animate-spin text-purple-500 mx-auto" />
              <p className="text-sm text-gray-500">正在生成報告，請稍候...</p>
              <p className="text-xs text-gray-400">通常需要 10-20 秒</p>
            </div>
          )}

          {report && !generating && (
            <div id="appraisal-report-content"
              className="prose prose-sm prose-gray max-w-none
                [&_h1]:text-center [&_h1]:text-xl [&_h1]:font-black [&_h1]:text-gray-900
                [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:border-b [&_h2]:border-gray-200 [&_h2]:pb-1 [&_h2]:mt-6
                [&_table]:w-full [&_table]:text-sm
                [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:px-3 [&_th]:py-2
                [&_td]:px-3 [&_td]:py-2
                [&_hr]:my-4
                [&_strong]:font-semibold">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}