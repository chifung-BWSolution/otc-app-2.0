import { useState, useRef } from "react";
import { X, FileText, Loader2, Printer, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

export default function AppraisalReportModal({ staffRec, summary, periodLabel, onClose }) {
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

  const generateReport = async () => {
    setGenerating(true);
    const prompt = `你是一位專業的人力資源總監。請根據以下員工數據，撰寫一份正式的「員工績效考核報告」(Appraisal Report)。

員工數據：
${summary}

請用繁體中文 Markdown 格式輸出，嚴格按以下結構：

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
| 工作量 | X/5 |
| 工作質量 | X/5 |
| 主動性 | X/5 |
| 團隊合作 | X/5 |
| 整體表現 | X/5 |

## 九、考核人簽名

考核人：________________　　日期：________________

員工確認：________________　　日期：________________

---

重要：
- 所有評語必須客觀、專業、有建設性，基於提供的實際數據
- 不要使用星號emoji表示評級，直接用數字 X/5
- 表格用標準 Markdown pipe 語法
- 段落之間用空行分隔`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
    setReport(res);
    setGenerating(false);
  };

  const handlePrint = () => {
    if (!reportRef.current) return;
    const content = reportRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<title>績效考核報告 - ${staffRec.display_name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft JhengHei', sans-serif;
    max-width: 780px; margin: 0 auto; padding: 48px 40px; color: #1a1a1a;
    line-height: 1.7; font-size: 14px;
  }
  h1 { text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 20px; letter-spacing: 2px; }
  h2 { font-size: 16px; font-weight: 700; margin-top: 28px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #e5e5e5; color: #333; }
  p { margin: 6px 0; }
  strong { font-weight: 600; }
  ul, ol { margin: 8px 0 8px 20px; }
  li { margin: 3px 0; }
  hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  th, td { border: 1px solid #ccc; padding: 10px 14px; text-align: left; }
  th { background-color: #f2f2f2; font-weight: 600; }
  td { background-color: #fff; }
  @media print {
    body { padding: 24px; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
  }
</style>
</head><body>${content}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 600);
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
        <div className="flex-1 overflow-y-auto p-8">
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
            <div ref={reportRef} className="appraisal-report-preview">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 style={{ textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 16, letterSpacing: 2 }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 28, marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #e5e5e5", color: "#333" }}>{children}</h2>,
                  p: ({ children }) => <p style={{ margin: "6px 0", lineHeight: 1.7, fontSize: 14 }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
                  hr: () => <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "24px 0" }} />,
                  ul: ({ children }) => <ul style={{ margin: "8px 0 8px 20px", listStyleType: "disc" }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: "8px 0 8px 20px", listStyleType: "decimal" }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: "3px 0", fontSize: 14 }}>{children}</li>,
                  table: ({ children }) => (
                    <table style={{ width: "100%", borderCollapse: "collapse", margin: "16px 0", fontSize: 13 }}>{children}</table>
                  ),
                  thead: ({ children }) => <thead>{children}</thead>,
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => <tr>{children}</tr>,
                  th: ({ children }) => (
                    <th style={{ border: "1px solid #ccc", padding: "10px 14px", textAlign: "left", backgroundColor: "#f2f2f2", fontWeight: 600 }}>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td style={{ border: "1px solid #ccc", padding: "10px 14px", textAlign: "left" }}>{children}</td>
                  ),
                }}
              >
                {report}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}