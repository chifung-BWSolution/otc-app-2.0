import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search, Users, CheckCircle2, XCircle, Ban, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { QUESTIONS } from "@/components/peer-review/PeerReviewQuestions";
import PeerReviewDetailModal from "@/components/peer-review/PeerReviewDetailModal";

function getCurrentFY() {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `FY${y}/${y + 1}`;
}

export default function PeerReviewAdmin() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [fyFilter, setFyFilter] = useState(getCurrentFY());
  const [tabFilter, setTabFilter] = useState("all"); // all | no_collab | detail
  const [expandedStaff, setExpandedStaff] = useState(null);
  const [detailReview, setDetailReview] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [revs, staffList] = await Promise.all([
      base44.entities.PeerReview.filter({}, "-created_date", 5000),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 1000),
    ]);
    setReviews(revs);
    setStaff(staffList);
    setLoading(false);
  };

  const staffMap = useMemo(() => {
    const m = {};
    for (const s of staff) { if (s.bubble_id) m[s.bubble_id] = s; }
    return m;
  }, [staff]);

  const fyOptions = useMemo(() => [...new Set(reviews.map(r => r.fiscal_year))].sort().reverse(), [reviews]);

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      if (fyFilter && r.fiscal_year !== fyFilter) return false;
      if (tabFilter === "no_collab" && r.status !== "no_collaboration") return false;
      if (search) {
        const q = search.toLowerCase();
        return (r.reviewer_name || "").toLowerCase().includes(q) ||
               (r.reviewee_name || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [reviews, fyFilter, tabFilter, search]);

  // Group by reviewee
  const byReviewee = useMemo(() => {
    const m = {};
    for (const r of filtered) {
      if (!m[r.reviewee_staff_id]) m[r.reviewee_staff_id] = { name: r.reviewee_name, reviews: [] };
      m[r.reviewee_staff_id].reviews.push(r);
    }
    return Object.entries(m).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filtered]);

  // No collab pending
  const pendingNoCollab = useMemo(() =>
    reviews.filter(r => r.status === "no_collaboration" && r.no_collab_approved === "pending" && r.fiscal_year === fyFilter)
  , [reviews, fyFilter]);

  const handleApproveNoCollab = async (review, approve) => {
    await base44.entities.PeerReview.update(review.id, {
      no_collab_approved: approve ? "approved" : "rejected",
      ...(approve ? {} : { status: "draft", no_collaboration: false }),
    });

    // If rejected, notify the reviewer
    if (!approve) {
      const reviewerStaff = staffMap[review.reviewer_staff_id];
      const email = reviewerStaff?.work_email || reviewerStaff?.linked_user_email;
      if (email) {
        await base44.entities.Notification.create({
          recipient_email: email,
          recipient_staff_id: review.reviewer_staff_id,
          title: "互評申請被拒絕",
          message: `你對 ${review.reviewee_name} 的「無合作過」申請已被管理員拒絕，請重新完成互評表。`,
          type: "peer_review_rejected",
          ref_id: review.id,
          is_read: false,
        });
      }
    }

    load();
  };

  const stats = useMemo(() => {
    const fyRevs = reviews.filter(r => r.fiscal_year === fyFilter);
    return {
      total: fyRevs.length,
      submitted: fyRevs.filter(r => r.status === "submitted").length,
      noCollab: fyRevs.filter(r => r.status === "no_collaboration").length,
      pendingNoCollab: fyRevs.filter(r => r.status === "no_collaboration" && r.no_collab_approved === "pending").length,
      draft: fyRevs.filter(r => r.status === "draft").length,
    };
  }, [reviews, fyFilter]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {detailReview && <PeerReviewDetailModal review={detailReview} staffMap={staffMap} onClose={() => setDetailReview(null)} />}

      <div>
        <h2 className="text-lg font-black text-gray-900">👥 同事互評管理</h2>
        <p className="text-sm text-gray-500">查看所有互評結果及審批「無合作過」申請</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <div className="text-xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-500">總評核數</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-xl font-bold text-green-600">{stats.submitted}</div>
          <div className="text-xs text-gray-500">已提交</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
          <div className="text-xl font-bold text-gray-600">{stats.noCollab}</div>
          <div className="text-xs text-gray-500">無合作過</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
          <div className="text-xl font-bold text-orange-600">{stats.pendingNoCollab}</div>
          <div className="text-xs text-gray-500">待審批</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
          <div className="text-xl font-bold text-amber-600">{stats.draft}</div>
          <div className="text-xs text-gray-500">草稿</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" value={fyFilter} onChange={e => setFyFilter(e.target.value)}>
          {fyOptions.map(fy => <option key={fy} value={fy}>{fy}</option>)}
        </select>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[
            { key: "all", label: "全部" },
            { key: "no_collab", label: `待審批 (${pendingNoCollab.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTabFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tabFilter === t.key ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="搜尋評核者/被評核者..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* No collab pending list */}
      {tabFilter === "no_collab" && (
        <div className="space-y-2">
          {pendingNoCollab.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">沒有待審批的「無合作過」申請</div>
          ) : pendingNoCollab.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <Ban size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">
                  <span className="text-indigo-600">{r.reviewer_name}</span> → <span className="text-purple-600">{r.reviewee_name}</span>
                </div>
                <div className="text-xs text-gray-400">{r.fiscal_year} · {r.reviewer_team_group} · {new Date(r.submitted_at).toLocaleDateString("zh-HK")}</div>
              </div>
              <button onClick={() => handleApproveNoCollab(r, true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors">
                <CheckCircle2 size={12} /> 批准
              </button>
              <button onClick={() => handleApproveNoCollab(r, false)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">
                <XCircle size={12} /> 拒絕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* All reviews grouped by reviewee */}
      {tabFilter === "all" && (
        <div className="space-y-2">
          {byReviewee.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm"><Users size={32} className="mx-auto mb-2 opacity-30" />沒有互評記錄</div>
          ) : byReviewee.map(([staffId, { name, reviews: revs }]) => {
            const isExpanded = expandedStaff === staffId;
            const submitted = revs.filter(r => r.status === "submitted").length;
            const noCollab = revs.filter(r => r.status === "no_collaboration").length;
            return (
              <div key={staffId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedStaff(isExpanded ? null : staffId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(name || "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-gray-900">{name}</span>
                    <span className="ml-2 text-xs text-gray-400">共 {revs.length} 份評核</span>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{submitted} 已提交</span>
                  {noCollab > 0 && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{noCollab} 無合作</span>}
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {revs.map(r => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 text-xs hover:bg-gray-50">
                        <span className="font-medium text-gray-700 w-28 shrink-0">{r.reviewer_name}</span>
                        {r.status === "submitted" ? (
                          <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-semibold">已提交</span>
                        ) : r.status === "no_collaboration" ? (
                          <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
                            無合作 {r.no_collab_approved === "approved" ? "✅" : r.no_collab_approved === "rejected" ? "❌" : "⏳"}
                          </span>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">草稿</span>
                        )}
                        <span className="text-gray-400 flex-1">{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString("zh-HK") : ""}</span>
                        {r.status === "submitted" && (
                          <button onClick={() => setDetailReview(r)} className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700">
                            <Eye size={12} /> 查看
                          </button>
                        )}
                        {r.status === "no_collaboration" && r.no_collab_approved === "pending" && (
                          <div className="flex gap-1">
                            <button onClick={() => handleApproveNoCollab(r, true)} className="text-green-600 hover:text-green-800"><CheckCircle2 size={14} /></button>
                            <button onClick={() => handleApproveNoCollab(r, false)} className="text-red-500 hover:text-red-700"><XCircle size={14} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}