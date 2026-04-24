import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users } from "lucide-react";
import ColleagueSelector from "@/components/peer-review/ColleagueSelector";
import PeerReviewForm from "@/components/peer-review/PeerReviewForm";

function getCurrentFY() {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `FY${y}/${y + 1}`;
}

export default function PeerReview() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myStaff, setMyStaff] = useState(null);
  const [colleagues, setColleagues] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedColleague, setSelectedColleague] = useState(null);
  const fiscalYear = getCurrentFY();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const me = await base44.auth.me();
    const staffList = await base44.entities.Staff.filter({ o_status: "Active" }, "display_name", 1000);

    // Find current user's staff record — match by linked_staff_id (on User), linked_user_email, or work_email
    const linkedStaffId = me.linked_staff_id;
    const myRec = staffList.find(s =>
      (linkedStaffId && s.bubble_id === linkedStaffId) ||
      s.linked_user_email === me.email ||
      s.work_email === me.email
    );
    setMyStaff(myRec || null);

    if (myRec?.team_group) {
      // Filter colleagues in same team_group
      const sameGroup = staffList.filter(s => s.team_group === myRec.team_group);
      setColleagues(sameGroup);
    } else {
      setColleagues([]);
    }

    // Load existing reviews by this user
    if (myRec?.bubble_id) {
      const myReviews = await base44.entities.PeerReview.filter(
        { reviewer_staff_id: myRec.bubble_id, fiscal_year: fiscalYear },
        "-created_date", 200
      );
      setReviews(myReviews);
    }
    setLoading(false);
  };

  const existingReviewFor = (colleagueStaffId) => {
    return reviews.find(r => r.reviewee_staff_id === colleagueStaffId) || null;
  };

  const handleSave = async (answers, submit) => {
    if (!myStaff || !selectedColleague) return;
    setSaving(true);
    const existing = existingReviewFor(selectedColleague.bubble_id);
    const data = {
      ...answers,
      reviewer_staff_id: myStaff.bubble_id,
      reviewer_name: myStaff.display_name,
      reviewer_team_group: myStaff.team_group,
      reviewee_staff_id: selectedColleague.bubble_id,
      reviewee_name: selectedColleague.display_name,
      reviewee_team_group: selectedColleague.team_group,
      fiscal_year: fiscalYear,
      status: submit ? "submitted" : "draft",
      ...(submit ? { submitted_at: new Date().toISOString() } : {}),
    };

    if (existing) {
      await base44.entities.PeerReview.update(existing.id, data);
    } else {
      await base44.entities.PeerReview.create(data);
    }

    // Refresh reviews
    const myReviews = await base44.entities.PeerReview.filter(
      { reviewer_staff_id: myStaff.bubble_id, fiscal_year: fiscalYear },
      "-created_date", 200
    );
    setReviews(myReviews);
    setSaving(false);

    if (submit) {
      setSelectedColleague(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!myStaff) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Users size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">找不到你的員工記錄，請聯絡管理員。</p>
      </div>
    );
  }

  if (!myStaff.team_group) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Users size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">你尚未被分配到任何 Team Group（Front / Back 等），請聯絡管理員。</p>
      </div>
    );
  }

  // If selected colleague → show form
  if (selectedColleague) {
    const existing = existingReviewFor(selectedColleague.bubble_id);
    return (
      <div>
        <PeerReviewForm
          reviewee={selectedColleague}
          existingReview={existing}
          saving={saving}
          onSave={handleSave}
          onBack={() => setSelectedColleague(null)}
        />
      </div>
    );
  }

  // Default: colleague list
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-black text-gray-900">👥 同事互評</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {fiscalYear} · <span className="font-semibold text-indigo-600">{myStaff.team_group}</span> 組 · 選擇同事開始互評
        </p>
      </div>

      <ColleagueSelector
        colleagues={colleagues}
        existingReviews={reviews}
        myStaffId={myStaff.bubble_id}
        onSelect={setSelectedColleague}
      />
    </div>
  );
}