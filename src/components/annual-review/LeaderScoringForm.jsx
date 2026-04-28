import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", active: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", active: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", active: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", active: "bg-red-500" },
};

function parseContribution(note) {
  if (!note) return "";
  try {
    const arr = JSON.parse(note);
    if (Array.isArray(arr)) {
      return arr.map(pt => {
        if (typeof pt === "object" && pt.type) return `[${pt.type}] ${pt.text}`;
        return typeof pt === "string" ? pt : pt.text || "";
      }).filter(Boolean).join("；");
    }
  } catch {}
  return note;
}

export default function LeaderScoringForm({ review, onBack, onSubmitted }) {
  const [scoreLevels, setScoreLevels] = useState([]);
  const [projectScores, setProjectScores] = useState({});
  const [extraScores, setExtraScores] = useState({});
  const [comment, setComment] = useState(review.leader_comment || "");
  const [saving, setSaving] = useState(false);

  // Items that have self_score
  const scoredProjects = (review.project_contributions || [])
    .map((p, i) => ({ ...p, _idx: i }))
    .filter(p => p.self_score > 0);

  const scoredExtras = (review.extra_contributions || [])
    .map((e, i) => ({ ...e, _idx: i }))
    .filter(e => e.self_score > 0);

  useEffect(() => {
    base44.entities.ScoreLevel.filter({ is_active: true }, "-score", 100).then(setScoreLevels);
    // Init from existing leader scores
    const ps = {};
    scoredProjects.forEach(p => { if (p.leader_score > 0) ps[p._idx] = p.leader_score; });
    setProjectScores(ps);
    const es = {};
    scoredExtras.forEach(e => { if (e.leader_score > 0) es[e._idx] = e.leader_score; });
    setExtraScores(es);
  }, []);

  const allScored = scoredProjects.every(p => projectScores[p._idx] > 0) &&
                    scoredExtras.every(e => extraScores[e._idx] > 0);

  const handleSubmit = async () => {
    if (!allScored) { alert("請先為所有項目評分"); return; }
    if (!window.confirm("確認提交評分？提交後此員工評估表將進入「待老闆面談」階段。")) return;
    setSaving(true);

    const updatedProjects = (review.project_contributions || []).map((p, i) => ({
      ...p,
      leader_score: projectScores[i] || p.leader_score || null,
    }));
    const updatedExtras = (review.extra_contributions || []).map((e, i) => ({
      ...e,
      leader_score: extraScores[i] || e.leader_score || null,
    }));

    await base44.entities.AnnualReview.update(review.id, {
      project_contributions: updatedProjects,
      extra_contributions: updatedExtras,
      leader_comment: comment,
      leader_scored_at: new Date().toISOString(),
      status: "pending_boss",
    });

    setSaving(false);
    onSubmitted();
  };

  const renderScoreRow = (label, selfScore, leaderScore, onScore) => {
    const level = scoreLevels.find(sl => sl.score === leaderScore);
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold shrink-0">員工自評：{selfScore} 分</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(score => {
            const sl = scoreLevels.find(s => s.score === score);
            const isSelected = leaderScore === score;
            const sc = SCORE_COLORS[score];
            return (
              <button
                key={score}
                onClick={() => onScore(score)}
                title={sl ? `${sl.label}：${sl.description}` : `${score} 分`}
                className={`flex-1 py-2 rounded-lg text-center transition-all border-2 ${
                  isSelected
                    ? `${sc.active} text-white border-transparent shadow-md scale-105`
                    : `${sc.bg} ${sc.border} ${sc.text} hover:scale-102`
                }`}
              >
                <div className="text-lg font-black">{score}</div>
                {sl && <div className={`text-xs font-semibold leading-tight ${isSelected ? "text-white/90" : ""}`}>{sl.label}</div>}
              </button>
            );
          })}
        </div>
        {level && (
          <div className="text-sm text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100">
            <span className="font-semibold">{level.label}</span>：{level.description}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900">評分：{review.staff_name}</h2>
          <p className="text-xs text-gray-400">{review.staff_position} · {review.staff_team} · {review.fiscal_year}</p>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">待Leader評分</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-base text-blue-700">
        以下只列出員工已自評的項目，請為每個項目評分。
      </div>

      {/* Project items with self_score */}
      {scoredProjects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-blue-800 px-1">📊 項目工作（{scoredProjects.length} 項需評分）</h3>
          {scoredProjects.map(p => (
            <div key={p._idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
              <div>
                <div className="font-semibold text-base text-gray-900">{p.project_name}</div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <span className="text-blue-600 font-bold">{p.hours}h</span>
                  <span>{p.tasks} 個任務</span>
                  {p.sales_amount > 0 && <span className="text-yellow-600 font-semibold">${p.sales_amount.toLocaleString()}</span>}
                </div>
                {p.contribution_note && (
                  <div className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                    {parseContribution(p.contribution_note)}
                  </div>
                )}
              </div>
              {renderScoreRow(
                p.project_name,
                p.self_score,
                projectScores[p._idx] || 0,
                (s) => setProjectScores(prev => ({ ...prev, [p._idx]: s }))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Extra contribution items with self_score */}
      {scoredExtras.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-teal-800 px-1">🌟 額外貢獻（{scoredExtras.length} 項需評分）</h3>
          {scoredExtras.map(e => (
            <div key={e._idx} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
              <p className="text-base text-gray-700 leading-relaxed">{e.description}</p>
              {renderScoreRow(
                e.description,
                e.self_score,
                extraScores[e._idx] || 0,
                (s) => setExtraScores(prev => ({ ...prev, [e._idx]: s }))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Leader comment */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <label className="text-sm font-semibold text-gray-700 block mb-2">💬 上司評語</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          rows={4}
          placeholder="對這位同事的整體評價、建議或鼓勵..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      </div>

      {/* Submit */}
      <div className="pb-8">
        <button
          onClick={handleSubmit}
          disabled={saving || !allScored}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {saving ? "提交中..." : "確認提交評分"}
        </button>
        {!allScored && (
          <p className="text-xs text-center text-amber-600 mt-2">請先為所有項目評分後才能提交</p>
        )}
      </div>
    </div>
  );
}