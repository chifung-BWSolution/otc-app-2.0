import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, CheckCircle2, Sparkles, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AppraisalScoring from "./AppraisalScoring";

export default function AppraisalReportDetail({ report, onBack, onUpdated }) {
  const [r, setR] = useState(report);
  const [chatMsg, setChatMsg] = useState("");
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [annualReview, setAnnualReview] = useState(null);

  // Fetch the original AnnualReview data for regeneration context
  useEffect(() => {
    if (report.annual_review_id) {
      base44.entities.AnnualReview.filter({ id: report.annual_review_id }, "id", 1)
        .then(res => { if (res.length > 0) setAnnualReview(res[0]); })
        .catch(() => {});
    }
  }, [report.annual_review_id]);

  const handleRegenerate = async () => {
    if (!chatMsg.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildRegeneratePrompt(r, chatMsg, annualReview),
        response_json_schema: {
          type: "object",
          properties: { report_markdown: { type: "string" } },
          required: ["report_markdown"]
        },
      });
      const content = res.report_markdown || res.report || (typeof res === "string" ? res : JSON.stringify(res));
      const newReport = await base44.entities.AppraisalReport.create({
        annual_review_id: r.annual_review_id,
        staff_id: r.staff_id,
        staff_name: r.staff_name,
        staff_team: r.staff_team,
        staff_bu: r.staff_bu,
        staff_position: r.staff_position,
        fiscal_year: r.fiscal_year,
        report_content: content,
        version: (r.version || 1) + 1,
        is_final: false,
        boss_feedback: chatMsg,
      });
      setR(newReport);
      onUpdated(newReport);
      setChatMsg("");
    } catch (err) {
      console.error("Regeneration failed:", err);
      alert("重新生成失敗：" + (err.message || "未知錯誤"));
    } finally {
      setGenerating(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    await base44.entities.AppraisalReport.update(r.id, { is_final: true });
    const updated = { ...r, is_final: true };
    setR(updated);
    onUpdated(updated);
    setConfirming(false);
  };

  const handleScoreUpdate = async (scores) => {
    const total = (scores.score_projects || 0) + (scores.score_contributions || 0) +
      (scores.score_challenges || 0) + (scores.score_goals || 0) +
      (scores.score_peer_review || 0) + (scores.score_attendance || 0);
    const data = { ...scores, total_score: total, scoring_completed: true };
    await base44.entities.AppraisalReport.update(r.id, data);
    const updated = { ...r, ...data };
    setR(updated);
    onUpdated(updated);
  };

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">{r.staff_name} 年度表現報告</h2>
          <p className="text-xs text-gray-400">
            {r.staff_position} · {r.staff_team} · {r.fiscal_year} · 版本 v{r.version}
          </p>
        </div>
        {r.scoring_completed ? (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <CheckCircle2 size={12} /> 已評分 ({r.total_score}分)
          </span>
        ) : r.is_final ? (
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">報告已確認</span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <Sparkles size={12} /> AI 草稿
          </span>
        )}
      </div>

      {/* Report content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <ReactMarkdown className="prose prose-sm prose-slate max-w-none text-sm leading-relaxed
          [&>h1]:text-lg [&>h1]:font-bold [&>h1]:mt-4 [&>h1]:mb-2
          [&>h2]:text-base [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:mb-2
          [&>h3]:text-sm [&>h3]:font-bold [&>h3]:mt-3 [&>h3]:mb-1
          [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5
          [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-300 [&>blockquote]:pl-3 [&>blockquote]:text-gray-600 [&>blockquote]:italic
        ">
          {r.report_content || "（報告內容為空）"}
        </ReactMarkdown>
      </div>

      {/* AI Chat — only if not yet confirmed */}
      {!r.is_final && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
            <h3 className="font-bold text-sm text-indigo-800 flex items-center gap-1.5">
              <Sparkles size={14} /> AI 報告調整
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">如對報告有任何修改要求，請在下方輸入，AI 會重新生成一份新版本</p>
          </div>
          <div className="p-4">
            <div className="flex gap-2">
              <textarea
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                rows={2}
                placeholder="例：項目貢獻部分寫多啲細節、語氣唔好咁正式..."
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                disabled={generating}
              />
              <button
                onClick={handleRegenerate}
                disabled={generating || !chatMsg.trim()}
                className="px-4 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
              >
                {generating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                重新生成
              </button>
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md"
              >
                {confirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                確認報告 OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoring — only after confirmed */}
      {r.is_final && (
        <AppraisalScoring report={r} onSave={handleScoreUpdate} />
      )}
    </div>
  );
}

function buildRegeneratePrompt(report, feedback, annualReview) {
  // Build original employee data section if available
  let originalDataSection = "";
  if (annualReview) {
    const ar = annualReview;
    const projects = (ar.project_contributions || []).filter(p => p.project_name && p.project_name !== "未指定項目");
    const projectsText = projects.map(p => {
      let line = `- ${p.project_name}: ${p.hours}h, ${p.tasks}個任務`;
      if (p.sales_amount > 0) line += `, 銷售額 $${p.sales_amount.toLocaleString()}`;
      if (p.contribution_note) {
        try { const arr = JSON.parse(p.contribution_note); if (Array.isArray(arr)) line += `\n  員工自述重點：${arr.join("；")}`; }
        catch { line += `\n  員工自述重點：${p.contribution_note}`; }
      }
      return line;
    }).join("\n") || "（無項目記錄）";

    originalDataSection = `

=== 員工年度評估原始資料（請參考） ===
📊 項目詳情：
${projectsText}

🏆 員工自述其他貢獻：${ar.other_contributions || "（未填寫）"}
⚡ 員工自述困難：${ar.challenges || "（未填寫）"}
⚡ 員工自述解決方法：${ar.challenges_solution || "（未填寫）"}
🎯 員工自述未來目標：${ar.next_year_goals || "（未填寫）"}
💬 員工對公司意見：${ar.company_feedback || "（未填寫）"}
`;
  }

  return `你是一位專業的人力資源顧問。以下是一份員工年度表現報告的現有版本：

---
${report.report_content}
---
${originalDataSection}
老闆對此報告有以下修改意見：
「${feedback}」

請根據老闆的修改意見，重新生成一份完整的員工年度表現報告。
重要：必須引用員工自述的具體項目貢獻重點和原文內容，不要只用籠統描述。
保持專業語調，結構清晰，使用 Markdown 格式。
必須包含以下所有部分：
1. 📊 項目工作貢獻分析
2. 🏆 其他貢獻 / 成就 / 創新 / 品牌升級
3. ⚡ 年度困難及解決方法評估
4. 🎯 未來一年目標評估
5. 👥 同事互評結果分析
6. 📋 考勤紀錄分析
7. 📝 整體評價及建議

用繁體中文撰寫。`;
}