import { useState } from "react";
import { Save, CheckCircle2, Loader2 } from "lucide-react";

const SECTIONS = [
  { key: "score_projects", label: "📊 項目工作貢獻", max: 70 },
  { key: "score_contributions", label: "🏆 其他貢獻 / 成就 / 創新", max: 10 },
  { key: "score_challenges", label: "⚡ 困難及解決方法", max: 5 },
  { key: "score_goals", label: "🎯 未來一年目標", max: 5 },
  { key: "score_peer_review", label: "👥 同事互評", max: 5 },
  { key: "score_attendance", label: "📋 考勤", max: 5, auto: true },
];

export default function AppraisalScoring({ report, onSave }) {
  const [scores, setScores] = useState({
    score_projects: report.score_projects || 0,
    score_contributions: report.score_contributions || 0,
    score_challenges: report.score_challenges || 0,
    score_goals: report.score_goals || 0,
    score_peer_review: report.score_peer_review || 0,
    score_attendance: report.score_attendance || 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(report.scoring_completed || false);

  const total = Object.values(scores).reduce((s, v) => s + (v || 0), 0);

  const set = (key, val) => {
    const section = SECTIONS.find(s => s.key === key);
    const num = Math.min(Math.max(0, Number(val) || 0), section.max);
    setScores(prev => ({ ...prev, [key]: num }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(scores);
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-indigo-100">
        <h3 className="font-bold text-sm text-indigo-800">🏅 表現評分</h3>
        <p className="text-xs text-gray-500 mt-0.5">請對每個範疇進行評分（總分 100 分）</p>
      </div>
      <div className="p-4 space-y-4">
        {SECTIONS.map(sec => (
          <div key={sec.key}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-gray-700">{sec.label}</span>
              <span className="text-xs text-gray-400">滿分 {sec.max}</span>
            </div>
            {sec.auto ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-300 rounded-full" style={{ width: `${(scores[sec.key] / sec.max) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-400 w-12 text-right">{scores[sec.key]} / {sec.max}</span>
                <span className="text-xs text-gray-400 italic">（自動計算）</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={sec.max}
                  step={1}
                  value={scores[sec.key]}
                  onChange={e => set(sec.key, e.target.value)}
                  className="flex-1 h-2 accent-indigo-600"
                />
                <input
                  type="number"
                  min={0}
                  max={sec.max}
                  value={scores[sec.key]}
                  onChange={e => set(sec.key, e.target.value)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="text-xs text-gray-400 w-8">/ {sec.max}</span>
              </div>
            )}
          </div>
        ))}

        {/* Total */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-800">總分</span>
            <span className={`text-2xl font-black ${total >= 80 ? "text-green-600" : total >= 60 ? "text-amber-600" : "text-red-600"}`}>
              {total} / 100
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${total >= 80 ? "bg-green-500" : total >= 60 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${total}%` }}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? "已儲存評分" : "儲存評分"}
        </button>
      </div>
    </div>
  );
}