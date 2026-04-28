import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2 } from "lucide-react";

const SCORE_COLORS = {
  5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", active: "bg-emerald-500" },
  4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", active: "bg-blue-500" },
  3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", active: "bg-amber-500" },
  2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", active: "bg-orange-500" },
  1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", active: "bg-red-500" },
};

export default function ExtraContributionSection({ items, onChange }) {
  const [scoreLevels, setScoreLevels] = useState([]);

  useEffect(() => {
    base44.entities.ScoreLevel.filter({ is_active: true }, "-score", 100).then(setScoreLevels);
  }, []);

  const addItem = () => {
    onChange([...items, { description: "", self_score: 0 }]);
  };

  const updateItem = (idx, field, value) => {
    const next = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange(next);
  };

  const removeItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const level = scoreLevels.find(sl => sl.score === item.self_score);
        return (
          <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-sm font-bold text-teal-600 mt-1 shrink-0">{idx + 1}.</span>
              <textarea
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none bg-white"
                rows={2}
                placeholder="描述你的額外貢獻，例如：協助新同事培訓、主動優化工作流程..."
                value={item.description}
                onChange={e => updateItem(idx, "description", e.target.value)}
              />
              <button
                onClick={() => removeItem(idx)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-1"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Self score - only show when description has content */}
            {item.description?.trim() && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1.5">自評分數</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(score => {
                    const sl = scoreLevels.find(s => s.score === score);
                    const isSelected = item.self_score === score;
                    const sc = SCORE_COLORS[score];
                    return (
                      <button
                        key={score}
                        onClick={() => updateItem(idx, "self_score", score)}
                        title={sl ? `${sl.label}：${sl.description}` : `${score} 分`}
                        className={`flex-1 py-2 rounded-lg text-center transition-all border-2 ${
                          isSelected
                            ? `${sc.active} text-white border-transparent shadow-md scale-105`
                            : `${sc.bg} ${sc.border} ${sc.text} hover:scale-102`
                        }`}
                      >
                        <div className="text-sm font-black">{score}</div>
                        {sl && <div className={`text-[9px] font-semibold leading-tight ${isSelected ? "text-white/90" : ""}`}>{sl.label}</div>}
                      </button>
                    );
                  })}
                </div>
                {level && (
                  <div className="mt-1.5 text-xs text-gray-500 bg-white rounded-lg px-3 py-1.5 border border-gray-100">
                    <span className="font-semibold">{level.label}</span>：{level.description}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={addItem}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-teal-300 rounded-xl text-sm font-semibold text-teal-600 hover:bg-teal-50 hover:border-teal-400 transition-colors"
      >
        <Plus size={16} /> 新增額外貢獻
      </button>
    </div>
  );
}