const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", active: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", active: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", active: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", active: "bg-red-500" },
};

export default function GpScoreSection({ gpFields, bossGpScore, onScoreChange, readOnly, weightPct }) {
  const hasData = gpFields?.some(f => f.amount > 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-emerald-800">💰 Share GP 評分</h3>
          <div className="flex items-center gap-2">
            {bossGpScore > 0 && (
              <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">{bossGpScore}/5</span>
            )}
            {weightPct && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">({weightPct}%)</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        {/* GP data summary */}
        {hasData && (
          <div className="mb-3 space-y-1">
            {gpFields.filter(f => f.amount > 0).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 px-3 bg-emerald-50 rounded-lg">
                <span className="text-gray-700">{f.label}</span>
                <span className="font-bold text-emerald-700">${f.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Boss score */}
        {!readOnly ? (
          <div>
            <div className="text-sm font-bold text-emerald-700 mb-2">老闆評分：</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(s => {
                const sc = SCORE_COLORS[s];
                const isSelected = bossGpScore === s;
                return (
                  <button
                    key={s}
                    onClick={() => onScoreChange(s)}
                    className={`flex-1 py-3 rounded-xl text-center transition-all border-2 ${
                      isSelected
                        ? `${sc.active} text-white border-transparent shadow-md scale-105`
                        : `${sc.bg} ${sc.border} ${sc.text} hover:scale-102`
                    }`}
                  >
                    <div className="text-lg font-black">{s}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : bossGpScore > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">老闆評分：</span>
            <span className="text-lg font-black text-emerald-600">{bossGpScore}/5</span>
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">未評分</div>
        )}
      </div>
    </div>
  );
}