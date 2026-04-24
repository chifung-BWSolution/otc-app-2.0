import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Ban, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { QUESTIONS, SECTION_COLORS } from "./PeerReviewQuestions";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

// Custom bar label: show who picked this option
function BarLabel({ x, y, width, height, value, payload, reviewerNames }) {
  if (!value || value === 0) return null;
  const names = reviewerNames || [];
  return (
    <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={12} fill="#4b5563" fontWeight={500}>
      {names.join("、")}
    </text>
  );
}

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

  // Build chart data with reviewer names per option
  const chartData = useMemo(() => {
    return QUESTIONS.map(q => {
      const optionReviewers = {};
      for (const opt of q.options) optionReviewers[opt.value] = [];
      for (const r of submittedReviews) {
        const ans = r[q.key];
        if (ans && optionReviewers[ans]) optionReviewers[ans].push(r.reviewer_name);
      }
      return {
        question: q,
        data: q.options.map(opt => ({
          name: `${opt.value}`,
          label: opt.label,
          count: optionReviewers[opt.value].length,
          reviewerNames: optionReviewers[opt.value],
        })),
      };
    });
  }, [submittedReviews]);

  // Reviews with comments
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

      {/* Bar charts per section */}
      {submittedReviews.length > 0 && sections.map(sec => {
        const colors = SECTION_COLORS[sec.color];
        return (
          <div key={sec.section}>
            <div className={`text-sm font-bold mb-3 ${colors.text}`}>{sec.label}</div>
            {sec.items.map(({ question, data }) => (
              <div key={question.key} className="mb-5">
                <div className="text-sm text-gray-700 font-medium mb-2">{question.label}</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={data} layout="vertical" margin={{ top: 0, right: 120, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={28} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <Tooltip
                      formatter={(value, name, props) => [value + " 人", props.payload.label]}
                      labelFormatter={() => ""}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}
                      label={(props) => <BarLabel {...props} reviewerNames={data[props.index]?.reviewerNames} />}
                    >
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        );
      })}

      {/* Extra comments section */}
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