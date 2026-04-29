import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { review_id, data } = body;

    if (!review_id || !data) {
      return Response.json({ error: 'Missing review_id or data' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Verify this review belongs to the user and is still a draft
    const allReviews = await sr.entities.AnnualReview.filter(
      { staff_id: user.linked_staff_id, status: 'draft' }, "-created_date", 10
    );
    const review = allReviews.find(r => r.id === review_id);
    if (!review) {
      return Response.json({ error: 'Review not found or not a draft' }, { status: 403 });
    }

    // Update only allowed fields
    const updatePayload = {};
    const allowedFields = [
      'project_contributions', 'extra_contributions',
      'challenges', 'challenges_solution',
      'next_year_goals', 'commitment', 'company_feedback',
    ];
    for (const f of allowedFields) {
      if (data[f] !== undefined) updatePayload[f] = data[f];
    }

    await sr.entities.AnnualReview.update(review_id, updatePayload);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});