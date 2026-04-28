import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2 } from "lucide-react";

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

export default function BossScoringSection({ review, onUpdated }) {
  const [scoreLevels, setScoreLevels] = useState([]);
  const [projectScores, setProjectScores] = useState({});
  const [extraScores, setExtraScores] = useState({});
  const [saving, setSaving] = useState(false);

  const scoredProjects = (review.project_contributions || [])
    .map((p, i) => ({ ...p, _idx: i }))
    .filter(p => p.self_score > 0);

  const scoredExtras = (review.extra_contributions || [])
    .map((e, i) => ({ ...e, _idx: i }))
    .filter(e => e.self_score > 0);

  useEffect(() => {
    base44.entities.ScoreLevel.filter({ is_active: true }, "-score", 100).then(setScoreLevels);
    // Init from existing boss scores (stored as boss_score on each item)
    const ps = {};
    scoredProjects.forEach(p => { if (p.boss_score > 0) ps[p._idx] = p.boss_score; });
    setProjectScores(ps);
    const es = {};
    scoredExtras.forEach(e => { if (e.boss_score > 0) es[e._idx] = e.boss_score; });
    setExtraScores(es);
  }, []);

  const allScored = scoredProjects.every(p => projectScores[p._idx] > 0) &&
                    scoredExtras.every(e => extraScores[e._idx] > 0);

  const handleSave = async () => {
    if (!allScored) { alert("請先為所有項目評分"); return; }
    setSaving(true);

    const updatedProjects = (review.project_contributions || []).map((p, i) => ({
      ...p,
      boss_score: projectScores[i] || p.boss_score || null,
    }));
    const updatedExtras = (review.extra_contributions || []).map((e, i) => ({
      ...e,
      boss_score: extraScores[i] || e.boss_score || null,
    }));

    await base44.entities.AnnualReview.update(review.id, {
      project_contributions: updatedProjects,
      extra_contributions: updatedExtras,
    });

    setSaving(false);
    if (onUpdated) onUpdated();
  };

  const renderScoreButtons = (currentScore, onScore) => {
    const level = scoreLevels.find(sl => sl.score === currentScore);
    return (
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(score => {
            const sl = scoreLevels.find(s => s.score === score);
            const isSelected = currentScore === score;
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

  if (scoredProjects.length === 0 && scoredExtras.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border-2 border-purple-200 shadow-sm overflow-hidden">
      <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
        <h3 className="font-bold text-base text-purple-800">👑 老闆評分</h3>
        <p className="text-sm text-purple-600 mt-0.5">以下為有自評分數的項目，請逐項評分。</p>
      </div>
      <div className="p-4 space-y-4">
        {/* Project items */}
        {scoredProjects.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-blue-800">📊 項目工作（{scoredProjects.length} 項）</h4>
            {scoredProjects.map(p => (
              <div key={p._idx} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                <div>
                  <div className="font-semibold text-base text-gray-900">{p.project_name}</div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <span className="text-blue-600 font-bold">{p.hours}h</span>
                    <span>{p.tasks} 個任務</span>
                    {p.sales_amount > 0 && <span className="text-yellow-600 font-semibold">${p.sales_amount.toLocaleString()}</span>}
                  </div>
                  {p.contribution_note && (
                    <div className="text-sm text-gray-600 mt-2 bg-white rounded-lg px-3 py-2 leading-relaxed border border-gray-100">
                      {parseContribution(p.contribution_note)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">員工自評：{p.self_score} 分</span>
                  {p.leader_score > 0 && (
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">上司評分：{p.leader_score} 分</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-purple-700 mb-1.5">老闆評分</div>
                  {renderScoreButtons(
                    projectScores[p._idx] || 0,
                    (s) => setProjectScores(prev => ({ ...prev, [p._idx]: s }))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extra items */}
        {scoredExtras.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-teal-800">🌟 額外貢獻（{scoredExtras.length} 項）</h4>
            {scoredExtras.map(e => (
              <div key={e._idx} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-base text-gray-700 leading-relaxed">{e.description}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">員工自評：{e.self_score} 分</span>
                  {e.leader_score > 0 && (
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">上司評分：{e.leader_score} 分</span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-purple-700 mb-1.5">老闆評分</div>
                  {renderScoreButtons(
                    extraScores[e._idx] || 0,
                    (s) => setExtraScores(prev => ({ ...prev, [e._idx]: s }))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !allScored}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {saving ? "儲存中..." : "儲存老闆評分"}
        </button>
        {!allScored && (
          <p className="text-xs text-center text-amber-600">請先為所有項目評分後才能儲存</p>
        )}
      </div>
    </div>
  );
}