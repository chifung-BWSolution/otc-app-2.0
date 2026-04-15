import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { staffId, loginEmail, tempPassword, role } = await req.json();

    if (!staffId || !loginEmail || !tempPassword) {
      return Response.json({ error: 'staffId, loginEmail, and tempPassword are required' }, { status: 400 });
    }

    // Step 1: Invite user (creates auth account)
    await base44.users.inviteUser(loginEmail, role || 'user');

    // Step 2: Find the newly created user record and update account_status + linked_staff_id
    // We need to wait a moment for the user to be created
    await new Promise(r => setTimeout(r, 1000));
    const allUsers = await base44.asServiceRole.entities.User.filter({ email: loginEmail });
    if (allUsers.length > 0) {
      await base44.asServiceRole.entities.User.update(allUsers[0].id, {
        account_status: 'Active',
        linked_staff_id: staffId,
      });
    }

    // Step 3: Link the staff profile
    await base44.asServiceRole.entities.Staff.update(staffId, {
      linked_user_email: loginEmail,
    });

    return Response.json({ success: true, email: loginEmail });
  } catch (error) {
    console.error('createStaffAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});