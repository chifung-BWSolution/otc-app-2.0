import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { event, data } = body;

    // Only process create/update events for submitted/no_collaboration reviews
    if (!data || !data.reviewer_staff_id || !data.fiscal_year) {
      return Response.json({ skipped: true, reason: 'missing data' });
    }
    if (data.status !== 'submitted' && data.status !== 'no_collaboration') {
      return Response.json({ skipped: true, reason: 'not a completed review' });
    }

    const sr = base44.asServiceRole;
    const reviewerStaffId = data.reviewer_staff_id;
    const fiscalYear = data.fiscal_year;

    // Check if the reviewer has an annual review in peer_review_pending status
    const annualReviews = await sr.entities.AnnualReview.filter(
      { staff_id: reviewerStaffId, fiscal_year: fiscalYear, status: 'peer_review_pending' },
      '-created_date', 1
    );

    if (annualReviews.length === 0) {
      return Response.json({ skipped: true, reason: 'no peer_review_pending annual review' });
    }

    const ar = annualReviews[0];

    // Get all staff in the same team_group
    const staffList = await sr.entities.Staff.filter({ bubble_id: reviewerStaffId }, 'id', 1);
    if (staffList.length === 0) {
      return Response.json({ skipped: true, reason: 'staff not found' });
    }
    const reviewerStaff = staffList[0];
    const teamGroup = reviewerStaff.team_group;

    if (!teamGroup) {
      return Response.json({ skipped: true, reason: 'no team_group' });
    }

    // Get all active staff in the same team_group
    const sameGroupStaff = await sr.entities.Staff.filter(
      { team_group: teamGroup, o_status: 'Active' }, 'display_name', 1000
    );
    const eligible = sameGroupStaff.filter(s => s.bubble_id !== reviewerStaffId);

    if (eligible.length === 0) {
      return Response.json({ skipped: true, reason: 'no eligible colleagues' });
    }

    // Get all peer reviews by this reviewer for this FY
    const allReviews = await sr.entities.PeerReview.filter(
      { reviewer_staff_id: reviewerStaffId, fiscal_year: fiscalYear },
      '-created_date', 500
    );
    const completedReviews = allReviews.filter(
      r => r.status === 'submitted' || r.status === 'no_collaboration'
    );

    console.log(`[onPeerReviewCompleted] ${reviewerStaff.display_name}: ${completedReviews.length}/${eligible.length} completed`);

    if (completedReviews.length < eligible.length) {
      return Response.json({ skipped: true, reason: `not all done: ${completedReviews.length}/${eligible.length}` });
    }

    // All done — determine next status
    let newStatus = 'pending_boss_review';
    if (reviewerStaff.team_leader) {
      const leaders = await sr.entities.Staff.filter({ bubble_id: reviewerStaff.team_leader }, 'id', 1);
      if (leaders.length > 0) {
        const leaderTeam = (leaders[0].team_name || '').toLowerCase();
        if (!leaderTeam.includes('mgt')) {
          newStatus = 'pending_leader';
        }
      }
    }

    await sr.entities.AnnualReview.update(ar.id, { status: newStatus });
    console.log(`[onPeerReviewCompleted] Transitioned ${reviewerStaff.display_name} to ${newStatus}`);

    return Response.json({ success: true, newStatus, reviewer: reviewerStaff.display_name });
  } catch (error) {
    console.error('[onPeerReviewCompleted] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});