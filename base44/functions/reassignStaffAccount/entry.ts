import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { userEmail, newStaffId, newPassword } = await req.json();

    if (!userEmail || !newStaffId || !newPassword) {
      return Response.json({ error: 'userEmail, newStaffId, and newPassword are required' }, { status: 400 });
    }

    // Step 1: Find the User record by email
    const allUsers = await base44.asServiceRole.entities.User.list('email', 1000);
    const users = allUsers.filter(u => u.email === userEmail);
    if (users.length === 0) {
      return Response.json({ error: '找不到此帳戶' }, { status: 404 });
    }
    const userRecord = users[0];

    // Step 2: Update User - set Active, link new staff
    await base44.asServiceRole.entities.User.update(userRecord.id, {
      account_status: 'Active',
      linked_staff_id: newStaffId,
    });

    // Step 3: Link new staff profile to this email
    await base44.asServiceRole.entities.Staff.update(newStaffId, {
      linked_user_email: userEmail,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('reassignStaffAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});