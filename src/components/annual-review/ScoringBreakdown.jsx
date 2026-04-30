import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator } from "lucide-react";

// Calculate project/extra score: average of best available score (boss > leader > self), scaled
function calcAvgScore(items, maxPoints) {
  const scored = items.filter(p => p.self_score > 0);
  if (scored.length === 0) return { score: 0, avg: 0, count: 0 };
  const total = scored.reduce((s, p) => {
    const best = p.boss_score || p.leader_score || p.self_score || 0;
    return s + best;
  }, 0);
  const avg = total / scored.length; // out of 5
  return { score: Math.round((avg / 5) * maxPoints * 10) / 10, avg: Math.round(avg * 100) / 100, count: scored.length };
}

// Attendance adjustments
function calcAttendanceAdj(stats) {
  if (!stats) return { late: 0, nopay: 0, ot: 0, details: [] };
  const details = [];

  // Late: -2 per 720 minutes
  const lateBlocks = Math.floor((stats.totalLateMinutes || 0) / 720);
  const late = lateBlocks * -2;
  if (lateBlocks > 0) details.push(`遲到 ${stats.totalLateMinutes}分鐘 → ${lateBlocks}×720 = ${late}分`);

  // NoPay leave: >=3 days → -2, then -0.5 per extra day
  let nopay = 0;
  const ulDays = stats.ulDays || 0;
  if (ulDays >= 3) {
    nopay = -2;
    const extraDays = ulDays - 3;
    if (extraDays > 0) nopay += extraDays * -0.5;
    nopay = Math.round(nopay * 10) / 10;
    details.push(`無薪假 ${ulDays}日 → 基本-2${ulDays > 3 ? ` + ${ulDays - 3}日×-0.5 = ${nopay}` : " = -2"}分`);
  }

  // Voluntary OT: +2 per 1440 minutes
  const otBlocks = Math.floor((stats.voluntaryOTMinutes || 0) / 1440);
  const ot = otBlocks * 2;
  if (otBlocks > 0) details.push(`自願加班 ${stats.voluntaryOTMinutes}分鐘 → ${otBlocks}×1440 = +${ot}分`);

  return { late, nopay, ot, details };
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
      details.push(`${typeName}${r.brief_description ? ` — ${r.brief_description}` : ""} (${score > 0 ? "+" : ""}${score})`);
    }
  }
  return { adj, details };
}

export default function ScoringBreakdown({ review, attendanceStats, meritRecords }) {
  const [meritTypes, setMeritTypes] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    base44.entities.MeritDemeritType.filter({ is_active: true }, "sort_order", 100)
      .then(setMeritTypes)
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const r = review;
  const projects = (r.project_contributions || []).filter(p => p.self_score > 0);
  const extras = (r.extra_contributions || []).filter(e => e.self_score > 0);

  const projResult = calcAvgScore(projects, 90);
  const extraResult = calcAvgScore(extras, 10);
  const baseScore = Math.round((projResult.score + extraResult.score) * 10) / 10;

  const meritResult = calcMeritAdj(meritRecords || [], meritTypes);
  const attResult = calcAttendanceAdj(attendanceStats);
  const attTotal = attResult.late + attResult.nopay + attResult.ot;
  const totalAdj = Math.round((meritResult.adj + attTotal) * 10) / 10;
  const finalScore = Math.round((baseScore + totalAdj) * 10) / 10;

  const scoreColor = finalScore >= 80 ? "text-green-600" : finalScore >= 60 ? "text-amber-600" : "text-red-600";
  const scoreBg = finalScore >= 80 ? "from-green-50 to-emerald-50 border-green-200" : finalScore >= 60 ? "from-amber-50 to-yellow-50 border-amber-200" : "from-red-50 to-orange-50 border-red-200";

  return (
    <div className={`bg-gradient-to-r ${scoreBg} rounded-xl border-2 p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-gray-600" />
        <h3 className="font-bold text-base text-gray-800">📊 評分摘要（滿分 100）</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <ScoreBox label="項目工作" value={projResult.score} max={90} sub={`平均 ${projResult.avg}/5 × ${projResult.count}項`} />
        <ScoreBox label="額外貢獻" value={extraResult.score} max={10} sub={`平均 ${extraResult.avg}/5 × ${extraResult.count}項`} />
        <ScoreBox label="功過調整" value={meritResult.adj} isAdj sub={`${meritRecords?.length || 0} 條紀錄`} />
        <ScoreBox label="考勤調整" value={attTotal} isAdj sub={attendanceStats ? "遲到/假期/加班" : "未載入"} />
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
          <span className="font-medium">基本分 {baseScore}</span>
          {totalAdj !== 0 && <span className="ml-2">{totalAdj > 0 ? "+" : ""}{totalAdj} 調整</span>}
        </div>
        <div className={`text-3xl font-black ${scoreColor}`}>
          {finalScore}
          <span className="text-sm font-medium text-gray-400 ml-1">/ 100</span>
        </div>
      </div>
    </div>
  );
}

function ScoreBox({ label, value, max, sub, isAdj }) {
  const display = isAdj ? (value > 0 ? `+${value}` : `${value}`) : `${value}`;
  const color = isAdj ? (value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "text-gray-500") : "text-indigo-600";
  return (
    <div className="bg-white/70 rounded-lg px-3 py-2.5 text-center border border-white/50">
      <div className={`text-xl font-black ${color}`}>{display}</div>
      <div className="text-xs font-semibold text-gray-700">{label}{max ? ` /${max}` : ""}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}