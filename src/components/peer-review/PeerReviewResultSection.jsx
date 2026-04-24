import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Ban, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { QUESTIONS, SECTION_COLORS } from "./PeerReviewQuestions";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

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

  // Build chart data: for each question, count how many selected each option
  const chartData = useMemo(() => {
    return QUESTIONS.map(q => {
      const counts = {};
      for (const opt of q.options) counts[opt.value] = 0;
      for (const r of submittedReviews) {
        const ans = r[q.key];
        if (ans && counts[ans] !== undefined) counts[ans]++;
      }
      return {
        question: q,
        data: q.options.map(opt => ({
          name: `${opt.value}`,
          label: opt.label,
          count: counts[opt.value],
        })),
      };
    });
  }, [submittedReviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">載入互評數據...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return <div className="text-center py-4 text-gray-400 text-xs">暫無同事互評數據</div>;
  }

  // Group questions by section for display
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
    <div className="space-y-3">
      {/* Summary stats */}
      <div className="flex gap-3">
        <div className="bg-indigo-50 rounded-lg px-3 py-2 text-center flex-1 border border-indigo-100">
          <div className="text-lg font-bold text-indigo-600">{submittedReviews.length}</div>
          <div className="text-[10px] text-gray-500">已提交互評</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center flex-1 border border-gray-200">
          <div className="text-lg font-bold text-gray-500">{noCollabReviews.length}</div>
          <div className="text-[10px] text-gray-500">無合作過</div>
        </div>
      </div>

      {/* No collab list */}
      {noCollabReviews.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1"><Ban size={12} /> 標記無合作過的同事</div>
          <div className="flex flex-wrap gap-1.5">
            {noCollabReviews.map(r => (
              <span key={r.id} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-600">
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
            <div className={`text-xs font-bold mb-2 ${colors.text}`}>{sec.label}</div>
            {sec.items.map(({ question, data }) => (
              <div key={question.key} className="mb-4">
                <div className="text-xs text-gray-600 mb-1.5">{question.label}</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={25} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name, props) => [value + " 人", props.payload.label]}
                      labelFormatter={() => ""}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        );
      })}

      {/* Detail toggle: who answered what */}
      <div>
        <button onClick={() => setShowDetail(!showDetail)}
          className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800">
          {showDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showDetail ? "收起詳細回覆" : "查看每位同事的回覆"}
        </button>
        {showDetail && (
          <div className="mt-2 space-y-2">
            {submittedReviews.map(r => (
              <div key={r.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="text-xs font-bold text-gray-700 mb-1.5">{r.reviewer_name}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {QUESTIONS.map(q => {
                    const ans = r[q.key];
                    const opt = q.options.find(o => o.value === ans);
                    return (
                      <div key={q.key} className="text-[11px]">
                        <span className="text-gray-400">Q{q.key.match(/q(\d)/)?.[1] || ""}:</span>{" "}
                        <span className="font-medium text-gray-700">{opt ? `${opt.value}. ${opt.label}` : "—"}</span>
                      </div>
                    );
                  })}
                </div>
                {r.comment && <div className="text-[11px] text-gray-500 mt-1 border-t border-gray-200 pt-1">💬 {r.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}