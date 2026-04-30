import { useState, useEffect } from "react";
import { Save, Send, Loader2, ArrowLeft, Ban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DIMENSIONS, DIMENSION_COLORS } from "./PeerReviewQuestions";

export default function PeerReviewForm({ reviewee, existingReview, saving, onSave, onNoCollab, onBack }) {
  const [scores, setScores] = useState(() => {
    const init = {};
    for (const d of DIMENSIONS) {
      init[d.key] = existingReview?.[d.key] || 0;
    }
    return init;
  });
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [privateNote, setPrivateNote] = useState(existingReview?.private_note || "");
  const [scoreLevels, setScoreLevels] = useState([]);

  useEffect(() => {
    base44.entities.ScoreLevel.filter({ is_active: true }, "-score", 100).then(setScoreLevels);
  }, []);

  const setScore = (key, val) => setScores(prev => ({ ...prev, [key]: val }));
  const isComplete = DIMENSIONS.every(d => scores[d.key] > 0);
  const isSubmitted = existingReview?.status === "submitted";
  const isNoCollab = existingReview?.status === "no_collaboration";

  const handleSave = (submit) => {
    onSave({ ...scores, comment, private_note: privateNote }, submit);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          {reviewee.profile_pic ? (
            <img src={reviewee.profile_pic} className="w-10 h-10 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {(reviewee.display_name || "?")[0]}
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">評核 {reviewee.display_name}</h3>
            <p className="text-xs text-gray-400">{reviewee.team_name} · {reviewee.position}</p>
          </div>
        </div>
        {isSubmitted && (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">已提交</span>
        )}
        {isNoCollab && (
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
            無合作過 {existingReview.no_collab_approved === "approved" ? "✅" : existingReview.no_collab_approved === "rejected" ? "❌ 已拒絕" : "⏳ 待審批"}
          </span>
        )}
      </div>

      {/* No collaboration option */}
      {!isSubmitted && !isNoCollab && (
        <button
          onClick={() => {
            if (window.confirm(`確認你同 ${reviewee.display_name} 無合作過？管理員會審核此申請。`)) {
              onNoCollab();
            }
          }}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50"
        >
          <Ban size={14} />
          我同呢位同事無合作過
        </button>
      )}

      {/* Score dimensions */}
      {DIMENSIONS.map(dim => {
        const colors = DIMENSION_COLORS[dim.color];
        const currentScore = scores[dim.key];
        const level = scoreLevels.find(sl => sl.score === currentScore);
        return (
          <div key={dim.key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`${colors.bg} px-4 py-3 border-b ${colors.border}`}>
              <h4 className={`font-bold text-sm ${colors.text}`}>{dim.icon} {dim.label}</h4>
              <p className="text-xs text-gray-500 mt-0.5">{dim.description}</p>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(score => {
                  const sl = scoreLevels.find(s => s.score === score);
                  const isSelected = currentScore === score;
                  const scoreColors = {
                    5: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", activeBg: "bg-emerald-500" },
                    4: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", activeBg: "bg-blue-500" },
                    3: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", activeBg: "bg-amber-500" },
                    2: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", activeBg: "bg-orange-500" },
                    1: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", activeBg: "bg-red-500" },
                  };
                  const sc = scoreColors[score];
                  return (
                    <button
                      key={score}
                      onClick={() => !isSubmitted && setScore(dim.key, score)}
                      disabled={isSubmitted}
                      title={sl ? `${sl.label}：${sl.description}` : `${score} 分`}
                      className={`flex-1 py-3 rounded-xl text-center transition-all border-2 ${
                        isSelected
                          ? `${sc.activeBg} text-white border-transparent shadow-md scale-105`
                          : `${sc.bg} ${sc.border} ${sc.text} hover:scale-102`
                      } ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="text-lg font-black">{score}</div>
                      {sl && <div className={`text-[10px] font-semibold leading-tight ${isSelected ? "text-white/90" : ""}`}>{sl.label}</div>}
                    </button>
                  );
                })}
              </div>
              {level && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <span className="font-semibold">{level.label}</span>：{level.description}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Comment */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <label className="text-sm font-semibold text-gray-700 block mb-2">💬 額外補充（選填）</label>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          rows={3}
          placeholder="有任何其他想對這位同事說的話..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={isSubmitted}
        />
      </div>

      {/* Private note to company */}
      <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-4">
        <label className="text-sm font-semibold text-gray-700 block mb-1">🔒 告訴公司的事（不公開）</label>
        <p className="text-xs text-amber-600 mb-2">此資訊不會公開予同事，只供公司參考。</p>
        <textarea
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
          rows={3}
          placeholder="任何想讓公司知道但不適合公開的事..."
          value={privateNote}
          onChange={e => setPrivateNote(e.target.value)}
          disabled={isSubmitted}
        />
      </div>

      {/* Actions */}
      {!isSubmitted && !isNoCollab && (
        <div className="space-y-3 pb-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              儲存草稿
            </button>
            <button
              onClick={() => {
                if (!isComplete) {
                  alert("請先為所有範疇評分再提交");
                  return;
                }
                if (window.confirm("確認提交互評？提交後將無法修改。")) {
                  handleSave(true);
                }
              }}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              正式提交
            </button>
          </div>
        </div>
      )}
    </div>
  );
}