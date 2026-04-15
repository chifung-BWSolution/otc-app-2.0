import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { action, loginEmail, tempPassword, role, staffId } = await req.json();

    // === ACTION: create — create auth account only (no staff link yet) ===
    if (action === 'create' || !action) {
      if (!loginEmail || !tempPassword) {
        return Response.json({ error: 'loginEmail and tempPassword are required' }, { status: 400 });
      }

      await base44.users.inviteUser(loginEmail, role || 'user');

      await new Promise(r => setTimeout(r, 1000));
      const allUsers = await base44.asServiceRole.entities.User.filter({ email: loginEmail });
      if (allUsers.length > 0) {
        await base44.asServiceRole.entities.User.update(allUsers[0].id, {
          account_status: 'Active',
        });
      }

      return Response.json({ success: true, email: loginEmail });
    }

    // === ACTION: link — link an existing auth user to a staff profile ===
    if (action === 'link') {
      if (!loginEmail || !staffId) {
        return Response.json({ error: 'loginEmail and staffId are required' }, { status: 400 });
      }

      const allUsers = await base44.asServiceRole.entities.User.filter({ email: loginEmail });
      if (allUsers.length > 0) {
        await base44.asServiceRole.entities.User.update(allUsers[0].id, {
          linked_staff_id: staffId,
        });
      }

      await base44.asServiceRole.entities.Staff.update(staffId, {
        linked_user_email: loginEmail,
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('createStaffAccount error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});