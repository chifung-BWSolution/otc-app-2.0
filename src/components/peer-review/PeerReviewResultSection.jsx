import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { DIMENSIONS, DIMENSION_COLORS } from "./PeerReviewQuestions";

export default function PeerReviewResultSection({ staffId, fiscalYear }) {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [showComments, setShowComments] = useState(false);

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
  const reviewsWithComments = useMemo(() => submittedReviews.filter(r => r.comment?.trim()), [submittedReviews]);

  // Calculate average scores per dimension
  const dimStats = useMemo(() => {
    if (submittedReviews.length === 0) return [];
    return DIMENSIONS.map(dim => {
      const scores = submittedReviews.map(r => r[dim.key]).filter(s => s > 0);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { ...dim, avg: Math.round(avg * 10) / 10, count: scores.length, scores };
    });
  }, [submittedReviews]);

  const overallAvg = useMemo(() => {
    const avgs = dimStats.filter(d => d.count > 0).map(d => d.avg);
    return avgs.length > 0 ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10 : 0;
  }, [dimStats]);

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

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="flex gap-3">
        <div className="bg-indigo-50 rounded-lg px-4 py-3 text-center flex-1 border border-indigo-100">
          <div className="text-2xl font-bold text-indigo-600">{submittedReviews.length}</div>
          <div className="text-xs text-gray-500">已提交互評</div>
        </div>
        {overallAvg > 0 && (
          <div className="bg-amber-50 rounded-lg px-4 py-3 text-center flex-1 border border-amber-100">
            <div className="text-2xl font-bold text-amber-600">{overallAvg}</div>
            <div className="text-xs text-gray-500">綜合平均分</div>
          </div>
        )}
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

      {/* Dimension scores */}
      {submittedReviews.length > 0 && (
        <div className="space-y-3">
          {dimStats.map(dim => {
            const colors = DIMENSION_COLORS[dim.color];
            const pct = dim.avg > 0 ? (dim.avg / 5) * 100 : 0;
            return (
              <div key={dim.key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{dim.icon}</span>
                  <span className={`text-sm font-bold ${colors.text} flex-1`}>{dim.label}</span>
                  <span className="text-lg font-black text-gray-800">{dim.avg}</span>
                  <span className="text-xs text-gray-400">/ 5</span>
                </div>
                {/* Score bar */}
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.active}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {/* Individual scores */}
                <div className="flex flex-wrap gap-1.5">
                  {submittedReviews.map(r => {
                    const score = r[dim.key];
                    if (!score) return null;
                    return (
                      <span key={r.id} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-600">
                        {r.reviewer_name}: <span className="font-bold">{score}分</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extra comments */}
      {reviewsWithComments.length > 0 && (
        <div>
          <button onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold hover:text-indigo-800">
            {showComments ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showComments ? "收起額外補充" : `查看額外補充 (${reviewsWithComments.length})`}
          </button>
          {showComments && (
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