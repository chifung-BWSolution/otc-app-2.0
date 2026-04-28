import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users, Eye, CheckCircle, Clock, ChevronDown, ChevronUp, Star } from "lucide-react";
import AnnualReviewReadonly from "./AnnualReviewReadonly";
import LeaderScoringForm from "./LeaderScoringForm";

function getLastFY() {
  const now = new Date();
  const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const year = currentFYStart - 1;
  return `FY${year}/${year + 1}`;
}

export default function SubordinateReviews({ staffRec, user }) {
  const [loading, setLoading] = useState(true);
  const [subordinates, setSubordinates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [scoringReview, setScoringReview] = useState(null);

  const fy = getLastFY();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const allStaff = await base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 2000);
    const myId = staffRec?.bubble_id;

    // Only show staff whose team_leader field directly matches this user's bubble_id
    const subs = allStaff.filter(s => {
      if (s.bubble_id === myId) return false;
      return s.team_leader === myId;
    });

    setSubordinates(subs);

    if (subs.length > 0) {
      const subIds = subs.map(s => s.bubble_id).filter(Boolean);
      // Load all annual reviews for these staff (we can't filter by array of staff_id easily, so load all and filter)
      const allReviews = await base44.entities.AnnualReview.filter({}, "-created_date", 2000);
      const subReviews = allReviews.filter(r => subIds.includes(r.staff_id) && r.fiscal_year === fy);
      setReviews(subReviews);
    }

    setLoading(false);
  };

  const submittedReviews = useMemo(() => reviews.filter(r => r.status !== "draft"), [reviews]);
  const draftReviews = useMemo(() => reviews.filter(r => r.status === "draft"), [reviews]);
  const notStarted = useMemo(() => {
    const reviewedIds = new Set(reviews.map(r => r.staff_id));
    return subordinates.filter(s => !reviewedIds.has(s.bubble_id));
  }, [subordinates, reviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={24} />
        <span className="ml-2 text-sm text-gray-400">載入下屬評估表...</span>
      </div>
    );
  }

  if (scoringReview) {
    return (
      <LeaderScoringForm
        review={scoringReview}
        onBack={() => setScoringReview(null)}
        onSubmitted={() => { setScoringReview(null); loadData(); }}
      />
    );
  }

  if (selectedReview) {
    return (
      <AnnualReviewReadonly
        review={selectedReview}
        staffRec={null}
        user={null}
        onBack={() => setSelectedReview(null)}
      />
    );
  }

  if (subordinates.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Users size={36} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">你目前沒有直屬下屬需要查看評估表。</p>
        <p className="text-xs mt-1 text-gray-300">只有在員工記錄中被設為 Team Leader 的人才能查看其下屬的評估表。</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        <div className="bg-blue-50 rounded-lg px-4 py-3 text-center flex-1 border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{subordinates.length}</div>
          <div className="text-xs text-gray-500">下屬人數</div>
        </div>
        <div className="bg-green-50 rounded-lg px-4 py-3 text-center flex-1 border border-green-100">
          <div className="text-2xl font-bold text-green-600">{submittedReviews.length}</div>
          <div className="text-xs text-gray-500">已提交</div>
        </div>
        <div className="bg-orange-50 rounded-lg px-4 py-3 text-center flex-1 border border-orange-100">
          <div className="text-2xl font-bold text-orange-600">{draftReviews.length}</div>
          <div className="text-xs text-gray-500">草稿</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-center flex-1 border border-gray-200">
          <div className="text-2xl font-bold text-gray-500">{notStarted.length}</div>
          <div className="text-xs text-gray-500">未開始</div>
        </div>
      </div>

      {/* Submitted reviews — viewable */}
      {submittedReviews.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-green-700 px-1 flex items-center gap-1.5">
            <CheckCircle size={14} /> 已提交的評估表（{submittedReviews.length}）
          </h3>
          {submittedReviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{r.staff_name}</span>
                    {(() => {
                      const m = {
                        peer_review_pending: { label: "待完成同事互評", color: "bg-amber-100 text-amber-700" },
                        pending_leader: { label: "待Leader評分", color: "bg-blue-100 text-blue-700" },
                        pending_boss: { label: "待老闆面談", color: "bg-purple-100 text-purple-700" },
                      };
                      const st = m[r.status] || { label: r.status, color: "bg-gray-100 text-gray-700" };
                      return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>;
                    })()}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.staff_position} · {r.fiscal_year}
                    {r.submitted_at && <span> · {new Date(r.submitted_at).toLocaleDateString("zh-HK")}</span>}
                  </div>
                </div>
                {r.status === "pending_leader" ? (
                  <button
                    onClick={() => setScoringReview(r)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Star size={13} /> 評分
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedReview(r)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                  >
                    <Eye size={13} /> 查看
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draft reviews */}
      {draftReviews.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-orange-700 px-1 flex items-center gap-1.5">
            <Clock size={14} /> 仍在填寫中（{draftReviews.length}）
          </h3>
          {draftReviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock size={18} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm text-gray-900">{r.staff_name}</span>
                  <span className="ml-2 text-[11px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">草稿</span>
                  <div className="text-xs text-gray-400 mt-0.5">{r.staff_position}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Not started */}
      {notStarted.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-500 px-1">尚未開始（{notStarted.length}）</h3>
          {notStarted.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Users size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-gray-600">{s.display_name}</span>
                  <div className="text-xs text-gray-400 mt-0.5">{s.position}</div>
                </div>
                <span className="text-xs text-gray-300">未開始</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}