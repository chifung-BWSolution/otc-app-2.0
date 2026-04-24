import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { QUESTIONS, SECTION_COLORS } from "./PeerReviewQuestions";

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

export default function PeerReviewResultSection({ staffId, fiscalYear }) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (staffId && fiscalYear) loadReviews();
  }, [staffId, fiscalYear]);

  const loadReviews = async () => {
    setLoading(true);
    const data = await base44.entities.PeerReview.filter(
      { reviewee_staff_id: staffId, fiscal_year: fiscalYear },
      "-created_date", 200
    );
    setReviews(data);
    setLoading(false);
  };

  const submittedReviews = useMemo(() => reviews.filter(r => r.status === "submitted"), [reviews]);
  const noCollabReviews = useMemo(() => reviews.filter(r => r.status === "no_collaboration"), [reviews]);

  const chartData = useMemo(() => {
    return QUESTIONS.map(q => {
      const optionReviewers = {};
      for (const opt of q.options) optionReviewers[opt.value] = [];
      for (const r of submittedReviews) {
        const ans = r[q.key];
        if (ans && optionReviewers[ans]) optionReviewers[ans].push(r.reviewer_name);
      }
      const maxCount = Math.max(1, ...q.options.map(opt => optionReviewers[opt.value].length));
      return {
        question: q,
        maxCount,
        data: q.options.map(opt => ({
          value: opt.value,
          label: opt.label,
          count: optionReviewers[opt.value].length,
          reviewerNames: optionReviewers[opt.value],
        })),
      };
    });
  }, [submittedReviews]);

  const reviewsWithComments = useMemo(() => submittedReviews.filter(r => r.comment && r.comment.trim()), [submittedReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">載入互評數據...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return <div className="text-center py-4 text-gray-400 text-sm">暫無同事互評數據</div>;
  }

  // Group questions by section
  const sections = [];
  let lastSection = null;
  for (const cd of chartData) {
    if (cd.question.section !== lastSection) {
      sections.push({ section: cd.question.section, label: cd.question.sectionLabel, color: cd.question.sectionColor, items: [] });
      lastSection = cd.question.section;
    }
    sections[sections.length - 1].items.push(cd);
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex gap-3">
        <div className="bg-indigo-50 rounded-lg px-4 py-3 text-center flex-1 border border-indigo-100">
          <div className="text-2xl font-bold text-indigo-600">{submittedReviews.length}</div>
          <div className="text-xs text-gray-500">已提交互評</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-center flex-1 border border-gray-200">
          <div className="text-2xl font-bold text-gray-500">{noCollabReviews.length}</div>
          <div className="text-xs text-gray-500">無合作過</div>
        </div>
      </div>

      {/* No collab list */}
      {noCollabReviews.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-1"><Ban size={14} /> 標記無合作過的同事</div>
          <div className="flex flex-wrap gap-1.5">
            {noCollabReviews.map(r => (
              <span key={r.id} className="text-sm bg-white border border-gray-200 px-2.5 py-1 rounded-full text-gray-600">
                {r.reviewer_name} {r.no_collab_approved === "approved" ? "✅" : r.no_collab_approved === "rejected" ? "❌" : "⏳"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom chart per section */}
      {submittedReviews.length > 0 && sections.map(sec => {
        const colors = SECTION_COLORS[sec.color];
        return (
          <div key={sec.section}>
            <div className={`text-sm font-bold mb-3 ${colors.text}`}>{sec.label}</div>
            {sec.items.map(({ question, data, maxCount }) => (
              <QuestionChart key={question.key} question={question} data={data} maxCount={maxCount} />
            ))}
          </div>
        );
      })}

      {/* Extra comments */}
      {reviewsWithComments.length > 0 && (
        <div>
          <button onClick={() => setShowDetail(!showDetail)}
            className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800">
            {showDetail ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDetail ? "收起額外補充" : `查看額外補充 (${reviewsWithComments.length})`}
          </button>
          {showDetail && (
            <div className="mt-2 space-y-2">
              {reviewsWithComments.map(r => (
                <div key={r.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-sm font-bold text-gray-700 mb-1">{r.reviewer_name}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">💬 {r.comment}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionChart({ question, data, maxCount }) {
  return (
    <div className="mb-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="text-sm text-gray-700 font-semibold mb-3">{question.label}</div>
      <div className="space-y-3">
        {data.map((opt, i) => {
          const pct = maxCount > 0 ? (opt.count / maxCount) * 100 : 0;
          return (
            <div key={opt.value}>
              {/* Option label */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold w-5 h-5 rounded flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}>
                  {opt.value}
                </span>
                <span className="text-xs text-gray-600 flex-1">{opt.label}</span>
                <span className="text-xs font-bold text-gray-500">{opt.count} 人</span>
              </div>
              {/* Bar */}
              <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(pct, opt.count > 0 ? 8 : 0)}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                />
              </div>
              {/* Reviewer name tags */}
              {opt.reviewerNames.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {opt.reviewerNames.map((name, ni) => (
                    <span key={ni} className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] + "cc" }}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}