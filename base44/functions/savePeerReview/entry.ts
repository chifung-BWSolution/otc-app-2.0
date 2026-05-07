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

    if (!data || !data.reviewer_staff_id || !data.fiscal_year) {
      console.log('[savePeerReview] Missing fields:', { hasData: !!data, reviewer: data?.reviewer_staff_id, fy: data?.fiscal_year });
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Verify the requesting user owns this reviewer_staff_id
    // Support both linked_staff_id on User and email-based matching
    let authorized = false;
    if (user.role === 'admin' || user.role === 'management') {
      authorized = true;
    } else if (user.linked_staff_id === data.reviewer_staff_id) {
      authorized = true;
    } else {
      // Fallback: check if the user's email matches the staff record
      const staffMatches = await sr.entities.Staff.filter({ bubble_id: data.reviewer_staff_id }, 'id', 1);
      if (staffMatches.length > 0) {
        const staff = staffMatches[0];
        if (staff.linked_user_email === user.email || staff.work_email === user.email || staff.business_email === user.email) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      console.log('[savePeerReview] Forbidden: user', user.email, 'linked_staff_id', user.linked_staff_id, 'vs reviewer', data.reviewer_staff_id);
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let savedRecord;
    if (review_id) {
      // Verify the existing record belongs to this reviewer
      const existing = await sr.entities.PeerReview.filter({ id: review_id }, 'id', 1);
      if (existing.length === 0) {
        return Response.json({ error: 'Review not found' }, { status: 404 });
      }
      if (existing[0].reviewer_staff_id !== data.reviewer_staff_id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Don't allow editing already submitted reviews
      if (existing[0].status === 'submitted') {
        return Response.json({ error: 'Cannot edit submitted review' }, { status: 400 });
      }
      await sr.entities.PeerReview.update(review_id, data);
      savedRecord = { ...existing[0], ...data, id: review_id };
    } else {
      // Check for duplicate before creating
      const dupes = await sr.entities.PeerReview.filter({
        reviewer_staff_id: data.reviewer_staff_id,
        reviewee_staff_id: data.reviewee_staff_id,
        fiscal_year: data.fiscal_year,
      }, '-created_date', 1);

      if (dupes.length > 0) {
        const existingId = dupes[0].id;
        if (dupes[0].status === 'submitted') {
          return Response.json({ error: 'Cannot edit submitted review' }, { status: 400 });
        }
        await sr.entities.PeerReview.update(existingId, data);
        savedRecord = { ...dupes[0], ...data, id: existingId };
      } else {
        savedRecord = await sr.entities.PeerReview.create(data);
      }
    }

    console.log('[savePeerReview] OK:', data.reviewer_staff_id, '->', data.reviewee_staff_id, 'status:', data.status);
    return Response.json({ review: savedRecord });
  } catch (error) {
    console.error('[savePeerReview] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});