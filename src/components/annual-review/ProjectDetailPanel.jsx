import { Plus, X, Star } from "lucide-react";

const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", activeBg: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", activeBg: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", activeBg: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", activeBg: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", activeBg: "bg-red-500" },
};

export default function ProjectDetailPanel({
  project, points, score, contributionTypes, scoreLevels,
  onUpdateSales, onUpdatePoint, onAddPoint, onRemovePoint, onUpdateScore
}) {
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        ← 請從左側選擇項目
      </div>
    );
  }

  return (
    <>
      {/* Project header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-indigo-100">
        <div className="text-sm font-bold text-gray-800 truncate">{project.project_name}</div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs bg-white/80 text-indigo-600 px-2 py-0.5 rounded-full font-semibold border border-indigo-100">{project.hours}h</span>
          <span className="text-xs text-gray-500">{project.tasks} 個任務</span>
          {score > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${SCORE_COLORS[score]?.bg} ${SCORE_COLORS[score]?.border} ${SCORE_COLORS[score]?.text}`}>
              ⭐ 自評 {score} 分
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Step 1: Contribution points */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">1</span>
            <label className="text-sm font-semibold text-gray-700">📝 貢獻重點 + 成長重點</label>
            <span className="text-xs text-gray-400 ml-auto">{points.filter(p => p.text?.trim()).length} 項已填寫</span>
          </div>

          <div className="space-y-3">
            {points.map((pt, pi) => (
              <ContributionPointRow
                key={pi}
                index={pi}
                point={pt}
                contributionTypes={contributionTypes}
                canRemove={points.length > 1}
                onUpdate={(field, value) => onUpdatePoint(pi, field, value)}
                onRemove={() => onRemovePoint(pi)}
              />
            ))}
          </div>

          <button
            onClick={onAddPoint}
            className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition-colors px-1"
          >
            <Plus size={13} /> 新增一項貢獻 / 成長重點
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {/* Step 2: Self Score — only enabled if has contribution text */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">2</span>
            <label className="text-sm font-semibold text-gray-700">⭐ 自評分數</label>
          </div>

          {!points.some(p => p.text?.trim()) ? (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-3 text-center border border-dashed border-gray-200">
              請先填寫貢獻重點後才可自評分數
            </div>
          ) : (
            <>
              <div className="flex gap-1.5">
                {[...scoreLevels].sort((a, b) => a.score - b.score).map(sl => {
                  const isSelected = score === sl.score;
                  const colors = SCORE_COLORS[sl.score] || SCORE_COLORS[3];
                  return (
                    <button
                      key={sl.id}
                      onClick={() => onUpdateScore(sl.score)}
                      title={`${sl.score} 分 — ${sl.label}：${sl.description}`}
                      className={`flex-1 py-2.5 rounded-xl text-center transition-all border-2 ${
                        isSelected
                          ? `${colors.activeBg} text-white border-transparent shadow-md scale-105`
                          : `${colors.bg} ${colors.border} ${colors.text} hover:scale-102`
                      }`}
                    >
                      <div className="text-xl font-black">{sl.score}</div>
                      <div className={`text-xs font-semibold leading-tight ${isSelected ? "text-white/90" : ""}`}>{sl.label}</div>
                    </button>
                  );
                })}
              </div>
              {score > 0 && (() => {
                const sl = scoreLevels.find(s => s.score === score);
                if (!sl) return null;
                const colors = SCORE_COLORS[score] || SCORE_COLORS[3];
                return (
                  <div className={`mt-2 text-xs ${colors.text} ${colors.bg} rounded-lg px-3 py-2 border ${colors.border}`}>
                    <span className="font-semibold">{sl.label}</span>：{sl.description}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ContributionPointRow({ index, point, contributionTypes, canRemove, onUpdate, onRemove }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Type selection as pill buttons */}
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-gray-400 font-bold">{index + 1}.</span>
          <span className="text-xs text-gray-500">選擇類型：</span>
          {canRemove && (
            <button onClick={onRemove} className="ml-auto p-0.5 text-gray-300 hover:text-red-500 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {contributionTypes.map(ct => {
            const isActive = point.type === ct.name;
            return (
              <button
                key={ct.id}
                onClick={() => onUpdate("type", isActive ? "" : ct.name)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"
                }`}
              >
                {ct.icon} {ct.name}
              </button>
            );
          })}
        </div>
      </div>
      {/* Text input */}
      <div className="px-3 pb-2.5">
        <textarea
          className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-gray-50/50 resize-none"
          rows={2}
          placeholder={point.type ? `描述你在「${point.type}」方面的具體貢獻或成長...` : "先選擇類型，再描述貢獻或成長..."}
          value={point.text || ""}
          onChange={e => onUpdate("text", e.target.value)}
        />
      </div>
    </div>
  );
}