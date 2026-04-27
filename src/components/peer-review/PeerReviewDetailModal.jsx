import { X } from "lucide-react";
import { DIMENSIONS, DIMENSION_COLORS } from "./PeerReviewQuestions";

export default function PeerReviewDetailModal({ review, staffMap, onClose }) {
  const r = review;

  const totalScore = DIMENSIONS.reduce((s, d) => s + (r[d.key] || 0), 0);
  const avgScore = DIMENSIONS.filter(d => r[d.key] > 0).length > 0
    ? Math.round((totalScore / DIMENSIONS.filter(d => r[d.key] > 0).length) * 10) / 10
    : 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-gray-900">{r.reviewer_name} → {r.reviewee_name}</h3>
            <p className="text-xs text-gray-400">{r.fiscal_year} · {r.reviewer_team_group} · 平均 {avgScore} 分</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          {DIMENSIONS.map(dim => {
            const score = r[dim.key] || 0;
            const colors = DIMENSION_COLORS[dim.color];
            const scoreColors = {
              5: "bg-emerald-500", 4: "bg-blue-500", 3: "bg-amber-500", 2: "bg-orange-500", 1: "bg-red-500",
            };
            return (
              <div key={dim.key} className="flex items-center gap-3 py-2">
                <span className="text-base">{dim.icon}</span>
                <span className={`text-sm font-medium flex-1 ${colors.text}`}>{dim.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <div
                      key={s}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        s <= score ? `${scoreColors[s] || "bg-gray-400"} text-white` : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      {s}
                    </div>
                  ))}
                </div>
                <span className="text-sm font-black text-gray-800 w-8 text-right">{score || "—"}</span>
              </div>
            );
          })}
          {r.comment && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 font-bold">💬 額外補充</div>
              <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}