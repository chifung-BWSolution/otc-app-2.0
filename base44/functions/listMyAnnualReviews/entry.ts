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
      return Response.json({ reviews: [] });
    }

    const sr = base44.asServiceRole;
    const reviews = await sr.entities.AnnualReview.filter(
      { staff_id: staffId }, "-created_date", 50
    );

    // Return lightweight list (exclude huge project_contributions to keep response small)
    const lightweight = reviews.map(r => ({
      id: r.id,
      created_date: r.created_date,
      updated_date: r.updated_date,
      staff_id: r.staff_id,
      staff_name: r.staff_name,
      staff_team: r.staff_team,
      staff_bu: r.staff_bu,
      staff_position: r.staff_position,
      fiscal_year: r.fiscal_year,
      status: r.status,
      submitted_at: r.submitted_at,
      project_count: (r.project_contributions || []).length,
    }));

    return Response.json({ reviews: lightweight });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});