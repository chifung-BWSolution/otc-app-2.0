import { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, Sparkles, ArrowLeft, User, Bot, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import StaffDataPanel from "@/components/report/StaffDataPanel";
import StaffCompareSelector from "@/components/report/StaffCompareSelector";
import StaffComparePanel from "@/components/report/StaffComparePanel";
import ProjectContributionModal from "@/components/report/ProjectContributionModal";
import AppraisalReportModal from "@/components/report/AppraisalReportModal";

async function loadAll(entity, sort = "id", batchSize = 5000) {
  const all = [];
  let offset = 0;
  while (true) {
    const batch = await entity.filter({}, sort, batchSize, offset);
    all.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
  }
  return all;
}

export default function StaffAIAnalysis() {
  const params = new URLSearchParams(window.location.search);
  const staffId = params.get("staffId");
  const days = params.get("days") || "90";
  const customFrom = params.get("from");
  const customTo = params.get("to");

  const [loading, setLoading] = useState(true);
  const [staffRec, setStaffRec] = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [summary, setSummary] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const chatEndRef = useRef(null);
  const [compareIds, setCompareIds] = useState([]);
  const [contributionProject, setContributionProject] = useState(null);
  const [showAppraisalReport, setShowAppraisalReport] = useState(false);

  // Data for the left panel
  const [panelData, setPanelData] = useState(null);
  // Data for compare panel
  const [compareData, setCompareData] = useState(null);

  useEffect(() => { if (staffId) loadStaffData(); }, [staffId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadStaffData = async () => {
    setLoading(true);

    let cutoffStr, endStr;
    if (customFrom && customTo) {
      cutoffStr = customFrom;
      endStr = customTo;
    } else {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));
      cutoffStr = cutoff.toISOString().split("T")[0];
      endStr = new Date().toISOString().split("T")[0];
    }

    const [allStaff, dateList, taskTypeList, nosTaskList, projectList, kpiMonthList, kpiItemList] = await Promise.all([
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 500),
      loadAll(base44.entities.BubbleManHourDate, "-report_date"),
      base44.entities.NOSTaskType.filter({}, "display", 200),
      loadAll(base44.entities.NOSTask, "display"),
      loadAll(base44.entities.BubbleProject, "display_name"),
      loadAll(base44.entities.BubbleStaffKPIMonth, "-report_month"),
      loadAll(base44.entities.BubbleStaffKPI, "id"),
    ]);

    setAllStaff(allStaff);
    const rec = allStaff.find(s => s.id === staffId);
    setStaffRec(rec);
    if (!rec?.bubble_id) { setLoading(false); return; }

    const bubbleId = rec.bubble_id;

    // Build lookups
    const taskTypeMap = {};
    for (const t of taskTypeList) { if (t.bubble_id) taskTypeMap[t.bubble_id] = t; }
    const nosTaskMap = {};
    for (const t of nosTaskList) { if (t.bubble_id) nosTaskMap[t.bubble_id] = t; }
    const projectMap = {};
    for (const p of projectList) { if (p.bubble_id) projectMap[p.bubble_id] = p; }

    // Convert UTC to HKT (UTC+8) to get the real report date
    const toHKTDate = (isoStr) => {
      if (!isoStr) return null;
      const d = new Date(isoStr);
      const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000);
      return hkt.toISOString().slice(0, 10);
    };
    const allFilteredDates = dateList.filter(d => {
      if (!d.report_date) return false;
      const rd = toHKTDate(d.report_date);
      return rd && rd >= cutoffStr && rd <= endStr;
    });
    const myDates = allFilteredDates.filter(d => d.staff_id === bubbleId);
    const myDateIds = new Set(myDates.map(d => d.bubble_id).filter(Boolean));

    // Build dateMap: bubble_id -> report_date
    const dateMap = {};
    for (const d of dateList) { if (d.bubble_id) dateMap[d.bubble_id] = d.report_date; }

    // Load tasks
    const allDateIds = new Set(allFilteredDates.map(d => d.bubble_id).filter(Boolean));
    const allTasksList = await loadAll(base44.entities.BubbleManHourTask, "-created_date");
    const allFilteredTasks = allTasksList.filter(t => allDateIds.has(t.man_hour_date_id));
    const myTasks = allFilteredTasks.filter(t => myDateIds.has(t.man_hour_date_id));

    // KPI
    const myKpiMonths = kpiMonthList.filter(m => {
      if (m.staff_id !== bubbleId || !m.report_month) return false;
      const rm = toHKTDate(m.report_month);
      return rm && rm >= cutoffStr && rm <= endStr;
    });
    const myKpiMonthIds = new Set(myKpiMonths.map(m => m.bubble_id).filter(Boolean));
    const myKpis = kpiItemList.filter(k => myKpiMonthIds.has(k.staff_kpi_month_id));

    // Set panel data
    setPanelData({ myDates, myTasks, myKpis, projectMap, taskTypeMap, nosTaskMap, dateMap });

    // Set compare data (all dates + tasks + dateToStaff lookup)
    const dateToStaffMap = {};
    for (const d of allFilteredDates) { if (d.bubble_id && d.staff_id) dateToStaffMap[d.bubble_id] = d.staff_id; }
    setCompareData({ allDates: allFilteredDates, allTasks: allFilteredTasks, dateToStaff: dateToStaffMap });

    // === Build comparison stats for ALL staff ===
    const staffHours = {};
    const staffTaskCount = {};
    const dateToStaff = {};
    for (const d of allFilteredDates) {
      if (!d.staff_id) continue;
      staffHours[d.staff_id] = (staffHours[d.staff_id] || 0) + (d.total_work_hour || 0);
      if (d.bubble_id) dateToStaff[d.bubble_id] = d.staff_id;
    }
    for (const t of allFilteredTasks) {
      const sid = dateToStaff[t.man_hour_date_id];
      if (sid) staffTaskCount[sid] = (staffTaskCount[sid] || 0) + 1;
    }

    const activeStaffIds = Object.keys(staffHours);
    const allHoursArr = activeStaffIds.map(id => staffHours[id]);
    const avgAllHours = allHoursArr.length > 0 ? Math.round(allHoursArr.reduce((a, b) => a + b, 0) / allHoursArr.length) : 0;
    const maxHours = Math.max(...allHoursArr, 0);
    const minHours = Math.min(...allHoursArr, 0);

    // Same team comparison
    const sameTeamStaff = allStaff.filter(s => s.team_name === rec.team_name && s.bubble_id);
    const teamHoursArr = sameTeamStaff.map(s => staffHours[s.bubble_id] || 0).filter(h => h > 0);
    const avgTeamHours = teamHoursArr.length > 0 ? Math.round(teamHoursArr.reduce((a, b) => a + b, 0) / teamHoursArr.length) : 0;

    // Rank
    const sortedByHours = allHoursArr.sort((a, b) => b - a);
    const myHours = staffHours[bubbleId] || 0;
    const rank = sortedByHours.indexOf(myHours) + 1;

    // Resolve helpers
    const resolveTaskType = (t) => {
      if (t.task_type_id) { const tt = taskTypeMap[t.task_type_id]; if (tt) return tt.display; }
      if (t.task_id) { const nt = nosTaskMap[t.task_id]; if (nt?.task_type_ids?.length) { const tt = taskTypeMap[nt.task_type_ids[0]]; if (tt) return tt.display; } }
      return t.task_type_name || "未分類";
    };

    // Build summary with comparison
    const totalHours = myDates.reduce((s, d) => s + (d.total_work_hour || 0), 0);
    const reportDays = myDates.length;
    const avgDaily = reportDays > 0 ? (totalHours / reportDays).toFixed(1) : "0";

    const projMap2 = {};
    for (const t of myTasks) {
      const projName = t.project_name || projectMap[t.project_id]?.display_name || "未指定項目";
      if (!projMap2[projName]) projMap2[projName] = { hours: 0, count: 0, types: {} };
      projMap2[projName].hours += t.work_hour || 0;
      projMap2[projName].count++;
      const typeName = resolveTaskType(t);
      projMap2[projName].types[typeName] = (projMap2[projName].types[typeName] || 0) + (t.work_hour || 0);
    }
    const projectSummary = Object.entries(projMap2)
      .sort((a, b) => b[1].hours - a[1].hours)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        hours: Math.round(data.hours * 10) / 10,
        tasks: data.count,
        topTypes: Object.entries(data.types).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, h]) => `${t}(${Math.round(h * 10) / 10}h)`).join(", "),
      }));

    const typeMap2 = {};
    for (const t of myTasks) {
      const type = resolveTaskType(t);
      typeMap2[type] = (typeMap2[type] || 0) + (t.work_hour || 0);
    }
    const typeSummary = Object.entries(typeMap2).sort((a, b) => b[1] - a[1]).map(([name, hours]) => `${name}: ${Math.round(hours * 10) / 10}h`);

    const kpiScores = myKpis.filter(k => k.score).map(k => k.score);
    const avgKpi = kpiScores.length > 0 ? Math.round(kpiScores.reduce((a, b) => a + b, 0) / kpiScores.length * 10) / 10 : null;
    const kpiDetails = myKpis.filter(k => k.project_name || k.key_achievement).map(k =>
      `${k.project_name || k.key_achievement}: 分數${k.score || "—"}, 自評${k.self_score || "—"}, 領導建議${k.leader_suggest_score || "—"}`
    );

    const periodLabel = customFrom && customTo ? `${customFrom} 至 ${customTo}` : `最近 ${days} 天`;

    const summaryText = `
員工: ${rec.display_name} (${rec.full_name || ""})
職位: ${rec.position || "—"}
Team: ${rec.team_name || "—"} / BU: ${rec.bu_name || "—"}
時段: ${periodLabel}

【工時摘要】
- 總工時: ${Math.round(totalHours)}h
- 匯報天數: ${reportDays} 天
- 日均工時: ${avgDaily}h
- 任務數: ${myTasks.length}

【與其他同事比較】
- 全公司平均工時: ${avgAllHours}h（共 ${activeStaffIds.length} 位有匯報的員工）
- 全公司最高工時: ${Math.round(maxHours)}h，最低: ${Math.round(minHours)}h
- 同 Team (${rec.team_name || "—"}) 平均工時: ${avgTeamHours}h（${teamHoursArr.length}人）
- 該員工工時排名: 第 ${rank} 名 / ${activeStaffIds.length} 人
- 該員工工時 vs 全公司平均: ${totalHours > avgAllHours ? `高出 ${Math.round(totalHours - avgAllHours)}h` : totalHours < avgAllHours ? `低於 ${Math.round(avgAllHours - totalHours)}h` : "持平"}
- 該員工工時 vs Team 平均: ${totalHours > avgTeamHours ? `高出 ${Math.round(totalHours - avgTeamHours)}h` : totalHours < avgTeamHours ? `低於 ${Math.round(avgTeamHours - totalHours)}h` : "持平"}

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
      `${n} 的工時同其他同事比較如何？是否偏高或偏低？`,
      `${n} 的工時分配是否合理？有沒有過度集中在某類任務？`,
      `根據 ${n} 的數據，建議下季度可以設定甚麼 KPI 目標？`,
      `請為 ${n} 撰寫一段簡短的績效評語（用於 Appraisal）`,
      `${n} 同 Team 其他成員比較表現如何？`,
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

    const prompt = `你是一個專業的人力資源顧問和績效管理專家。以下是一位員工的工作數據摘要，包含與其他同事的比較數據：

${summary}

以下是之前的對話記錄：
${conversationHistory}

請根據以上數據回答用戶的最新問題。回答要專業、具體、有建設性。特別注意利用比較數據來給出客觀評價，不要只看個人數據就下結論。使用繁體中文回答。如果數據不足以回答，請說明並建議需要哪些額外資訊。`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setMessages([...newMessages, { role: "assistant", content: res }]);
    setThinking(false);
  };

  // staffMap by bubble_id for the contribution modal
  const staffBubbleMap = useMemo(() => {
    const m = {};
    for (const s of allStaff) { if (s.bubble_id) m[s.bubble_id] = s; }
    return m;
  }, [allStaff]);

  const periodLabel = customFrom && customTo ? `${customFrom} ~ ${customTo}` : `最近 ${days} 天`;

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
    <div className="space-y-3" style={{ height: "calc(100vh - 140px)" }}>
      {/* Appraisal Report Modal */}
      {showAppraisalReport && summary && (
        <AppraisalReportModal
          staffRec={staffRec}
          summary={summary}
          periodLabel={periodLabel}
          onClose={() => setShowAppraisalReport(false)}
        />
      )}
      {/* Project Contribution Modal */}
      {contributionProject && compareData && (
        <ProjectContributionModal
          projectName={contributionProject.name}
          projectBubbleId={contributionProject.bubbleId}
          allTasks={compareData.allTasks}
          dateToStaff={compareData.dateToStaff}
          allStaff={allStaff}
          staffMap={staffBubbleMap}
          nosTaskMap={panelData?.nosTaskMap}
          taskTypeMap={panelData?.taskTypeMap}
          onClose={() => setContributionProject(null)}
        />
      )}
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <Link to="/admin/performance-report" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            AI 績效分析 — {staffRec.display_name}
          </h2>
          <p className="text-xs text-gray-400">{staffRec.position || ""} · {staffRec.team_name || ""} · {periodLabel}</p>
        </div>
        <button onClick={() => setShowAppraisalReport(true)} disabled={!summary}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50">
          <FileText size={14} /> 生成考核報告
        </button>
        {allStaff.length > 0 && (
          <StaffCompareSelector
            allStaff={allStaff}
            currentStaffId={staffId}
            selectedIds={compareIds}
            onSelectionChange={setCompareIds}
          />
        )}
      </div>

      {/* Left/Right split */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100% - 56px)" }}>
        {/* Left: Data panel + compare */}
        <div className="w-[480px] shrink-0 flex flex-col gap-3 overflow-y-auto hidden lg:flex">
          <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-hidden">
            {panelData && (
              <StaffDataPanel
                staffRec={staffRec}
                myDates={panelData.myDates}
                myTasks={panelData.myTasks}
                myKpis={panelData.myKpis}
                projectMap={panelData.projectMap}
                taskTypeMap={panelData.taskTypeMap}
                nosTaskMap={panelData.nosTaskMap}
                dateMap={panelData.dateMap}
                onShowProjectContribution={(name, bubbleId) => setContributionProject({ name, bubbleId })}
              />
            )}
          </div>
          {compareIds.length > 0 && compareData && staffRec && (
            <StaffComparePanel
              currentStaff={staffRec}
              compareStaff={allStaff.filter(s => compareIds.includes(s.id))}
              allDates={compareData.allDates}
              allTasks={compareData.allTasks}
              dateToStaff={compareData.dateToStaff}
            />
          )}
        </div>

        {/* Right: Chat */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Sparkles size={14} className="text-purple-600" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                    <p className="text-sm text-gray-700">
                      你好！我已經分析了 <strong>{staffRec.display_name}</strong> 的工作數據，並準備了與全公司及同 Team 同事的比較。你可以問我任何關於這位員工績效的問題。
                    </p>
                  </div>
                </div>
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

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} className="text-purple-600" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user" ? "bg-gray-800 text-white rounded-tr-md" : "bg-gray-50 rounded-tl-md"
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
    </div>
  );
}