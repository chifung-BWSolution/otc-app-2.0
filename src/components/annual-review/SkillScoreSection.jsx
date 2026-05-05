import { SKILL_ITEMS } from "@/lib/scoringConfig";

const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", active: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", active: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", active: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", active: "bg-red-500" },
};

export default function SkillScoreSection({ skillScores, onScoreChange, readOnly, weightPct }) {
  const scoredCount = (skillScores || []).filter(s => s.boss_score > 0).length;
  const avgScore = scoredCount > 0
    ? Math.round(((skillScores || []).filter(s => s.boss_score > 0).reduce((a, s) => a + s.boss_score, 0) / scoredCount) * 10) / 10
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-cyan-800">🛠️ 工作技能評分（{SKILL_ITEMS.length} 項）</h3>
          <div className="flex items-center gap-2">
            {avgScore > 0 && (
              <span className="text-sm font-black text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-lg">
                平均 {avgScore}/5
              </span>
            )}
            {weightPct && (
              <span className="text-xs font-medium text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded">
                ({weightPct}%)
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {SKILL_ITEMS.map((skill, idx) => {
          const current = skillScores?.find(s => s.key === skill.key);
          const score = current?.boss_score || 0;
          const desc = score > 0 ? skill.descriptions[score] : null;

          return (
            <div key={skill.key} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{skill.icon}</span>
                <span className="text-sm font-bold text-gray-800 flex-1">{skill.label}</span>
                {score > 0 && (
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">{score}/5</span>
                )}
              </div>

              {!readOnly ? (
                <>
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map(s => {
                      const sc = SCORE_COLORS[s];
                      const isSelected = score === s;
                      return (
                        <button
                          key={s}
                          onClick={() => onScoreChange(skill.key, s)}
                          title={skill.descriptions[s]}
                          className={`flex-1 py-2.5 rounded-lg text-center transition-all border-2 ${
                            isSelected
                              ? `${sc.active} text-white border-transparent shadow-md scale-105`
                              : `${sc.bg} ${sc.border} ${sc.text} hover:scale-102`
                          }`}
                        >
                          <div className="text-sm font-black">{s}</div>
                        </button>
                      );
                    })}
                  </div>
                  {desc && (
                    <div className="text-xs text-cyan-600 bg-cyan-50 rounded-lg px-3 py-1.5 border border-cyan-100">
                      <span className="font-bold">{score}分</span>：{desc}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {score > 0 && (
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${SCORE_COLORS[score]?.active || "bg-gray-300"}`} style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                  )}
                  {desc && (
                    <div className="text-xs text-gray-500 mt-1">{desc}</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}