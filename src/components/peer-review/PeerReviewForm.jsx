import { useState } from "react";
import { Save, Send, Loader2, ArrowLeft } from "lucide-react";
import { QUESTIONS, SECTION_COLORS } from "./PeerReviewQuestions";

export default function PeerReviewForm({ reviewee, existingReview, saving, onSave, onBack }) {
  const [answers, setAnswers] = useState(() => {
    const init = {};
    for (const q of QUESTIONS) {
      init[q.key] = existingReview?.[q.key] || "";
    }
    init.comment = existingReview?.comment || "";
    return init;
  });

  const set = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const isComplete = QUESTIONS.every(q => answers[q.key]);

  // Group questions by section
  const sections = [];
  let lastSection = null;
  for (const q of QUESTIONS) {
    if (q.section !== lastSection) {
      sections.push({ section: q.section, label: q.sectionLabel, color: q.sectionColor, questions: [] });
      lastSection = q.section;
    }
    sections[sections.length - 1].questions.push(q);
  }

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
        {existingReview?.status === "submitted" && (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">已提交</span>
        )}
      </div>

      {/* Question sections */}
      {sections.map(sec => {
        const colors = SECTION_COLORS[sec.color];
        return (
          <div key={sec.section} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`${colors.bg} px-4 py-3 border-b ${colors.border}`}>
              <h4 className={`font-bold text-sm ${colors.text}`}>{sec.label}</h4>
            </div>
            <div className="p-4 space-y-5">
              {sec.questions.map(q => (
                <div key={q.key}>
                  <div className="text-sm font-semibold text-gray-800 mb-2.5">{q.label}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map(opt => {
                      const isSelected = answers[q.key] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => !existingReview?.status?.includes("submitted") && set(q.key, opt.value)}
                          disabled={existingReview?.status === "submitted"}
                          className={`text-left px-3 py-2.5 rounded-lg border-2 text-sm transition-all ${
                            isSelected
                              ? colors.optionActive + " border-2 font-semibold"
                              : "border-gray-100 text-gray-600 " + colors.optionHover
                          } ${existingReview?.status === "submitted" ? "cursor-default" : "cursor-pointer"}`}
                        >
                          <span className="font-bold mr-1.5">{opt.value}.</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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
          value={answers.comment}
          onChange={e => set("comment", e.target.value)}
          disabled={existingReview?.status === "submitted"}
        />
      </div>

      {/* Actions */}
      {existingReview?.status !== "submitted" && (
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => onSave(answers, false)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            儲存草稿
          </button>
          <button
            onClick={() => {
              if (!isComplete) {
                alert("請先完成所有問題再提交");
                return;
              }
              if (window.confirm("確認提交互評？提交後將無法修改。")) {
                onSave(answers, true);
              }
            }}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            正式提交
          </button>
        </div>
      )}
    </div>
  );
}