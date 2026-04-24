import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Calendar, Clock, AlertTriangle, Coffee } from "lucide-react";

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

export default function AnnualReviewDetail({ review, onBack }) {
  const r = review;
  const [loading, setLoading] = useState(true);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [allProjectSummary, setAllProjectSummary] = useState([]);

  const allProjects = (r.project_contributions || []).filter(p => p.project_name && p.project_name !== "未指定項目");
  const totalHours = allProjects.reduce((s, p) => s + (p.hours || 0), 0);
  const totalTasks = allProjects.reduce((s, p) => s + (p.tasks || 0), 0);
  const totalSales = allProjects.reduce((s, p) => s + (p.sales_amount || 0), 0);

  // Split: projects with actual contribution notes/sales vs the rest
  const hasContribution = (p) => {
    if (p.sales_amount > 0) return true;
    if (!p.contribution_note) return false;
    try { const arr = JSON.parse(p.contribution_note); return Array.isArray(arr) && arr.some(s => s.trim()); } catch {}
    return p.contribution_note.trim().length > 0;
  };
  const contributedProjects = useMemo(() => allProjects.filter(hasContribution), [allProjects]);
  const contributedProjectNames = useMemo(() => new Set(contributedProjects.map(p => p.project_name)), [contributedProjects]);

  const fy = parseFY(r.fiscal_year);

  useEffect(() => { if (fy && r.staff_id) loadAttendanceStats(); }, [r.staff_id, r.fiscal_year]);

  const loadAttendanceStats = async () => {
    setLoading(true);
    const staffId = r.staff_id;

    // Load staff list to map staff_name → bubble_id (clockin records often have null staff_id)
    const [staffList, clockinList, leaveList] = await Promise.all([
      base44.entities.Staff.list("display_name", 2000),
      loadAll(base44.entities.BubbleClockin, "id"),
      loadAll(base44.entities.BubbleLeave, "id"),
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

      // Voluntary OT: weekdays clock out after 18:30, Saturday after 13:30
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
              threshold = 18 * 60 + 30; // 18:30
            } else if (dayOfWeek === 6) {
              threshold = 13 * 60 + 30; // 13:30
            }

            if (threshold !== null && outTotalMin > threshold) {
              let extraMin = outTotalMin - threshold;
              // Subtract approved OT minutes
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

    // Build ALL project summary (>= 40h) from tasks, exclude "未指定項目"
    const projAgg = {};
    for (const t of myTasks) {
      const projName = t.project_name;
      if (!projName) continue; // skip tasks without a project name
      if (!projAgg[projName]) projAgg[projName] = { project_name: projName, hours: 0, tasks: 0 };
      projAgg[projName].hours += t.work_hour || 0;
      projAgg[projName].tasks += 1;
    }
    const allProjs = Object.values(projAgg)
      .map(p => ({ ...p, hours: Math.round(p.hours * 10) / 10 }))
      .filter(p => p.hours >= 40)
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

  // Projects the staff didn't write contributions for but had >= 40h
  const otherProjects = useMemo(() => {
    return allProjectSummary.filter(p => !contributedProjectNames.has(p.project_name));
  }, [allProjectSummary, contributedProjectNames]);

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
        {r.status === "submitted" ? (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">已提交</span>
        ) : (
          <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">草稿</span>
        )}
      </div>

      {/* Section 1: Projects with contributions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
          <h3 className="font-bold text-sm text-blue-800">📊 項目工作摘要</h3>
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
              {contributedProjects.map((p, i) => (
                <ProjectCard key={i} project={p} />
              ))}
            </div>
          )}
          {contributedProjects.length === 0 && allProjects.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-xs">無項目記錄</div>
          )}

          {/* Other projects >= 40h without contributions */}
          {otherProjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-500 mb-2">📁 其他 ≥40h 項目（員工未撰寫貢獻重點）</div>
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

      {/* Section 2: Other Contributions */}
      <SectionCard color="teal" icon="🏆" title="其他貢獻 / 成就 / 創新 / 品牌升級" content={r.other_contributions} />

      {/* Section 3: Challenges + Solution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
          <h3 className="font-bold text-sm text-orange-800">⚡ 年度遇到的困難及解決方法</h3>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">遇到的困難</div>
            {r.challenges ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.challenges}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">（未填寫）</p>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">如何解決</div>
            {r.challenges_solution ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{r.challenges_solution}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">（未填寫）</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Goals */}
      <SectionCard color="green" icon="🎯" title="未來一年目標" content={r.next_year_goals} />

      {/* Section 5: Company Feedback */}
      <SectionCard color="purple" icon="💬" title="對公司的意見" content={r.company_feedback} />

      {/* Section 6: Attendance Stats */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-800">📋 年度考勤紀錄</h3>
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

function ProjectCard({ project }) {
  const p = project;
  return (
    <div className="border border-gray-100 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800 flex-1">{p.project_name}</span>
        <span className="text-xs text-blue-600 font-bold">{p.hours}h</span>
        <span className="text-xs text-gray-400">{p.tasks}個任務</span>
        {p.sales_amount > 0 && (
          <span className="text-xs text-yellow-600 font-semibold">${p.sales_amount.toLocaleString()}</span>
        )}
      </div>
      {p.contribution_note && (
        <div className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded px-2 py-1.5">
          {(() => {
            try {
              const arr = JSON.parse(p.contribution_note);
              if (Array.isArray(arr)) return (
                <ul className="list-disc list-inside space-y-0.5">
                  {arr.map((pt, pi) => <li key={pi}>{pt}</li>)}
                </ul>
              );
            } catch {}
            return <p>{p.contribution_note}</p>;
          })()}
        </div>
      )}
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

function SectionCard({ color, icon, title, content }) {
  const bgMap = { teal: "bg-teal-50", orange: "bg-orange-50", green: "bg-green-50", purple: "bg-purple-50" };
  const borderMap = { teal: "border-teal-100", orange: "border-orange-100", green: "border-green-100", purple: "border-purple-100" };
  const textMap = { teal: "text-teal-800", orange: "text-orange-800", green: "text-green-800", purple: "text-purple-800" };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`${bgMap[color]} px-4 py-3 border-b ${borderMap[color]}`}>
        <h3 className={`font-bold text-sm ${textMap[color]}`}>{icon} {title}</h3>
      </div>
      <div className="p-4">
        {content ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">（未填寫）</p>
        )}
      </div>
    </div>
  );
}