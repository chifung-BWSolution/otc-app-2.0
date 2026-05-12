import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { review_id } = body;

    if (!review_id) {
      return Response.json({ error: 'Missing review_id' }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    const staffId = user.linked_staff_id;

    // Verify this review belongs to the user and is in an editable state
    const allReviews = await sr.entities.AnnualReview.filter(
      { staff_id: staffId }, "-created_date", 10
    );
    const review = allReviews.find(r => r.id === review_id);
    if (!review) {
      return Response.json({ error: 'Review not found' }, { status: 403 });
    }

    // Determine correct status by checking peer review completion
    let newStatus = 'peer_review_pending';

    // Look up staff record for team_group
    const staffList = await sr.entities.Staff.filter({ bubble_id: staffId }, 'id', 1);
    if (staffList.length > 0) {
      const staff = staffList[0];
      const teamGroup = staff.team_group;

      if (teamGroup) {
        // Get all active colleagues in same team_group
        const sameGroupStaff = await sr.entities.Staff.filter(
          { team_group: teamGroup, o_status: 'Active' }, 'display_name', 1000
        );
        const eligible = sameGroupStaff.filter(s => s.bubble_id !== staffId);

        if (eligible.length > 0) {
          // Get completed peer reviews
          const peerReviews = await sr.entities.PeerReview.filter(
            { reviewer_staff_id: staffId, fiscal_year: review.fiscal_year },
            '-created_date', 500
          );
          const completed = peerReviews.filter(
            r => r.status === 'submitted' || r.status === 'no_collaboration'
          );

          console.log(`[submitAnnualReview] ${staff.display_name}: peer reviews ${completed.length}/${eligible.length}`);

          if (completed.length >= eligible.length) {
            // All peer reviews done — determine next status
            newStatus = 'pending_boss_review';
            if (staff.team_leader) {
              const leaders = await sr.entities.Staff.filter({ bubble_id: staff.team_leader }, 'id', 1);
              if (leaders.length > 0) {
                const leaderTeam = (leaders[0].team_name || '').toLowerCase();
                if (!leaderTeam.includes('mgt')) {
                  newStatus = 'pending_leader';
                }
              }
            }
            console.log(`[submitAnnualReview] Peer reviews all done, setting status to ${newStatus}`);
          }
        } else {
          // No eligible colleagues — skip peer review
          newStatus = 'pending_boss_review';
          if (staff.team_leader) {
            const leaders = await sr.entities.Staff.filter({ bubble_id: staff.team_leader }, 'id', 1);
            if (leaders.length > 0 && !(leaders[0].team_name || '').toLowerCase().includes('mgt')) {
              newStatus = 'pending_leader';
            }
          }
        }
      }
    }

    await sr.entities.AnnualReview.update(review_id, {
      status: newStatus,
      submitted_at: new Date().toISOString(),
    });

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});