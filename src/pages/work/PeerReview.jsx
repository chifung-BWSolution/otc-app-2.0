import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Users } from "lucide-react";
import ColleagueSelector from "@/components/peer-review/ColleagueSelector";
import PeerReviewForm from "@/components/peer-review/PeerReviewForm";

function getLastFY() {
  const now = new Date();
  const currentFYStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const year = currentFYStart - 1;
  return `FY${year}/${year + 1}`;
}

export default function PeerReview() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [myStaff, setMyStaff] = useState(null);
  const [colleagues, setColleagues] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedColleague, setSelectedColleague] = useState(null);
  const fiscalYear = getLastFY();

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
      try {
        const myReviews = await base44.entities.PeerReview.filter(
          { reviewer_staff_id: myRec.bubble_id, fiscal_year: fiscalYear },
          "-created_date", 200
        );
        console.log("[PeerReview] Found", myReviews.length, "reviews for", myRec.display_name);
        setReviews(myReviews);
      } catch (err) {
        console.error("[PeerReview] Failed to load reviews:", err);
        setReviews([]);
      }
    }
    setLoading(false);
  };

  const existingReviewFor = (colleagueStaffId) => {
    return reviews.find(r => r.reviewee_staff_id === colleagueStaffId) || null;
  };

  const handleSave = async (formData, submit) => {
    if (!myStaff || !selectedColleague || saving) return;
    setSaving(true);
    // Check local state AND DB for existing record to prevent duplicates
    let existing = existingReviewFor(selectedColleague.bubble_id);
    if (!existing) {
      const dbRecords = await base44.entities.PeerReview.filter(
        { reviewer_staff_id: myStaff.bubble_id, reviewee_staff_id: selectedColleague.bubble_id, fiscal_year: fiscalYear },
        "-created_date", 1
      );
      if (dbRecords.length > 0) existing = dbRecords[0];
    }
    const data = {
      ...formData,
      reviewer_staff_id: myStaff.bubble_id,
      reviewer_name: myStaff.display_name,
      reviewer_team_group: myStaff.team_group,
      reviewee_staff_id: selectedColleague.bubble_id,
      reviewee_name: selectedColleague.display_name,
      reviewee_team_group: selectedColleague.team_group,
      fiscal_year: fiscalYear,
      no_collaboration: false,
      status: submit ? "submitted" : "draft",
      ...(submit ? { submitted_at: new Date().toISOString() } : {}),
    };

    let savedRecord;
    if (existing) {
      await base44.entities.PeerReview.update(existing.id, data);
      savedRecord = { ...existing, ...data };
    } else {
      savedRecord = await base44.entities.PeerReview.create(data);
    }

    // Optimistically update local state instead of re-fetching (avoids stale reads)
    setReviews(prev => {
      const without = prev.filter(r => r.reviewee_staff_id !== selectedColleague.bubble_id);
      return [...without, savedRecord];
    });
    setSaving(false);
    if (submit) setSelectedColleague(null);
  };

  const handleNoCollab = async () => {
    if (!myStaff || !selectedColleague || saving) return;
    setSaving(true);
    // Check local state AND DB for existing record to prevent duplicates
    let existing = existingReviewFor(selectedColleague.bubble_id);
    if (!existing) {
      const dbRecords = await base44.entities.PeerReview.filter(
        { reviewer_staff_id: myStaff.bubble_id, reviewee_staff_id: selectedColleague.bubble_id, fiscal_year: fiscalYear },
        "-created_date", 1
      );
      if (dbRecords.length > 0) existing = dbRecords[0];
    }
    const data = {
      reviewer_staff_id: myStaff.bubble_id,
      reviewer_name: myStaff.display_name,
      reviewer_team_group: myStaff.team_group,
      reviewee_staff_id: selectedColleague.bubble_id,
      reviewee_name: selectedColleague.display_name,
      reviewee_team_group: selectedColleague.team_group,
      fiscal_year: fiscalYear,
      no_collaboration: true,
      no_collab_approved: "pending",
      status: "no_collaboration",
      submitted_at: new Date().toISOString(),
    };

    let savedRecord;
    if (existing) {
      await base44.entities.PeerReview.update(existing.id, data);
      savedRecord = { ...existing, ...data };
    } else {
      savedRecord = await base44.entities.PeerReview.create(data);
    }

    setReviews(prev => {
      const without = prev.filter(r => r.reviewee_staff_id !== selectedColleague.bubble_id);
      return [...without, savedRecord];
    });
    setSaving(false);
    setSelectedColleague(null);
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
          onNoCollab={handleNoCollab}
          onBack={() => setSelectedColleague(null)}
        />
      </div>
    );
  }

  // Default: colleague list
  return (
    <div className="max-w-2xl mx-auto space-y-4">
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