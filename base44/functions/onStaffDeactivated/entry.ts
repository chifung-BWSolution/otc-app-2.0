import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const staffData = body.data;
    const oldData = body.old_data;

    // Only act if status changed to Inactive
    if (staffData?.o_status !== 'Inactive' || oldData?.o_status === 'Inactive') {
      return Response.json({ skipped: true });
    }

    const linkedEmail = staffData.linked_user_email;
    if (!linkedEmail) {
      return Response.json({ skipped: true, reason: 'No linked user email' });
    }

    // Find and deactivate the auth user account
    const allUsersList = await base44.asServiceRole.entities.User.list('email', 1000);
    const users = allUsersList.filter(u => u.email === linkedEmail);
    if (users.length > 0) {
      await base44.asServiceRole.entities.User.update(users[0].id, {
        account_status: 'Inactive',
        linked_staff_id: '',
      });
    }

    // Unlink from the staff record
    await base44.asServiceRole.entities.Staff.update(staffData.id || body.event?.entity_id, {
      linked_user_email: '',
    });

    console.log(`Deactivated account for ${linkedEmail} (staff went Inactive)`);
    return Response.json({ success: true, deactivatedEmail: linkedEmail });
  } catch (error) {
    console.error('onStaffDeactivated error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});