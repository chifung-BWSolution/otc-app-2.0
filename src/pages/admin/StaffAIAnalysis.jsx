import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, Sparkles, ArrowLeft, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

export default function StaffAIAnalysis() {
  const params = new URLSearchParams(window.location.search);
  const staffId = params.get("staffId");
  const days = params.get("days") || "90";

  const [loading, setLoading] = useState(true);
  const [staffRec, setStaffRec] = useState(null);
  const [summary, setSummary] = useState(null); // pre-built data summary
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { if (staffId) loadStaffData(); }, [staffId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadStaffData = async () => {
    setLoading(true);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));
    const cutoffStr = cutoff.toISOString().split("T")[0];

    // Load staff record
    const allStaff = await base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 500);
    const rec = allStaff.find(s => s.id === staffId);
    setStaffRec(rec);
    if (!rec?.bubble_id) { setLoading(false); return; }

    const bubbleId = rec.bubble_id;

    // Load data in parallel
    const [dateList, taskTypeList, nosTaskList, projectList, kpiMonthList, kpiItemList] = await Promise.all([
      base44.entities.BubbleManHourDate.filter({}, "-report_date", 5000),
      base44.entities.NOSTaskType.filter({}, "display", 200),
      base44.entities.NOSTask.filter({}, "display", 500),
      base44.entities.BubbleProject.filter({}, "display_name", 5000),
      base44.entities.BubbleStaffKPIMonth.filter({}, "-report_month", 5000),
      base44.entities.BubbleStaffKPI.filter({}, "id", 5000),
    ]);

    // Build lookups
    const taskTypeMap = {};
    for (const t of taskTypeList) { if (t.bubble_id) taskTypeMap[t.bubble_id] = t; }
    const nosTaskMap = {};
    for (const t of nosTaskList) { if (t.bubble_id) nosTaskMap[t.bubble_id] = t; }
    const projectMap = {};
    for (const p of projectList) { if (p.bubble_id) projectMap[p.bubble_id] = p; }

    // Filter dates
    const myDates = dateList.filter(d => d.staff_id === bubbleId && d.report_date && d.report_date >= cutoffStr);
    const myDateIds = new Set(myDates.map(d => d.bubble_id).filter(Boolean));

    // Load tasks
    const allTasks = await base44.entities.BubbleManHourTask.filter({}, "-created_date", 5000);
    const myTasks = allTasks.filter(t => myDateIds.has(t.man_hour_date_id));

    // KPI
    const myKpiMonths = kpiMonthList.filter(m => m.staff_id === bubbleId && m.report_month && m.report_month >= cutoffStr);
    const myKpiMonthIds = new Set(myKpiMonths.map(m => m.bubble_id).filter(Boolean));
    const myKpis = kpiItemList.filter(k => myKpiMonthIds.has(k.staff_kpi_month_id));

    // Resolve helpers
    const resolveTaskType = (t) => {
      if (t.task_type_id) { const tt = taskTypeMap[t.task_type_id]; if (tt) return tt.display; }
      if (t.task_id) { const nt = nosTaskMap[t.task_id]; if (nt?.task_type_ids?.length) { const tt = taskTypeMap[nt.task_type_ids[0]]; if (tt) return tt.display; } }
      return t.task_type_name || "未分類";
    };
    const resolveTaskName = (t) => {
      if (t.task_id) { const nt = nosTaskMap[t.task_id]; if (nt) return nt.display; }
      return t.task_name || t.keywords || "—";
    };

    // Build summary
    const totalHours = myDates.reduce((s, d) => s + (d.total_work_hour || 0), 0);
    const reportDays = myDates.length;
    const avgDaily = reportDays > 0 ? (totalHours / reportDays).toFixed(1) : "0";

    // Project breakdown
    const projMap = {};
    for (const t of myTasks) {
      const projName = t.project_name || projectMap[t.project_id]?.display_name || "未指定項目";
      if (!projMap[projName]) projMap[projName] = { hours: 0, count: 0, types: {} };
      projMap[projName].hours += t.work_hour || 0;
      projMap[projName].count++;
      const typeName = resolveTaskType(t);
      projMap[projName].types[typeName] = (projMap[projName].types[typeName] || 0) + (t.work_hour || 0);
    }
    const projectSummary = Object.entries(projMap)
      .sort((a, b) => b[1].hours - a[1].hours)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        hours: Math.round(data.hours * 10) / 10,
        tasks: data.count,
        topTypes: Object.entries(data.types).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, h]) => `${t}(${Math.round(h * 10) / 10}h)`).join(", "),
      }));

    // Task type breakdown
    const typeMap = {};
    for (const t of myTasks) {
      const type = resolveTaskType(t);
      typeMap[type] = (typeMap[type] || 0) + (t.work_hour || 0);
    }
    const typeSummary = Object.entries(typeMap).sort((a, b) => b[1] - a[1]).map(([name, hours]) => `${name}: ${Math.round(hours * 10) / 10}h`);

    // KPI summary
    const kpiScores = myKpis.filter(k => k.score).map(k => k.score);
    const avgKpi = kpiScores.length > 0 ? Math.round(kpiScores.reduce((a, b) => a + b, 0) / kpiScores.length * 10) / 10 : null;
    const kpiDetails = myKpis.filter(k => k.project_name || k.key_achievement).map(k =>
      `${k.project_name || k.key_achievement}: 分數${k.score || "—"}, 自評${k.self_score || "—"}, 領導建議${k.leader_suggest_score || "—"}`
    );

    const summaryText = `
員工: ${rec.display_name} (${rec.full_name || ""})
職位: ${rec.position || "—"}
Team: ${rec.team_name || "—"} / BU: ${rec.bu_name || "—"}
時段: 最近 ${days} 天

【工時摘要】
- 總工時: ${Math.round(totalHours)}h
- 匯報天數: ${reportDays} 天
- 日均工時: ${avgDaily}h
- 任務數: ${myTasks.length}

【任務類型分佈】
${typeSummary.join("\n")}

【參與項目】
${projectSummary.map(p => `- ${p.name}: ${p.hours}h (${p.tasks}個任務) [${p.topTypes}]`).join("\n")}

【KPI】
- 平均分: ${avgKpi ?? "無記錄"}
${kpiDetails.length > 0 ? kpiDetails.join("\n") : "暫無 KPI 明細"}
`.trim();

    setSummary(summaryText);
    setLoading(false);
  };

  const presetQuestions = useMemo(() => {
    if (!staffRec) return [];
    const n = staffRec.display_name || "該員工";
    return [
      `請分析 ${n} 的工作表現，指出優勢和需要改進的地方`,
      `${n} 的工時分配是否合理？有沒有過度集中在某類任務？`,
      `根據 ${n} 的數據，建議下季度可以設定甚麼 KPI 目標？`,
      `${n} 的項目參與度如何？是否需要調整工作分配？`,
      `請為 ${n} 撰寫一段簡短的績效評語（用於 Appraisal）`,
      `${n} 的日均工時是否正常？有甚麼需要關注的？`,
    ];
  }, [staffRec]);

  const sendMessage = async (text) => {
    if (!text.trim() || !summary || thinking) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setThinking(true);

    const conversationHistory = newMessages.map(m => `${m.role === "user" ? "用戶" : "AI"}: ${m.content}`).join("\n\n");

    const prompt = `你是一個專業的人力資源顧問和績效管理專家。以下是一位員工的工作數據摘要：

${summary}

以下是之前的對話記錄：
${conversationHistory}

請根據以上數據回答用戶的最新問題。回答要專業、具體、有建設性。使用繁體中文回答。如果數據不足以回答，請說明並建議需要哪些額外資訊。`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setMessages([...newMessages, { role: "assistant", content: res }]);
    setThinking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
        <span className="ml-2 text-gray-400 text-sm">載入員工數據中...</span>
      </div>
    );
  }

  if (!staffRec) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>找不到該員工資料</p>
        <Link to="/admin/performance-report" className="text-blue-500 text-sm mt-2 inline-block">← 返回績效報告</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Link to="/admin/performance-report" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          {staffRec.profile_pic ? (
            <img src={staffRec.profile_pic} className="w-10 h-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
              {(staffRec.display_name || "?")[0]}
            </div>
          )}
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              AI 績效分析 — {staffRec.display_name}
            </h2>
            <p className="text-xs text-gray-400">{staffRec.position || ""} · {staffRec.team_name || ""} · 最近 {days} 天數據</p>
          </div>
        </div>
      </div>

      {/* Data summary (collapsible) */}
      <details className="bg-gray-50 rounded-xl border border-gray-200 shrink-0">
        <summary className="px-4 py-2.5 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 rounded-xl">
          📊 員工數據摘要（點擊展開）
        </summary>
        <pre className="px-4 pb-3 text-xs text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">{summary}</pre>
      </details>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-purple-600" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-gray-700">
                    你好！我已經分析了 <strong>{staffRec.display_name}</strong> 最近 {days} 天的工作數據。你可以問我任何關於這位員工績效的問題，或者點擊下方的預設問題快速開始。
                  </p>
                </div>
              </div>

              {/* Preset questions */}
              <div className="pl-11">
                <p className="text-xs text-gray-400 mb-2">💡 建議問題：</p>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-left border border-purple-100">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="text-purple-600" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gray-800 text-white rounded-tr-md"
                  : "bg-gray-50 rounded-tl-md"
              }`}>
                {msg.role === "user" ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <ReactMarkdown className="text-sm prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {thinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-purple-600 animate-pulse" />
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 size={14} className="animate-spin" /> 分析中...
                </div>
              </div>
            </div>
          )}

          {/* Show preset questions again after conversation */}
          {messages.length > 0 && !thinking && (
            <div className="pl-11 pt-2">
              <p className="text-xs text-gray-400 mb-1.5">💡 繼續問：</p>
              <div className="flex flex-wrap gap-1.5">
                {presetQuestions.filter(q => !messages.some(m => m.content === q)).slice(0, 3).map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    className="text-[11px] bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-left border border-gray-200">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-3 flex gap-2 shrink-0">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50"
            placeholder="輸入你想問的問題..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            disabled={thinking}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || thinking}
            className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <Send size={14} /> 發送
          </button>
        </div>
      </div>
    </div>
  );
}