import { useState } from "react";

export default function GpScoreSection({ gpFields, bossGpScore, bossGpComment, onScoreChange, onCommentChange, readOnly, weightPct }) {
  const hasData = gpFields?.some(f => f.amount > 0);
  const scoreColor = bossGpScore >= 80 ? "text-emerald-600" : bossGpScore >= 60 ? "text-amber-600" : bossGpScore > 0 ? "text-red-600" : "text-gray-400";
  const barColor = bossGpScore >= 80 ? "bg-emerald-500" : bossGpScore >= 60 ? "bg-amber-500" : bossGpScore > 0 ? "bg-red-500" : "bg-gray-300";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-emerald-800">💰 Share GP 評分</h3>
          <div className="flex items-center gap-2">
            {bossGpScore > 0 && (
              <span className={`text-sm font-black px-2.5 py-1 rounded-lg ${bossGpScore >= 80 ? "bg-emerald-100 text-emerald-700" : bossGpScore >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                {bossGpScore}/100
              </span>
            )}
            {weightPct && (
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">({weightPct}%)</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* GP data summary */}
        {hasData && (
          <div className="space-y-1">
            {gpFields.filter(f => f.amount > 0).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 px-3 bg-emerald-50 rounded-lg">
                <span className="text-gray-700">{f.label}</span>
                <span className="font-bold text-emerald-700">${f.amount?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Boss score — 0-100 */}
        {!readOnly ? (
          <div className="space-y-3">
            <div className="text-sm font-bold text-emerald-700">老闆評分（0-100 分）：</div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={bossGpScore || 0}
                onChange={e => onScoreChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bossGpScore || ""}
                  onChange={e => {
                    const v = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                    onScoreChange(v);
                  }}
                  className="w-20 text-center text-2xl font-black border-2 border-emerald-300 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  placeholder="0"
                />
              </div>
            </div>
            {/* Score bar visual */}
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${bossGpScore || 0}%` }} />
            </div>
            {/* Quick buttons */}
            <div className="flex gap-2 flex-wrap">
              {[0, 20, 40, 60, 80, 100].map(v => (
                <button
                  key={v}
                  onClick={() => onScoreChange(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    bossGpScore === v
                      ? "bg-emerald-500 text-white border-transparent shadow-md"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Comment field */}
            <div>
              <div className="text-sm font-semibold text-emerald-700 mb-1.5">📝 GP 評語</div>
              <textarea
                className="w-full border border-emerald-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none bg-white"
                rows={3}
                placeholder="對 Share GP 表現的評語或備註..."
                value={bossGpComment || ""}
                onChange={e => onCommentChange?.(e.target.value)}
              />
            </div>
          </div>
        ) : bossGpScore > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">老闆評分：</span>
              <span className={`text-2xl font-black ${scoreColor}`}>{bossGpScore}<span className="text-sm font-medium text-gray-400 ml-1">/ 100</span></span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${bossGpScore}%` }} />
            </div>
            {bossGpComment && (
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <div className="text-xs font-semibold text-emerald-700 mb-1">📝 GP 評語</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{bossGpComment}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">未評分</div>
        )}
      </div>
    </div>
  );
}