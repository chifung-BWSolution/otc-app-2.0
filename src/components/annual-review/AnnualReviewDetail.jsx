import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Calendar, Clock, AlertTriangle, Coffee, Sparkles } from "lucide-react";
import PeerReviewResultSection from "@/components/peer-review/PeerReviewResultSection";
import MeritsDemeritsList from "./MeritsDemeritsList";
import ScoringBreakdown, { calcSectionScore, calcAttendanceAdj, calcMeritAdj, f2 } from "./ScoringBreakdown";
import BossNotesSection from "./BossNotesSection";


const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", active: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", active: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", active: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", active: "bg-red-500" },
};

async function loadAll(entity, sort = "id", batchSize = 5000) {
  const all = [];
  let offset = 0;
  while (true) {
    let batch;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { batch = await entity.filter({}, sort, batchSize, offset); break; }
      catch (err) { if (attempt === 2) throw err; await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); }
    }
    all.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
    await new Promise(r => setTimeout(r, 500));
  }
  return all;
}

const toLocalDate = (val) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const cleaned = val.split(' ')[0];
  const parts = cleaned.split('/');
  if (parts.length === 3) { const [d, m, y] = parts; return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  if (val.includes('T')) { const d = new Date(val); const hkt = new Date(d.getTime() + 8 * 60 * 60 * 1000); return hkt.toISOString().slice(0, 10); }
  return null;
};

// Parse FY label → { start, end }
function parseFY(fyLabel) {
  const match = fyLabel.match(/FY(\d{4})\/(\d{4})/);
  if (!match) return null;
  const y = parseInt(match[1]);
  return { start: `${y}-04-01`, end: `${y + 1}-03-31` };
}

// Parse datetime string to JS Date in HKT context
function parseToDate(val) {
  if (!val) return null;
  if (val.includes('T')) return new Date(val);
  // D/M/YYYY H:MM format
  const [datePart, timePart] = val.split(' ');
  const parts = datePart.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const [hh, mm] = (timePart || '0:00').split(':');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm));
  }
  return new Date(val);
}

export default function AnnualReviewDetail({ review: initialReview, onBack }) {
  const [review, setReview] = useState(initialReview);
  const navigate = useNavigate();
  const r = review;
  const [loading, setLoading] = useState(true);
  const refreshReview = async () => {
    const updated = await base44.entities.AnnualReview.filter({ id: r.id }, "id", 1);
    if (updated.length > 0) setReview(updated[0]);
  };
  const [generatingAI, setGeneratingAI] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [allProjectSummary, setAllProjectSummary] = useState([]);
  const [scoreLevels, setScoreLevels] = useState([]);
  const [bossProjectScores, setBossProjectScores] = useState({});
  const [bossExtraScores, setBossExtraScores] = useState({});
  const [savingBoss, setSavingBoss] = useState(false);
  const [meritRecords, setMeritRecords] = useState([]);
  const [meritTypes, setMeritTypes] = useState([]);
  const [bossAdjustment, setBossAdjustment] = useState(r.boss_score_adjustment || 0);
  const [bossDeptGoals, setBossDeptGoals] = useState(r.boss_dept_goals || []);
  const [bossPersonalGoals, setBossPersonalGoals] = useState(r.boss_personal_goals || []);
  const [bossExtraNotes, setBossExtraNotes] = useState(r.boss_extra_notes || "");

  // Init boss scores from review data
  useEffect(() => {
    base44.entities.ScoreLevel.filter({ is_active: true }, "-score", 100).then(setScoreLevels);
    base44.entities.MeritDemeritType.filter({ is_active: true }, "sort_order", 100).then(setMeritTypes);
    const ps = {};
    (r.project_contributions || []).forEach((p, i) => { if (p.boss_score > 0) ps[i] = p.boss_score; });
    setBossProjectScores(ps);
    const es = {};
    (r.extra_contributions || []).forEach((e, i) => { if (e.boss_score > 0) es[i] = e.boss_score; });
    setBossExtraScores(es);
  }, [r.id]);

  const canBossScore = r.status === "pending_boss_review" || r.status === "pending_boss";

  const handleSaveBossScores = async () => {
    setSavingBoss(true);
    const updatedProjects = (r.project_contributions || []).map((p, i) => ({
      ...p, boss_score: bossProjectScores[i] || p.boss_score || null,
    }));
    const updatedExtras = (r.extra_contributions || []).map((e, i) => ({
      ...e, boss_score: bossExtraScores[i] || e.boss_score || null,
    }));
    await base44.entities.AnnualReview.update(r.id, {
      project_contributions: updatedProjects,
      extra_contributions: updatedExtras,
      boss_score_adjustment: bossAdjustment,
      boss_dept_goals: bossDeptGoals.filter(g => g.trim()),
      boss_personal_goals: bossPersonalGoals.filter(g => g.trim()),
      boss_extra_notes: bossExtraNotes,
    });
    setSavingBoss(false);
    refreshReview();
  };

  const allProjects = (r.project_contributions || []).filter(p => p.project_name && p.project_name !== "未指定項目");
  const extras = r.extra_contributions || [];
  const totalHours = allProjects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = allProjects.reduce((s, p) => s + (p.tasks || 0), 0);
  const totalSales = allProjects.reduce((s, p) => s + (p.sales_amount || 0), 0);

  // Split: projects with actual contribution notes/sales vs the rest
  const hasContribution = (p) => {
    if (p.sales_amount > 0) return true;
    if (!p.contribution_note) return false;
    try {
      const arr = JSON.parse(p.contribution_note);
      return Array.isArray(arr) && arr.some(s => {
        if (typeof s === "object") return s.text?.trim();
        return typeof s === "string" && s.trim();
      });
    } catch {}
    return p.contribution_note.trim().length > 0;
  };
  const contributedProjects = useMemo(() => allProjects.filter(hasContribution), [allProjects]);
  const contributedProjectNames = useMemo(() => new Set(contributedProjects.map(p => p.project_name)), [contributedProjects]);

  const fy = parseFY(r.fiscal_year);

  useEffect(() => {
    if (fy && r.staff_id) loadAttendanceStats();
    if (r.staff_id && fy) {
      base44.entities.BubbleMeritsDemerits.filter({ staff_id: r.staff_id }, "-event_date", 200)
        .then(records => {
          // Filter to only records within the FY date range
          const filtered = records.filter(rec => {
            if (!rec.event_date) return false;
            const d = toLocalDate(rec.event_date);
            return d && d >= fy.start && d <= fy.end;
          });
          setMeritRecords(filtered);
        });
    }
  }, [r.staff_id, r.fiscal_year]);

  const handleGenerateAppraisal = async () => {
    if (generatingAI) return; // prevent double-click
    setGeneratingAI(true);
    try {
    // Build a comprehensive prompt from all data
    const projectsText = allProjects.map(p => {
      let line = `- ${p.project_name}: ${p.hours}h, ${p.tasks}個任務`;
      if (p.sales_amount > 0) line += `, 銷售額 $${p.sales_amount.toLocaleString()}`;
      if (p.self_score > 0) line += `, 自評分數：${p.self_score}/5`;
      if (p.contribution_note) {
        try {
          const arr = JSON.parse(p.contribution_note);
          if (Array.isArray(arr)) {
            const formatted = arr.map(pt => {
              if (typeof pt === "object" && pt.type) return `[${pt.type}] ${pt.text}`;
              return typeof pt === "string" ? pt : pt.text || "";
            }).filter(s => s.trim());
            if (formatted.length > 0) line += `\n  員工自述貢獻重點：${formatted.join("；")}`;
          }
        } catch { line += `\n  員工自述貢獻重點：${p.contribution_note}`; }
      }
      return line;
    }).join("\n") || "（無項目記錄）";

    const attText = attendanceStats ? `上班日 ${attendanceStats.workDays} / 匯報日 ${attendanceStats.reportDays}，遲到 ${attendanceStats.totalLateMinutes} 分鐘，自願加班 ${attendanceStats.voluntaryOTMinutes} 分鐘，無薪假 ${attendanceStats.ulDays} 日（事假 ${attendanceStats.ulPersonalDays} 日、病假 ${attendanceStats.ulSickDays} 日）` : "（考勤數據未載入）";

    // Load peer reviews for summary
    let peerText = "（無互評數據）";
    try {
      const peers = await base44.entities.PeerReview.filter(
        { reviewee_staff_id: r.staff_id, fiscal_year: r.fiscal_year, status: "submitted" },
        "-created_date", 200
      );
      if (peers.length > 0) {
        peerText = `共收到 ${peers.length} 份互評。`;
        const comments = peers.filter(p => p.comment && p.comment.trim()).map(p => `${p.reviewer_name}：${p.comment}`);
        if (comments.length > 0) peerText += `\n同事評語：\n${comments.join("\n")}`;
      }
    } catch {}

    const prompt = `你是一位專業的人力資源顧問，請根據以下員工年度評估資料，生成一份結構清晰、專業的年度表現整合報告。

員工：${r.staff_name}
職位：${r.staff_position}
Team：${r.staff_team} / BU：${r.staff_bu}
年度：${r.fiscal_year}

=== 📊 項目工作摘要 ===
總參與項目：${allProjects.length}
總工時：${Math.round(totalHours)}h / 總任務數：${totalTasks}
${totalSales > 0 ? `總銷售額：$${totalSales.toLocaleString()}` : ""}
項目詳情：
${projectsText}

=== ⚡ 年度遇到的困難 ===
困難：${r.challenges || "（未填寫）"}
解決方法：${r.challenges_solution || "（未填寫）"}

=== 🎯 未來一年目標 ===
${r.next_year_goals || "（未填寫）"}

=== 💬 對公司的意見 ===
${r.company_feedback || "（未填寫）"}

=== 👥 同事互評結果 ===
${peerText}

=== 📋 考勤紀錄 ===
${attText}

請按以下結構生成報告（使用 Markdown 格式，繁體中文）：
1. ## 📊 項目工作貢獻分析 — 分析項目貢獻的深度和廣度，突出亮點
2. ## ⚡ 年度困難及解決方法評估 — 評價面對挑戰的態度和解決能力
3. ## 🎯 未來一年目標評估 — 評價目標設定的合理性和進取性
4. ## 👥 同事互評結果分析 — 綜合同事的評價，提煉關鍵訊息
5. ## 📋 考勤紀錄分析 — 分析出勤表現
6. ## 📝 整體評價及建議 — 給出綜合評價和發展建議

每個部分要具體分析，不要空泛。語氣專業但有建設性。
重要：在項目工作貢獻分析中，必須引用員工自己填寫的「重點」內容（即 contribution_note），逐個項目具體描述員工的貢獻，不要只用籠統語句概括。`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: { report_markdown: { type: "string" } },
        required: ["report_markdown"]
      },
    });

    console.log("AI response:", res);
    const content = res.report_markdown || res.report || (typeof res === "string" ? res : JSON.stringify(res));

    const newReport = await base44.entities.AppraisalReport.create({
      annual_review_id: r.id,
      staff_id: r.staff_id,
      staff_name: r.staff_name,
      staff_team: r.staff_team,
      staff_bu: r.staff_bu,
      staff_position: r.staff_position,
      fiscal_year: r.fiscal_year,
      report_content: content,
      version: 1,
      is_final: false,
    });

    // After generating report, move to pending_boss (待面談)
    if (r.status === "pending_boss_review") {
      await base44.entities.AnnualReview.update(r.id, { status: "pending_boss" });
    }

    navigate(`/admin/appraisal-reports?reportId=${newReport.id}`);
    } catch (err) {
      console.error("AI generation failed:", err);
      alert("AI 報告生成失敗：" + (err.message || "未知錯誤"));
    } finally {
      setGeneratingAI(false);
    }
  };

  const loadAttendanceStats = async () => {
    setLoading(true);
    const staffId = r.staff_id;

    // Load staff list, clockins, leaves, and region settings
    const [staffList, clockinList, leaveList, regionList] = await Promise.all([
      base44.entities.Staff.list("display_name", 2000),
      loadAll(base44.entities.BubbleClockin, "id"),
      loadAll(base44.entities.BubbleLeave, "id"),
      base44.entities.Region.filter({ is_active: true }, "sort_order", 50),
    ]);

    // Also load man hour dates + tasks for project summary
    const [dateList, taskList] = await Promise.all([
      loadAll(base44.entities.BubbleManHourDate, "-report_date"),
      loadAll(base44.entities.BubbleManHourTask, "-created_date"),
    ]);

    // Build staff_name → bubble_id lookup (clockin often has staff_name but null staff_id)
    const staffNameToBubbleId = {};
    const staffBubbleIdToName = {};
    for (const s of staffList) {
      if (s.bubble_id && s.display_name) {
        staffNameToBubbleId[s.display_name] = s.bubble_id;
        staffBubbleIdToName[s.bubble_id] = s.display_name;
      }
    }
    const staffName = staffBubbleIdToName[staffId] || r.staff_name;

    // Resolve region for this staff to get work schedule
    const staffRec = staffList.find(s => s.bubble_id === staffId);
    const staffRegion = regionList.find(reg => {
      if (staffRec?.staff_region) return reg.code === staffRec.staff_region;
      const loc = (staffRec?.o_base_location || "").toLowerCase();
      return (reg.base_locations || []).some(v => v && loc.includes(v.toLowerCase()));
    }) || regionList[0];

    // Parse HH:MM to total minutes
    const parseTime = (t, fallback) => {
      if (!t) return fallback;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + (m || 0);
    };
    const weekdayEndMin = parseTime(staffRegion?.work_end, 18 * 60 + 30);
    const satEndMin = parseTime(staffRegion?.sat_training_end, 13 * 60 + 30);

    // === Work days (clockin) vs Report days ===
    // Match clockins by staff_id OR staff_name
    const myClockins = clockinList.filter(c => {
      if (!c.clockin_time) return false;
      if (c.staff_id === staffId) return true;
      if (!c.staff_id && c.staff_name) {
        const mappedId = staffNameToBubbleId[c.staff_name];
        return mappedId === staffId;
      }
      return false;
    });

    const clockinDates = new Set();
    let totalLateMinutes = 0;
    let voluntaryOTMinutes = 0;

    for (const c of myClockins) {
      const d = toLocalDate(c.clockin_time);
      if (!d || d < fy.start || d > fy.end) continue;
      clockinDates.add(d);

      // Late minutes
      if (c.late_minutes && c.late_minutes > 0) {
        totalLateMinutes += c.late_minutes;
      }

      // Voluntary OT: weekdays clock out after work_end, Saturday after sat_training_end
      // Then subtract approved OT minutes
      if (c.clock_out_time) {
        const outDate = parseToDate(c.clock_out_time);
        if (outDate) {
          const outLocalDate = toLocalDate(c.clock_out_time);
          if (outLocalDate && outLocalDate >= fy.start && outLocalDate <= fy.end) {
            const dayOfWeek = outDate.getDay(); // 0=Sun, 6=Sat
            const outHour = outDate.getHours();
            const outMin = outDate.getMinutes();
            const outTotalMin = outHour * 60 + outMin;

            let threshold = null;
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              threshold = weekdayEndMin;
            } else if (dayOfWeek === 6) {
              threshold = satEndMin;
            }

            if (threshold !== null && outTotalMin > threshold) {
              let extraMin = outTotalMin - threshold;
              const approvedOT = c.ot_minutes || 0;
              extraMin = Math.max(0, extraMin - approvedOT);
              voluntaryOTMinutes += extraMin;
            }
          }
        }
      }
    }

    // Report days (man hour dates with tasks)
    const myDates = dateList.filter(d => {
      if (d.staff_id !== staffId) return false;
      const rd = toLocalDate(d.report_date);
      return rd && rd >= fy.start && rd <= fy.end;
    });
    const myDateIds = new Set(myDates.map(d => d.bubble_id).filter(Boolean));
    const myTasks = taskList.filter(t => myDateIds.has(t.man_hour_date_id));
    const dateIdsWithTasks = new Set(myTasks.map(t => t.man_hour_date_id).filter(Boolean));
    const reportDates = new Set();
    for (const d of myDates) {
      if (d.bubble_id && dateIdsWithTasks.has(d.bubble_id)) {
        const rd = toLocalDate(d.report_date);
        if (rd) reportDates.add(rd);
      }
    }

    // Build ALL project summary from tasks, exclude "未指定項目"
    const projAgg = {};
    for (const t of myTasks) {
      const projName = t.project_name;
      if (!projName) continue;
      if (!projAgg[projName]) projAgg[projName] = { project_name: projName, hours: 0, tasks: 0 };
      projAgg[projName].hours += t.work_hour || 0;
      projAgg[projName].tasks += 1;
    }
    const allProjs = Object.values(projAgg)
      .map(p => ({ ...p, hours: Math.round(p.hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);
    setAllProjectSummary(allProjs);

    // === No-pay leave ===
    // Match by staff_id, filter by FY date, only approved leaves
    const myLeaves = leaveList.filter(l => {
      if (l.staff_id !== staffId) return false;
      if (l.approved !== true) return false;
      const dn = (l.display_name || "");
      const isUnpaid = dn.includes("無薪") || dn.toLowerCase().includes("unpaid") || dn.toLowerCase().includes("no pay");
      if (!isUnpaid) return false;
      const sd = toLocalDate(l.start_date_time || l.end_date_time);
      return sd && sd >= fy.start && sd <= fy.end;
    });

    // Separate 無薪事假 vs 無薪病假
    const ulPersonalLeaves = myLeaves.filter(l => {
      const dn = (l.display_name || "");
      return dn.includes("無薪事假") || dn.includes("突發無薪事假");
    });
    const ulSickLeaves = myLeaves.filter(l => {
      const dn = (l.display_name || "");
      return dn.includes("無薪病假") || dn.includes("無薪假期");
    });

    const ulPersonalDays = ulPersonalLeaves.reduce((s, l) => s + Math.abs(l.quota || 0), 0);
    const ulSickDays = ulSickLeaves.reduce((s, l) => s + Math.abs(l.quota || 0), 0);
    const ulTotalDays = myLeaves.reduce((s, l) => s + Math.abs(l.quota || 0), 0);

    setAttendanceStats({
      workDays: clockinDates.size,
      reportDays: reportDates.size,
      totalLateMinutes,
      voluntaryOTMinutes,
      ulDays: ulTotalDays,
      ulPersonalDays,
      ulSickDays,
      ulCount: myLeaves.length,
      ulLeaves: myLeaves.map(l => ({
        display_name: l.display_name,
        quota: l.quota,
        start: toLocalDate(l.start_date_time),
      })),
    });
    setLoading(false);
  };

  // Projects where staff didn't write contribution notes (from review data directly)
  const otherProjects = useMemo(() => {
    return allProjects.filter(p => !hasContribution(p));
  }, [allProjects]);

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-bold text-gray-900">{r.staff_name} 的年度評估表</h2>
          <p className="text-xs text-gray-400">{r.staff_position} · {r.staff_team} · {r.staff_bu} · {r.fiscal_year}</p>
        </div>
        <span className="ml-auto">
          {(() => {
            const statusMap = {
              draft: { bg: "bg-orange-100", text: "text-orange-700", label: "草稿" },
              peer_review_pending: { bg: "bg-amber-100", text: "text-amber-700", label: "待完成同事互評" },
              pending_leader: { bg: "bg-blue-100", text: "text-blue-700", label: "待Leader評分" },
              pending_boss_review: { bg: "bg-pink-100", text: "text-pink-700", label: "待預審" },
              pending_boss: { bg: "bg-purple-100", text: "text-purple-700", label: "待面談" },
            };
            const s = statusMap[r.status] || statusMap.draft;
            return <span className={`text-xs ${s.bg} ${s.text} px-3 py-1 rounded-full font-medium`}>{s.label}</span>;
          })()}
        </span>
      </div>

      {/* Score Legend — show when boss can score */}
      {canBossScore && <ScoreLegend scoreLevels={scoreLevels} />}

      {/* Section 1: Projects with contributions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-blue-800">📊 項目工作摘要</h3>
            {(() => {
              const merged = allProjects.map((p, i) => {
                const origIdx = (r.project_contributions || []).indexOf(p);
                const liveBoss = bossProjectScores[origIdx];
                return liveBoss ? { ...p, boss_score: liveBoss } : p;
              });
              const res = calcSectionScore(merged, 90);
              return <span className="text-sm font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">{f2(res.score)} / 90 <span className="text-xs font-medium opacity-70">(90%)</span></span>;
            })()}
          </div>
        </div>
        <div className="p-4">
          <div className="flex gap-3 mb-4">
            <StatBadge color="blue" value={allProjects.length} label="參與項目" />
            <StatBadge color="green" value={`${Math.round(totalHours)}h`} label="總工時" />
            <StatBadge color="purple" value={totalTasks} label="總任務數" />
            {totalSales > 0 && <StatBadge color="yellow" value={`$${totalSales.toLocaleString()}`} label="銷售額" />}
          </div>

          {contributedProjects.length > 0 && (
            <div className="space-y-2">
              {contributedProjects.map((p, i) => {
                const origIdx = allProjects.indexOf(p);
                return (
                  <ProjectCard
                    key={i}
                    project={p}
                    bossScore={bossProjectScores[origIdx] || 0}
                    canBossScore={canBossScore}
                    scoreLevels={scoreLevels}
                    onBossScore={(s) => setBossProjectScores(prev => ({ ...prev, [origIdx]: s }))}
                  />
                );
              })}
            </div>
          )}
          {contributedProjects.length === 0 && allProjects.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-xs">無項目記錄</div>
          )}

          {/* Other projects without contributions */}
          {otherProjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-500 mb-2">📁 其他項目（員工未撰寫貢獻重點）</div>
              <div className="space-y-1.5">
                {otherProjects.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-700 flex-1">{p.project_name}</span>
                    <span className="text-xs text-blue-600 font-bold">{p.hours}h</span>
                    <span className="text-xs text-gray-400">{p.tasks}個任務</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extra Contributions */}
      {r.extra_contributions?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-teal-50 px-4 py-3 border-b border-teal-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-teal-800">🌟 額外貢獻（{r.extra_contributions.length} 項）</h3>
              {(() => {
                const merged = extras.map((e, i) => {
                  const liveBoss = bossExtraScores[i];
                  return liveBoss ? { ...e, boss_score: liveBoss } : e;
                });
                const res = calcSectionScore(merged, 10);
                return <span className="text-sm font-black text-teal-700 bg-teal-100 px-2.5 py-1 rounded-lg">{f2(res.score)} / 10 <span className="text-xs font-medium opacity-70">(10%)</span></span>;
              })()}
            </div>
          </div>
          <div className="p-4 space-y-2">
            {r.extra_contributions.map((ec, i) => (
              <div key={i} className="border border-gray-100 rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-base font-bold text-teal-600 shrink-0">{i + 1}.</span>
                  <p className="text-base text-gray-700 leading-relaxed flex-1">{ec.description}</p>
                </div>
                {(ec.self_score > 0 || ec.leader_score > 0) && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap ml-5">
                    {ec.self_score > 0 && (
                      <span className="text-sm bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-semibold">自評：{ec.self_score} 分</span>
                    )}
                    {ec.leader_score > 0 && (
                      <span className="text-sm bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">Team Leader：{ec.leader_score} 分</span>
                    )}
                    {canBossScore && ec.self_score > 0 ? (
                      <InlineBossScoreButtons
                        score={bossExtraScores[i] || 0}
                        scoreLevels={scoreLevels}
                        onScore={(s) => setBossExtraScores(prev => ({ ...prev, [i]: s }))}
                        avgScores={[ec.self_score, ec.leader_score, bossExtraScores[i] || 0].filter(s => s > 0)}
                      />
                    ) : (ec.boss_score > 0 || bossExtraScores[i] > 0) ? (
                      <span className="text-sm bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold">老闆：{bossExtraScores[i] || ec.boss_score} 分</span>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Challenges + Solution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
          <h3 className="font-bold text-base text-orange-800">⚡ 年度遇到的困難及解決方法</h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">遇到的困難</div>
            {r.challenges ? (
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.challenges}</p>
            ) : (
              <p className="text-base text-gray-400 italic">（未填寫）</p>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">如何解決</div>
            {r.challenges_solution ? (
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.challenges_solution}</p>
            ) : (
              <p className="text-base text-gray-400 italic">（未填寫）</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Goals + Commitment */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-green-50 px-4 py-3 border-b border-green-100">
          <h3 className="font-bold text-base text-green-800">🎯 未來一年目標及為完成目標願意做的事</h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">未來一年目標</div>
            {r.next_year_goals ? (
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.next_year_goals}</p>
            ) : (
              <p className="text-base text-gray-400 italic">（未填寫）</p>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 mb-1">為完成目標願意做的事</div>
            {r.commitment ? (
              <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.commitment}</p>
            ) : (
              <p className="text-base text-gray-400 italic">（未填寫）</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 6: Company Feedback */}
      <SectionCard color="purple" icon="💬" title="對公司的意見" content={r.company_feedback} />

      {/* Section 6: Peer Review Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
          <h3 className="font-bold text-base text-indigo-800">👥 同事互評結果</h3>
        </div>
        <div className="p-4">
          <PeerReviewResultSection staffId={r.staff_id} fiscalYear={r.fiscal_year} />
        </div>
      </div>

      {/* Section 7a: Merits & Demerits */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-amber-800">🏅 功過紀錄</h3>
            {(() => {
              const res = calcMeritAdj(meritRecords || [], meritTypes);
              const v = res.adj;
              const color = v > 0 ? "text-green-700 bg-green-100" : v < 0 ? "text-red-700 bg-red-100" : "text-gray-500 bg-gray-100";
              return <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${color}`}>{v > 0 ? "+" : ""}{f2(v)}</span>;
            })()}
          </div>
        </div>
        <div className="p-4">
          <MeritsDemeritsList staffId={r.staff_id} preloadedRecords={meritRecords} />
        </div>
      </div>

      {/* Section 7b: Attendance Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-800">📋 年度考勤紀錄</h3>
            {attendanceStats && (() => {
              const res = calcAttendanceAdj(attendanceStats);
              const v = res.total;
              const color = v > 0 ? "text-green-700 bg-green-100" : v < 0 ? "text-red-700 bg-red-100" : "text-gray-500 bg-gray-100";
              return <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${color}`}>{v > 0 ? "+" : ""}{f2(v)}</span>;
            })()}
          </div>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">載入考勤數據...</span>
            </div>
          ) : attendanceStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AttendanceStat
                icon={<Calendar size={16} className="text-blue-500" />}
                label="上班日 vs 匯報日"
                value={`${attendanceStats.workDays} / ${attendanceStats.reportDays}`}
                sub={attendanceStats.workDays > attendanceStats.reportDays
                  ? `差 ${attendanceStats.workDays - attendanceStats.reportDays} 日`
                  : "全部已匯報"}
                warn={attendanceStats.workDays > attendanceStats.reportDays}
              />
              <AttendanceStat
                icon={<AlertTriangle size={16} className="text-orange-500" />}
                label="年度遲到分鐘"
                value={`${attendanceStats.totalLateMinutes} 分鐘`}
                sub={attendanceStats.totalLateMinutes > 0
                  ? `≈ ${(attendanceStats.totalLateMinutes / 60).toFixed(1)} 小時`
                  : "無遲到記錄"}
                warn={attendanceStats.totalLateMinutes > 60}
              />
              <AttendanceStat
                icon={<Coffee size={16} className="text-red-500" />}
                label="無薪假（合計）"
                value={`${attendanceStats.ulDays} 日`}
                sub={`事假 ${attendanceStats.ulPersonalDays}日 · 病假 ${attendanceStats.ulSickDays}日`}
                warn={attendanceStats.ulDays > 0}
              />
              <AttendanceStat
                icon={<Clock size={16} className="text-green-500" />}
                label="自願加班"
                value={`${attendanceStats.voluntaryOTMinutes} 分鐘`}
                sub={attendanceStats.voluntaryOTMinutes > 0
                  ? `≈ ${(attendanceStats.voluntaryOTMinutes / 60).toFixed(1)} 小時`
                  : "無自願加班"}
                warn={false}
              />
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">無法載入考勤數據</div>
          )}
          {/* UL detail breakdown */}
          {attendanceStats?.ulLeaves?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-500 mb-1.5">📋 無薪假明細</div>
              <div className="space-y-1">
                {attendanceStats.ulLeaves
                  .sort((a, b) => (a.start || "").localeCompare(b.start || ""))
                  .map((l, i) => {
                    const label = (l.display_name || "").split(" - ").slice(1).join(" - ") || l.display_name;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 w-20 shrink-0">{l.start}</span>
                        <span className="flex-1 text-gray-600">{label}</span>
                        <span className="font-semibold text-orange-600 shrink-0">{l.quota}日</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leader fields */}
      {(r.leader_comment || r.leader_next_year_expectation || r.leader_private_note) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h3 className="font-bold text-base text-blue-800">👤 Team Leader 回饋</h3>
          </div>
          <div className="p-4 space-y-3">
            {r.leader_comment && (
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1">💬 鼓勵說話</div>
                <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.leader_comment}</p>
              </div>
            )}
            {r.leader_next_year_expectation && (
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1">🎯 來年工作期望及學習方向</div>
                <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.leader_next_year_expectation}</p>
              </div>
            )}
            {r.leader_private_note && (
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="text-sm font-semibold text-amber-700 mb-1">🔒 告訴公司的事（不公開）</div>
                <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{r.leader_private_note}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoring Summary — at end */}
      <ScoringBreakdown
        review={r}
        attendanceStats={attendanceStats}
        meritRecords={meritRecords}
        liveBossProjectScores={bossProjectScores}
        liveBossExtraScores={bossExtraScores}
        bossAdjustment={bossAdjustment}
        onBossAdjustmentChange={canBossScore ? setBossAdjustment : undefined}
      />

      {/* Boss notes sections */}
      {canBossScore && (
        <BossNotesSection
          deptGoals={bossDeptGoals}
          personalGoals={bossPersonalGoals}
          extraNotes={bossExtraNotes}
          onDeptGoalsChange={setBossDeptGoals}
          onPersonalGoalsChange={setBossPersonalGoals}
          onExtraNotesChange={setBossExtraNotes}
        />
      )}

      {/* Read-only boss notes when not in scoring mode */}
      {!canBossScore && ((r.boss_dept_goals?.length > 0) || (r.boss_personal_goals?.length > 0) || r.boss_extra_notes) && (
        <BossNotesReadonly deptGoals={r.boss_dept_goals} personalGoals={r.boss_personal_goals} extraNotes={r.boss_extra_notes} />
      )}

      {/* Save boss scores + AI button */}
      {canBossScore && (
        <div className="flex justify-center">
          <button
            onClick={handleSaveBossScores}
            disabled={savingBoss}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-md disabled:opacity-50"
          >
            {savingBoss ? <Loader2 size={16} className="animate-spin" /> : null}
            {savingBoss ? "儲存中..." : "💾 儲存老闆評分"}
          </button>
        </div>
      )}

      {/* AI Appraisal Button */}
      <div className="flex justify-center pt-2 pb-2">
        <button
          onClick={handleGenerateAppraisal}
          disabled={generatingAI}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
        >
          {generatingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generatingAI ? "生成報告中..." : "整合面談報告"}
        </button>
      </div>

      {/* Meta */}
      {r.submitted_at && (
        <div className="text-xs text-gray-400 text-right pb-4">
          提交時間：{new Date(r.submitted_at).toLocaleString("zh-HK")}
        </div>
      )}
    </div>
  );
}

function StatBadge({ color, value, label }) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-green-50 border-green-100 text-green-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-600",
  };
  return (
    <div className={`rounded-lg px-3 py-2 text-center flex-1 border ${colors[color]}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function ProjectCard({ project, bossScore, canBossScore, scoreLevels, onBossScore }) {
  const p = project;
  return (
    <div className="border border-gray-100 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-base font-semibold text-gray-800 flex-1">{p.project_name}</span>
        <span className="text-sm text-blue-600 font-bold">{p.hours}h</span>
        <span className="text-sm text-gray-400">{p.tasks}個任務</span>
        {p.sales_amount > 0 && (
          <span className="text-sm text-yellow-600 font-semibold">${p.sales_amount.toLocaleString()}</span>
        )}
      </div>
      {p.contribution_note && (
        <div className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
          {(() => {
            try {
              const arr = JSON.parse(p.contribution_note);
              if (Array.isArray(arr)) return (
                <ul className="list-disc list-inside space-y-1">
                  {arr.map((pt, pi) => {
                    if (typeof pt === "object" && pt.type) {
                      return <li key={pi}><span className="font-semibold text-gray-700">[{pt.type}]</span> {pt.text}</li>;
                    }
                    return <li key={pi}>{typeof pt === "string" ? pt : pt.text || ""}</li>;
                  })}
                </ul>
              );
            } catch {}
            return <p>{p.contribution_note}</p>;
          })()}
        </div>
      )}
      {/* Scores row */}
      {(p.self_score > 0 || p.leader_score > 0) && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {p.self_score > 0 && (
            <span className="text-sm bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full font-semibold">自評 {p.self_score}分</span>
          )}
          {p.leader_score > 0 && (
            <span className="text-sm bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">Team Leader {p.leader_score}分</span>
          )}
          {canBossScore && p.self_score > 0 ? (
            <InlineBossScoreButtons score={bossScore} scoreLevels={scoreLevels} onScore={onBossScore}
              avgScores={[p.self_score, p.leader_score, bossScore].filter(s => s > 0)} />
          ) : (p.boss_score > 0 || bossScore > 0) ? (
            <span className="text-sm bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold">老闆 {bossScore || p.boss_score}分</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function InlineBossScoreButtons({ score, scoreLevels, onScore, avgScores }) {
  const selectedLevel = scoreLevels.find(l => l.score === score);
  const avg = avgScores && avgScores.length > 0
    ? Math.round((avgScores.reduce((a, b) => a + b, 0) / avgScores.length) * 10) / 10
    : null;
  return (
    <div className="flex flex-col gap-1 w-full mt-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-purple-700 shrink-0">老闆評分：</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(s => {
            const sl = scoreLevels.find(l => l.score === s);
            const isSelected = score === s;
            const sc = SCORE_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => onScore(s)}
                title={sl ? `${sl.label}：${sl.description}` : `${s} 分`}
                className={`w-10 h-10 rounded-lg text-center transition-all border-2 ${
                  isSelected
                    ? `${sc.active} text-white border-transparent shadow-md scale-110`
                    : `${sc.bg} ${sc.border} ${sc.text} hover:scale-105`
                }`}
              >
                <div className="text-sm font-black">{s}</div>
              </button>
            );
          })}
        </div>
        {avg !== null && score > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg px-3 py-1.5 shrink-0">
            <div className="text-lg font-black text-amber-600 leading-none">{avg}</div>
            <div className="text-[10px] text-amber-500 font-medium">平均分</div>
          </div>
        )}
      </div>
      {selectedLevel && (
        <div className="text-sm text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5 border border-purple-100 ml-0">
          <span className="font-bold">{selectedLevel.score}分 — {selectedLevel.label}</span>
          {selectedLevel.description && <span className="text-purple-500">：{selectedLevel.description}</span>}
        </div>
      )}
    </div>
  );
}

function ScoreLegend({ scoreLevels }) {
  if (!scoreLevels || scoreLevels.length === 0) return null;
  const sorted = [...scoreLevels].sort((a, b) => a.score - b.score);
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
      <div className="text-sm font-bold text-purple-800 mb-2">📋 評分參考標準</div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {sorted.map(sl => {
          const sc = SCORE_COLORS[sl.score];
          return (
            <div key={sl.score} className={`${sc.bg} ${sc.border} border rounded-lg px-3 py-2 text-center`}>
              <div className={`text-lg font-black ${sc.text}`}>{sl.score}</div>
              <div className={`text-xs font-bold ${sc.text}`}>{sl.label}</div>
              {sl.description && <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{sl.description}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttendanceStat({ icon, label, value, sub, warn }) {
  return (
    <div className={`rounded-xl p-3 border text-center ${warn ? "bg-orange-50 border-orange-100" : "bg-gray-50 border-gray-100"}`}>
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <div className={`text-base font-bold ${warn ? "text-orange-600" : "text-gray-800"}`}>{value}</div>
      <div className="text-[10px] text-gray-500 font-medium">{label}</div>
      {sub && <div className={`text-[10px] mt-0.5 ${warn ? "text-orange-500" : "text-gray-400"}`}>{sub}</div>}
    </div>
  );
}

function BossNotesReadonly({ deptGoals, personalGoals, extraNotes }) {
  return (
    <div className="space-y-4">
      {deptGoals?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-100">
            <h3 className="font-bold text-base text-cyan-800">🏢 未來部門目標</h3>
          </div>
          <div className="p-4 space-y-1.5">
            {deptGoals.map((g, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm font-bold text-cyan-600 shrink-0">{i + 1}.</span>
                <p className="text-sm text-gray-700">{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {personalGoals?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-violet-50 px-4 py-3 border-b border-violet-100">
            <h3 className="font-bold text-base text-violet-800">🎯 公司設定個人目標</h3>
          </div>
          <div className="p-4 space-y-1.5">
            {personalGoals.map((g, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm font-bold text-violet-600 shrink-0">{i + 1}.</span>
                <p className="text-sm text-gray-700">{g}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {extraNotes && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="font-bold text-base text-gray-700">📝 其它補充</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{extraNotes}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({ color, icon, title, content }) {
  const bgMap = { teal: "bg-teal-50", orange: "bg-orange-50", green: "bg-green-50", purple: "bg-purple-50" };
  const borderMap = { teal: "border-teal-100", orange: "border-orange-100", green: "border-green-100", purple: "border-purple-100" };
  const textMap = { teal: "text-teal-800", orange: "text-orange-800", green: "text-green-800", purple: "text-purple-800" };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`${bgMap[color]} px-4 py-3 border-b ${borderMap[color]}`}>
        <h3 className={`font-bold text-base ${textMap[color]}`}>{icon} {title}</h3>
      </div>
      <div className="p-4">
        {content ? (
          <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <p className="text-base text-gray-400 italic">（未填寫）</p>
        )}
      </div>
    </div>
  );
}