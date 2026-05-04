import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator } from "lucide-react";

const f2 = (v) => (Math.round(v * 100) / 100).toFixed(2);

// Calculate average score for items: average of (self + leader + boss) available scores per item, then scale
// Logic: for each item, collect all non-zero scores among self/leader/boss, take their average → that's the item score out of 5
// Then average all item scores → scale to maxPoints
function calcSectionScore(items, maxPoints) {
  const scored = items.filter(p => p.self_score > 0);
  if (scored.length === 0) return { score: 0, avg: 0, count: 0 };
  const itemScores = scored.map(p => {
    const scores = [p.self_score, p.leader_score, p.boss_score].filter(s => s && s > 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  });
  const avg = itemScores.reduce((a, b) => a + b, 0) / itemScores.length; // out of 5
  const score = (avg / 5) * maxPoints;
  return { score, avg, count: scored.length };
}

// Attendance adjustments
function calcAttendanceAdj(stats) {
  if (!stats) return { late: 0, nopay: 0, ot: 0, reportGap: 0, total: 0, details: [] };
  const details = [];

  // Late: -2 per 720 minutes
  const lateBlocks = Math.floor((stats.totalLateMinutes || 0) / 720);
  const late = lateBlocks * -2;
  if (lateBlocks > 0) details.push(`遲到 ${stats.totalLateMinutes}分鐘 → ${lateBlocks}×720 = ${f2(late)}分`);

  // NoPay leave: >=3 days → -2, then -0.5 per extra day
  let nopay = 0;
  const ulDays = stats.ulDays || 0;
  if (ulDays >= 3) {
    nopay = -2;
    const extraDays = ulDays - 3;
    if (extraDays > 0) nopay += extraDays * -0.5;
    details.push(`無薪假 ${ulDays}日 → 基本-2${ulDays > 3 ? ` + ${ulDays - 3}日×-0.5 = ${f2(nopay)}` : " = -2.00"}分`);
  }

  // Voluntary OT: +2 per 1440 minutes
  const otBlocks = Math.floor((stats.voluntaryOTMinutes || 0) / 1440);
  const ot = otBlocks * 2;
  if (otBlocks > 0) details.push(`自願加班 ${stats.voluntaryOTMinutes}分鐘 → ${otBlocks}×1440 = +${f2(ot)}分`);

  // Report gap: -1 per 5 missing report days vs work days
  let reportGap = 0;
  const workDays = stats.workDays || 0;
  const reportDays = stats.reportDays || 0;
  const missingDays = Math.max(0, workDays - reportDays);
  if (missingDays >= 5) {
    const gapBlocks = Math.floor(missingDays / 5);
    reportGap = gapBlocks * -1;
    details.push(`匯報缺失 ${missingDays}日（上班${workDays} - 匯報${reportDays}）→ ${gapBlocks}×5 = ${f2(reportGap)}分`);
  }

  return { late, nopay, ot, reportGap, total: late + nopay + ot + reportGap, details };
}

// Merits/Demerits adjustment
function calcMeritAdj(records, types) {
  if (!records || records.length === 0) return { adj: 0, details: [] };
  const typeMap = {};
  for (const t of types) typeMap[t.name] = t.score_adjustment || 0;

  let adj = 0;
  const details = [];
  for (const r of records) {
    const typeName = r.type || "";
    const score = typeMap[typeName] || 0;
    if (score !== 0) {
      adj += score;
      details.push(`${typeName}${r.brief_description ? ` — ${r.brief_description}` : ""} (${score > 0 ? "+" : ""}${f2(score)})`);
    }
  }
  return { adj, details };
}

export default function ScoringBreakdown({ review, attendanceStats, meritRecords, liveBossProjectScores, liveBossExtraScores, bossAdjustment, onBossAdjustmentChange }) {
  const [meritTypes, setMeritTypes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    base44.entities.MeritDemeritType.filter({ is_active: true }, "sort_order", 100)
      .then(setMeritTypes)
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const r = review;
  // Merge live boss scores (unsaved) into items for real-time calculation
  const projects = (r.project_contributions || []).map((p, i) => {
    const liveBoss = liveBossProjectScores?.[i];
    return liveBoss ? { ...p, boss_score: liveBoss } : p;
  });
  const extras = (r.extra_contributions || []).map((e, i) => {
    const liveBoss = liveBossExtraScores?.[i];
    return liveBoss ? { ...e, boss_score: liveBoss } : e;
  });

  const projResult = calcSectionScore(projects, 90);
  const extraResult = calcSectionScore(extras, 10);
  const baseScore = projResult.score + extraResult.score;

  const meritResult = calcMeritAdj(meritRecords || [], meritTypes);
  const attResult = calcAttendanceAdj(attendanceStats);
  const bossAdj = bossAdjustment || 0;
  const totalAdj = meritResult.adj + attResult.total + bossAdj;
  const finalScore = baseScore + totalAdj;

  const scoreColor = finalScore >= 80 ? "text-green-600" : finalScore >= 60 ? "text-amber-600" : "text-red-600";
  const scoreBg = finalScore >= 80 ? "from-green-50 to-emerald-50 border-green-200" : finalScore >= 60 ? "from-amber-50 to-yellow-50 border-amber-200" : "from-red-50 to-orange-50 border-red-200";

  return (
    <div className={`bg-gradient-to-r ${scoreBg} rounded-xl border-2 p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-gray-600" />
        <h3 className="font-bold text-base text-gray-800">📊 評分摘要（滿分 100）</h3>
      </div>

      {/* Section rows */}
      <div className="space-y-2 mb-4">
        <ScoreRow
          label="📊 項目工作"
          pct="90%"
          value={projResult.score}
          max={90}
          sub={`平均 ${f2(projResult.avg)}/5 · ${projResult.count} 項已評分`}
        />
        <ScoreRow
          label="🌟 額外貢獻"
          pct="10%"
          value={extraResult.score}
          max={10}
          sub={`平均 ${f2(extraResult.avg)}/5 · ${extraResult.count} 項已評分`}
        />
        <div className="border-t border-gray-200/50 my-1" />
        <ScoreRow
          label="🏅 功過調整"
          value={meritResult.adj}
          isAdj
          sub={`${meritRecords?.length || 0} 條紀錄`}
        />
        <ScoreRow
          label="📋 考勤調整"
          value={attResult.total}
          isAdj
          sub={attendanceStats ? `遲到${f2(attResult.late)} · 無薪假${f2(attResult.nopay)} · 加班+${f2(attResult.ot)} · 匯報${f2(attResult.reportGap)}` : "未載入"}
        />
        <div className="border-t border-gray-200/50 my-1" />
        {onBossAdjustmentChange ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl px-5 py-4 border-2 border-purple-300 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-purple-800">⭐ 努力認可分數調整</span>
              </div>
              <div className="text-xs text-purple-600 mt-1 font-medium">老闆可手動加減分，用於獎勵額外努力或扣除不足之處</div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button onClick={() => onBossAdjustmentChange(bossAdj - 1)}
                className="w-10 h-10 rounded-xl bg-red-100 text-red-600 font-bold text-xl flex items-center justify-center hover:bg-red-200 transition-colors border border-red-200">−</button>
              <input
                type="number"
                value={bossAdj}
                onChange={e => onBossAdjustmentChange(parseFloat(e.target.value) || 0)}
                className="w-20 text-center text-2xl font-black border-2 border-purple-300 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
              <button onClick={() => onBossAdjustmentChange(bossAdj + 1)}
                className="w-10 h-10 rounded-xl bg-green-100 text-green-600 font-bold text-xl flex items-center justify-center hover:bg-green-200 transition-colors border border-green-200">+</button>
            </div>
          </div>
        ) : bossAdj !== 0 ? (
          <ScoreRow label="⭐ 努力認可分數調整" value={bossAdj} isAdj sub="老闆手動調整" />
        ) : null}
      </div>

      {/* Attendance Rules */}
      <div className="bg-white/60 rounded-lg px-4 py-3 text-xs space-y-1.5 mb-3">
        <div className="font-semibold text-gray-700 mb-1">📋 考勤調整規則</div>
        <div className="text-gray-500">• <b>遲到</b>：每累計 720 分鐘（12 小時）→ <span className="text-red-600 font-semibold">-2 分</span></div>
        <div className="text-gray-500">• <b>無薪假</b>：≥ 3 日 → <span className="text-red-600 font-semibold">-2 分</span>，之後每多 1 日 → <span className="text-red-600 font-semibold">-0.5 分</span></div>
        <div className="text-gray-500">• <b>自願加班</b>：每累計 1440 分鐘（24 小時）→ <span className="text-green-600 font-semibold">+2 分</span></div>
        <div className="text-gray-500">• <b>匯報缺失</b>：每 5 日未匯報（上班日 - 匯報日）→ <span className="text-red-600 font-semibold">-1 分</span></div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-xs">
        {meritResult.details.length > 0 && (
          <div className="bg-white/60 rounded-lg px-3 py-2">
            <div className="font-semibold text-gray-600 mb-1">功過明細：</div>
            {meritResult.details.map((d, i) => <div key={i} className="text-gray-500">{d}</div>)}
          </div>
        )}
        {attResult.details.length > 0 && (
          <div className="bg-white/60 rounded-lg px-3 py-2">
            <div className="font-semibold text-gray-600 mb-1">考勤明細：</div>
            {attResult.details.map((d, i) => <div key={i} className="text-gray-500">{d}</div>)}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-200/50 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">基本分 {f2(baseScore)}</span>
          {totalAdj !== 0 && <span className="ml-2">{totalAdj > 0 ? "+" : ""}{f2(totalAdj)} 調整</span>}
        </div>
        <div className={`text-3xl font-black ${scoreColor}`}>
          {f2(finalScore)}
          <span className="text-sm font-medium text-gray-400 ml-1">/ 100</span>
        </div>
      </div>
    </div>
  );
}

// Export for use in section headers
export { calcSectionScore, calcAttendanceAdj, calcMeritAdj, f2 };

function ScoreRow({ label, pct, value, max, sub, isAdj }) {
  const display = isAdj ? (value > 0 ? `+${f2(value)}` : f2(value)) : f2(value);
  const color = isAdj
    ? (value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-500")
    : "text-indigo-600";
  return (
    <div className="flex items-center gap-3 bg-white/60 rounded-lg px-4 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{label}</span>
          {pct && <span className="text-xs bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded font-medium">{pct}</span>}
        </div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
      </div>
      <div className="text-right shrink-0">
        <div className={`text-lg font-black ${color}`}>{display}</div>
        {max && <div className="text-[10px] text-gray-400">/ {max}</div>}
      </div>
    </div>
  );
}