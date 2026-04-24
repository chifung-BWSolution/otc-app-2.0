import { X } from "lucide-react";
import { QUESTIONS, SECTION_COLORS } from "./PeerReviewQuestions";

export default function PeerReviewDetailModal({ review, staffMap, onClose }) {
  const r = review;

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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-gray-900">{r.reviewer_name} → {r.reviewee_name}</h3>
            <p className="text-xs text-gray-400">{r.fiscal_year} · {r.reviewer_team_group}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          {sections.map(sec => {
            const colors = SECTION_COLORS[sec.color];
            return (
              <div key={sec.section}>
                <h4 className={`font-bold text-xs mb-2 ${colors.text}`}>{sec.label}</h4>
                {sec.questions.map(q => {
                  const answer = r[q.key];
                  const opt = q.options.find(o => o.value === answer);
                  return (
                    <div key={q.key} className="mb-2">
                      <div className="text-xs text-gray-500">{q.label}</div>
                      <div className={`text-sm font-semibold mt-0.5 ${answer ? "text-gray-800" : "text-gray-300 italic"}`}>
                        {opt ? `${opt.value}. ${opt.label}` : "（未作答）"}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {r.comment && (
            <div>
              <div className="text-xs text-gray-500 font-bold">💬 額外補充</div>
              <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}