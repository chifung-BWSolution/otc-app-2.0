import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || !['admin', 'management'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requestId, action, reviewNote } = await req.json();
    if (!requestId || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid params' }, { status: 400 });
    }

    const request = await base44.asServiceRole.entities.ProfileUpdateRequest.get(requestId);
    if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });

    const now = new Date().toISOString();

    if (action === 'approve') {
      // Copy staging data to the official StaffProfile
      const profileFields = [
        'display_name','full_name','chinese_name','gender','date_of_birth','hkid',
        'nationality','marital_status','mobile','personal_email','address',
        'bank_name','bank_account_number','bank_account_holder',
        'emergency_contact_name','emergency_contact_relation','emergency_contact_phone',
        'education','work_experience','skills','interests','languages'
      ];

      const updates = {};
      for (const field of profileFields) {
        if (request[field] !== undefined && request[field] !== null) {
          updates[field] = request[field];
        }
      }

      await base44.asServiceRole.entities.StaffProfile.update(request.staff_profile_id, updates);
      await base44.asServiceRole.entities.ProfileUpdateRequest.update(requestId, {
        request_status: 'Approved',
        reviewed_by: user.full_name || user.email,
        reviewed_at: now,
        review_note: reviewNote || '',
      });
      return Response.json({ success: true, action: 'approved' });
    } else {
      await base44.asServiceRole.entities.ProfileUpdateRequest.update(requestId, {
        request_status: 'Rejected',
        reviewed_by: user.full_name || user.email,
        reviewed_at: now,
        review_note: reviewNote || '',
      });
      return Response.json({ success: true, action: 'rejected' });
    }
  } catch (error) {
    console.error('approveProfileUpdate error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});