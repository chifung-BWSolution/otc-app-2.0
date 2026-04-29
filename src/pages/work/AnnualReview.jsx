import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, AlertCircle, ArrowLeft, FileText, Users } from "lucide-react";
import AnnualReviewForm from "@/components/annual-review/AnnualReviewForm";
import AnnualReviewList from "@/components/annual-review/AnnualReviewList";
import AnnualReviewReadonly from "@/components/annual-review/AnnualReviewReadonly";
import PostSubmitPeerReview from "@/components/annual-review/PostSubmitPeerReview";
import SubordinateReviews from "@/components/annual-review/SubordinateReviews";

function getLastFY() {
  const now = new Date();
  const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const year = currentFYStart - 1;
  return { label: `FY${year}/${year + 1}`, start: `${year}-04-01`, end: `${year + 1}-03-31` };
}

function parseFY(fyLabel) {
  const match = fyLabel.match(/FY(\d{4})\/(\d{4})/);
  if (!match) return getLastFY();
  const y = parseInt(match[1]);
  return { label: fyLabel, start: `${y}-04-01`, end: `${y + 1}-03-31` };
}

export default function AnnualReview() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [staffRec, setStaffRec] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("mine");
  const [isLeader, setIsLeader] = useState(false);
  const [leaderName, setLeaderName] = useState("");

  const [view, setView] = useState("list");
  const [activeReview, setActiveReview] = useState(null);
  const [projectSummary, setProjectSummary] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeFY, setActiveFY] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => { initList(); }, []);

  const refreshReviews = async () => {
    const res = await base44.functions.invoke('listMyAnnualReviews', {});
    setReviews(res.data.reviews || []);
  };

  const initList = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    setUser(me);
    if (!me.linked_staff_id) { setLoading(false); return; }

    const [staffList, reviewsRes, allStaff] = await Promise.all([
      base44.entities.Staff.filter({ bubble_id: me.linked_staff_id }, "id", 1),
      base44.functions.invoke('listMyAnnualReviews', {}),
      base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 2000),
    ]);
    const myStaff = staffList[0] || null;
    setStaffRec(myStaff);
    setReviews(reviewsRes.data.reviews || []);

    if (myStaff) {
      const myId = myStaff.bubble_id;
      setIsLeader(allStaff.some(s => s.bubble_id !== myId && s.team_leader === myId));
    }
    if (myStaff?.team_leader) {
      const leader = allStaff.find(s => s.bubble_id === myStaff.team_leader);
      if (leader) setLeaderName(leader.display_name);
    }
    setLoading(false);
  };

  const handleOpenReview = (review) => {
    if (review.status === "draft") {
      openDraftForm(review.fiscal_year);
    } else if (review.status === "peer_review_pending") {
      setView("peer-review");
    } else {
      setActiveReview(review);
      setView("readonly");
    }
  };

  // Unified: load or create draft via backend (service role — no RLS issues)
  const openDraftForm = async (fiscalYear) => {
    const fy = fiscalYear || getLastFY().label;
    setFormLoading(true);
    setFormError(null);
    setView("form");
    setActiveFY(parseFY(fy));

    try {
      const res = await base44.functions.invoke('loadOrCreateReviewDraft', {
        staff_id: user.linked_staff_id,
        fiscal_year: fy,
      });

      const review = res.data.review;
      setActiveReview(review);

      const summary = (review.project_contributions || []).map(p => ({
        ...p,
        hours: p.hours || 0,
        tasks: p.tasks || 0,
        sales_amount: p.sales_amount || 0,
        contribution_note: p.contribution_note || "",
        self_score: p.self_score || null,
        tasksByType: [],
      }));
      setProjectSummary(summary);

      if (review.status !== "draft") {
        setView("readonly");
      }
    } catch (err) {
      console.error("openDraftForm error:", err);
      setFormError(err.message || "載入數據時發生錯誤");
    }
    setFormLoading(false);
  };

  const handleCreateNew = () => openDraftForm(getLastFY().label);

  const handleSave = async (formData, isSubmit) => {
    setSaving(true);
    if (!activeReview) { setSaving(false); return; }

    // Always save via backend function (bypasses RLS)
    await base44.functions.invoke('saveAnnualReviewDraft', {
      review_id: activeReview.id,
      data: formData,
    });

    if (isSubmit) {
      await base44.functions.invoke('submitAnnualReview', {
        review_id: activeReview.id,
      });
      setActiveReview({ ...activeReview, ...formData, status: "peer_review_pending", submitted_at: new Date().toISOString() });
    } else {
      setActiveReview({ ...activeReview, ...formData });
    }

    const savedMap = {};
    for (const s of (formData.project_contributions || [])) { savedMap[s.project_name] = s; }
    setProjectSummary(prev => prev.map(p => {
      const s = savedMap[p.project_name];
      return s ? { ...p, sales_amount: s.sales_amount || 0, contribution_note: s.contribution_note || "", self_score: s.self_score || null } : p;
    }));
    setSaving(false);
    await refreshReviews();
    if (isSubmit) setView("peer-review");
  };

  const handleBack = async () => {
    setView("list");
    setActiveReview(null);
    setProjectSummary([]);
    await refreshReviews();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={32} />
        <span className="ml-2 text-sm text-gray-400">載入年度評估表...</span>
      </div>
    );
  }

  if (!user?.linked_staff_id) {
    return (
      <div className="text-center py-20 text-gray-400">
        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">未找到關聯員工資料，請聯絡管理員。</p>
      </div>
    );
  }

  if (view === "peer-review") {
    return <PostSubmitPeerReview staffRec={staffRec} onBack={handleBack} />;
  }

  if (view === "readonly" && activeReview) {
    return <AnnualReviewReadonly review={activeReview} staffRec={staffRec} user={user} onBack={handleBack} />;
  }

  if (view === "form") {
    if (formLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-gray-400" size={32} />
          <span className="ml-2 text-sm text-gray-400">載入工時數據中（首次約需 30 秒）...</span>
        </div>
      );
    }
    if (formError) {
      return (
        <div className="text-center py-20 space-y-3">
          <AlertCircle size={32} className="mx-auto text-red-400" />
          <p className="text-sm text-red-600">載入數據時發生錯誤：{formError}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={handleBack} className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200">返回</button>
            <button onClick={() => openDraftForm(activeFY?.label)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">重試</button>
          </div>
        </div>
      );
    }
    const fy = activeFY || getLastFY();
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white flex-1">
            <div className="flex items-center gap-3">
              <FileText size={24} />
              <div>
                <h2 className="text-lg font-bold">年度工作表現評估表</h2>
                <p className="text-sm opacity-80">{fy.label} · {staffRec?.display_name || user.full_name} · {staffRec?.team_name || ""} · {staffRec?.position || ""}</p>
              </div>
            </div>
          </div>
        </div>
        <AnnualReviewForm
          projectSummary={projectSummary}
          existingReview={activeReview}
          saving={saving}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLeader && (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-w-md">
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === "mine" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText size={14} /> 我的評估表
          </button>
          <button
            onClick={() => setTab("subordinates")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === "subordinates" ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users size={14} /> Team Member 評估表
          </button>
        </div>
      )}

      {tab === "mine" ? (
        <AnnualReviewList
          reviews={reviews}
          staffRec={staffRec}
          user={user}
          leaderName={leaderName}
          onCreateNew={handleCreateNew}
          onOpen={handleOpenReview}
          onPeerReview={() => setView("peer-review")}
        />
      ) : (
        <SubordinateReviews staffRec={staffRec} user={user} />
      )}
    </div>
  );
}