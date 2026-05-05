import { SKILL_ITEMS } from "@/lib/scoringConfig";

const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", active: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", active: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", active: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", active: "bg-red-500" },
};

export default function SkillScoreSection({ skillScores, skillSelfScores, onScoreChange, readOnly, weightPct }) {
  // Calculate averages: for each skill, average of self_score and boss_score (if both exist)
  const getScores = (key) => {
    const boss = skillScores?.find(s => s.key === key)?.boss_score || 0;
    const self = skillSelfScores?.find(s => s.key === key)?.self_score || 0;
    const vals = [self, boss].filter(v => v > 0);
    const avg = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    return { self, boss, avg };
  };

  const allAvgs = SKILL_ITEMS.map(s => getScores(s.key).avg).filter(v => v > 0);
  const overallAvg = allAvgs.length > 0 ? Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10 : 0;
  const bossScoredCount = (skillScores || []).filter(s => s.boss_score > 0).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-cyan-50 px-4 py-3 border-b border-cyan-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-cyan-800">🛠️ 工作技能評分（{SKILL_ITEMS.length} 項）</h3>
          <div className="flex items-center gap-2">
            {overallAvg > 0 && (
              <span className="text-sm font-black text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-lg">
                平均 {overallAvg}/5
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
        {SKILL_ITEMS.map((skill) => {
          const { self, boss, avg } = getScores(skill.key);
          const bossDesc = boss > 0 ? skill.descriptions[boss] : null;

          return (
            <div key={skill.key} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{skill.icon}</span>
                <span className="text-sm font-bold text-gray-800 flex-1">{skill.label}</span>
                {/* Show self score badge */}
                {self > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">自評 {self}</span>
                )}
                {/* Show boss score badge */}
                {boss > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">老闆 {boss}</span>
                )}
                {/* Show average */}
                {avg > 0 && (self > 0 || boss > 0) && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">平均 {avg}</span>
                )}
              </div>

              {!readOnly ? (
                <>
                  <div className="text-xs font-semibold text-purple-700 mb-1">老闆評分：</div>
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map(s => {
                      const sc = SCORE_COLORS[s];
                      const isSelected = boss === s;
                      return (
                        <button
                          key={s}
                          onClick={() => onScoreChange(skill.key, s)}
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
                  {/* Always show all descriptions */}
                  <div className="space-y-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(s => {
                      const sc = SCORE_COLORS[s];
                      const isSelected = boss === s;
                      return (
                        <div
                          key={s}
                          className={`text-xs rounded-lg px-3 py-1 border transition-all ${
                            isSelected
                              ? `${sc.bg} ${sc.border} font-semibold ${sc.text}`
                              : "border-transparent text-gray-400"
                          }`}
                        >
                          <span className="font-bold">{s}分</span>：{skill.descriptions[s]}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  {boss > 0 && (
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${SCORE_COLORS[boss]?.active || "bg-gray-300"}`} style={{ width: `${(boss / 5) * 100}%` }} />
                    </div>
                  )}
                  {bossDesc && (
                    <div className="text-xs text-gray-500 mt-1">{bossDesc}</div>
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