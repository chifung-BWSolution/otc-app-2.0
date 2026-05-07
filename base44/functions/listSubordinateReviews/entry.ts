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
      return Response.json({ reviews: [], subordinates: [] });
    }

    const body = await req.json().catch(() => ({}));
    const { fiscal_year } = body;
    if (!fiscal_year) {
      return Response.json({ error: 'Missing fiscal_year' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Get all active staff
    const allStaff = await sr.entities.Staff.filter({ o_status: 'Active' }, 'display_name', 2000);
    
    // Find subordinates (team_leader === my staff id)
    const subs = allStaff.filter(s => s.bubble_id !== staffId && s.team_leader === staffId);
    const subIds = subs.map(s => s.bubble_id).filter(Boolean);

    if (subIds.length === 0) {
      return Response.json({ reviews: [], subordinates: subs });
    }

    // Get all annual reviews for the fiscal year using service role (bypasses RLS)
    const allReviews = await sr.entities.AnnualReview.filter({ fiscal_year }, '-created_date', 2000);
    const subReviews = allReviews.filter(r => subIds.includes(r.staff_id));

    console.log(`[listSubordinateReviews] ${user.email}: ${subs.length} subordinates, ${subReviews.length} reviews for ${fiscal_year}`);

    return Response.json({ 
      reviews: subReviews,
      subordinates: subs.map(s => ({
        id: s.id,
        bubble_id: s.bubble_id,
        display_name: s.display_name,
        position: s.position,
        team_name: s.team_name,
        profile_pic: s.profile_pic,
      })),
    });
  } catch (error) {
    console.error('[listSubordinateReviews] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});