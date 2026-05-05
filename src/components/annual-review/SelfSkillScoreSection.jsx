import { SKILL_ITEMS } from "@/lib/scoringConfig";

const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", active: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", active: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", active: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", active: "bg-red-500" },
};

export default function SelfSkillScoreSection({ skillSelfScores, onScoreChange }) {
  const scoredCount = (skillSelfScores || []).filter(s => s.self_score > 0).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-cyan-50 px-5 py-4 border-b border-cyan-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-cyan-800">🛠️ 第五部分：工作技能自評（{SKILL_ITEMS.length} 項）</h3>
            <p className="text-sm text-cyan-600 mt-0.5">請根據自己的表現，為以下每項技能評分。</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${scoredCount === SKILL_ITEMS.length ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {scoredCount}/{SKILL_ITEMS.length} 已評
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {SKILL_ITEMS.map((skill) => {
          const current = skillSelfScores?.find(s => s.key === skill.key);
          const score = current?.self_score || 0;

          return (
            <div key={skill.key} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{skill.icon}</span>
                <span className="text-sm font-bold text-gray-800 flex-1">{skill.label}</span>
                {score > 0 && (
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">{score}/5</span>
                )}
              </div>

              {/* Score buttons */}
              <div className="flex gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map(s => {
                  const sc = SCORE_COLORS[s];
                  const isSelected = score === s;
                  return (
                    <button
                      key={s}
                      onClick={() => onScoreChange(skill.key, s)}
                      className={`flex-1 py-2 rounded-lg text-center transition-all border-2 ${
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
              <div className="space-y-1">
                {[1, 2, 3, 4, 5].map(s => {
                  const sc = SCORE_COLORS[s];
                  const isSelected = score === s;
                  return (
                    <div
                      key={s}
                      className={`text-xs rounded-lg px-3 py-1.5 border transition-all ${
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
            </div>
          );
        })}
      </div>
    </div>
  );
}