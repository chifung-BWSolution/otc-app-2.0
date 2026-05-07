import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { staff_id, fiscal_year } = body;

    if (!staff_id || !fiscal_year) {
      return Response.json({ error: 'Missing staff_id or fiscal_year' }, { status: 400 });
    }

    // Verify the requesting user owns this staff_id
    if (user.linked_staff_id !== staff_id && user.role !== 'admin' && user.role !== 'management') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole;
    const reviews = await sr.entities.PeerReview.filter(
      { reviewer_staff_id: staff_id, fiscal_year: fiscal_year },
      '-created_date', 500
    );

    return Response.json({ reviews });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});