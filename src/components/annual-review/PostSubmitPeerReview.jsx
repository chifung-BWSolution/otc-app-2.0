import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckCircle2, Users, AlertTriangle } from "lucide-react";
import ColleagueSelector from "@/components/peer-review/ColleagueSelector";
import PeerReviewForm from "@/components/peer-review/PeerReviewForm";

function getCurrentFY() {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `FY${y}/${y + 1}`;
}

export default function PostSubmitPeerReview({ staffRec, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colleagues, setColleagues] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedColleague, setSelectedColleague] = useState(null);
  const fiscalYear = getCurrentFY();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const staffList = await base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 1000);
    if (staffRec?.team_group) {
      setColleagues(staffList.filter(s => s.team_group === staffRec.team_group));
    }
    if (staffRec?.bubble_id) {
      const myReviews = await base44.entities.PeerReview.filter(
        { reviewer_staff_id: staffRec.bubble_id, fiscal_year: fiscalYear },
        "-created_date", 200
      );
      setReviews(myReviews);
    }
    setLoading(false);
  };

  const existingReviewFor = (id) => reviews.find(r => r.reviewee_staff_id === id) || null;

  const handleSave = async (formData, submit) => {
    if (!staffRec || !selectedColleague) return;
    setSaving(true);
    const existing = existingReviewFor(selectedColleague.bubble_id);
    const data = {
      ...formData,
      reviewer_staff_id: staffRec.bubble_id,
      reviewer_name: staffRec.display_name,
      reviewer_team_group: staffRec.team_group,
      reviewee_staff_id: selectedColleague.bubble_id,
      reviewee_name: selectedColleague.display_name,
      reviewee_team_group: selectedColleague.team_group,
      fiscal_year: fiscalYear,
      no_collaboration: false,
      status: submit ? "submitted" : "draft",
      ...(submit ? { submitted_at: new Date().toISOString() } : {}),
    };
    if (existing) {
      await base44.entities.PeerReview.update(existing.id, data);
    } else {
      await base44.entities.PeerReview.create(data);
    }
    const myReviews = await base44.entities.PeerReview.filter(
      { reviewer_staff_id: staffRec.bubble_id, fiscal_year: fiscalYear },
      "-created_date", 200
    );
    setReviews(myReviews);
    setSaving(false);
    if (submit) setSelectedColleague(null);
  };

  const handleNoCollab = async () => {
    if (!staffRec || !selectedColleague) return;
    setSaving(true);
    const existing = existingReviewFor(selectedColleague.bubble_id);
    const data = {
      reviewer_staff_id: staffRec.bubble_id,
      reviewer_name: staffRec.display_name,
      reviewer_team_group: staffRec.team_group,
      reviewee_staff_id: selectedColleague.bubble_id,
      reviewee_name: selectedColleague.display_name,
      reviewee_team_group: selectedColleague.team_group,
      fiscal_year: fiscalYear,
      no_collaboration: true,
      no_collab_approved: "pending",
      status: "no_collaboration",
      submitted_at: new Date().toISOString(),
    };
    if (existing) {
      await base44.entities.PeerReview.update(existing.id, data);
    } else {
      await base44.entities.PeerReview.create(data);
    }
    const myReviews = await base44.entities.PeerReview.filter(
      { reviewer_staff_id: staffRec.bubble_id, fiscal_year: fiscalYear },
      "-created_date", 200
    );
    setReviews(myReviews);
    setSaving(false);
    setSelectedColleague(null);
  };

  // Count progress
  const eligible = colleagues.filter(c => c.bubble_id !== staffRec?.bubble_id);
  const submitted = reviews.filter(r => r.status === "submitted" || r.status === "no_collaboration");
  const allDone = eligible.length > 0 && submitted.length >= eligible.length;

  // Auto-transition annual review status when all peer reviews are done
  useEffect(() => {
    if (!allDone || !staffRec?.bubble_id) return;
    (async () => {
      const myReviews = await base44.entities.AnnualReview.filter(
        { staff_id: staffRec.bubble_id, status: "peer_review_pending" }, "-created_date", 1
      );
      if (myReviews.length === 0) return;
      const ar = myReviews[0];
      // Check if staff has a team leader
      const hasLeader = !!staffRec.team_leader;
      const newStatus = hasLeader ? "pending_leader" : "pending_boss";
      await base44.entities.AnnualReview.update(ar.id, { status: newStatus });
    })();
  }, [allDone]);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-gray-400"><div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  if (selectedColleague) {
    const existing = existingReviewFor(selectedColleague.bubble_id);
    return (
      <PeerReviewForm
        reviewee={selectedColleague}
        existingReview={existing}
        saving={saving}
        onSave={handleSave}
        onNoCollab={handleNoCollab}
        onBack={() => setSelectedColleague(null)}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Important notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-amber-800">重要提示</div>
          <div className="text-sm text-amber-700 mt-0.5">
            你已成功提交年度工作評估表。請繼續完成同事互評，<span className="font-bold">完成所有同事互評後才會安排年度面談。</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div>
            <div className="text-sm font-bold text-green-800">已完成所有同事互評 ✅</div>
            <div className="text-xs text-green-600 mt-0.5">管理層將安排你的年度面談，請耐心等候。</div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-black text-gray-900">👥 同事互評</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {fiscalYear} · <span className="font-semibold text-indigo-600">{staffRec?.team_group}</span> 組 · 選擇同事開始互評
        </p>
      </div>

      <ColleagueSelector
        colleagues={colleagues}
        existingReviews={reviews}
        myStaffId={staffRec?.bubble_id}
        onSelect={setSelectedColleague}
      />

      <div className="flex justify-start pt-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> 返回評估表列表
        </button>
      </div>
    </div>
  );
}