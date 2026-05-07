import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staffId = user.linked_staff_id;
    if (!staffId) {
      return Response.json({ error: 'No linked staff' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { review_id, project_contributions, extra_contributions, leader_comment, leader_next_year_expectation, leader_private_note } = body;

    if (!review_id) {
      return Response.json({ error: 'Missing review_id' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Verify the review exists and this user is the leader
    const reviews = await sr.entities.AnnualReview.filter({ id: review_id }, 'id', 1);
    if (reviews.length === 0) {
      return Response.json({ error: 'Review not found' }, { status: 404 });
    }

    const review = reviews[0];
    if (review.leader_staff_id !== staffId && user.role !== 'admin') {
      console.log(`[submitLeaderScoring] Forbidden: user ${staffId} vs leader ${review.leader_staff_id}`);
      return Response.json({ error: 'Forbidden: not the assigned leader' }, { status: 403 });
    }

    if (review.status !== 'pending_leader') {
      return Response.json({ error: `Cannot score: status is ${review.status}` }, { status: 400 });
    }

    await sr.entities.AnnualReview.update(review_id, {
      project_contributions,
      extra_contributions,
      leader_comment: leader_comment || '',
      leader_next_year_expectation: leader_next_year_expectation || '',
      leader_private_note: leader_private_note || '',
      leader_scored_at: new Date().toISOString(),
      status: 'pending_boss_review',
    });

    console.log(`[submitLeaderScoring] ${user.email} scored review ${review_id} for ${review.staff_name}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('[submitLeaderScoring] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});