import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { action, userEmail, newPassword } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'userEmail is required' }, { status: 400 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('email', 1000);
    const users = allUsers.filter(u => u.email === userEmail);
    if (users.length === 0) {
      // User may not have accepted the invite yet — return gracefully
      return Response.json({ success: true, password_hint: null, not_found: true });
    }

    const userRecord = users[0];

    // === ACTION: view — return stored password_hint ===
    if (action === 'view') {
      return Response.json({ success: true, password_hint: userRecord.password_hint || null });
    }

    // === ACTION: update — update the password ===
    if (action === 'update') {
      if (!newPassword || newPassword.length < 6) {
        return Response.json({ error: '密碼最少6位' }, { status: 400 });
      }

      // Store password hint (admin-managed plain text — this is an admin tool, not end-user auth)
      await base44.asServiceRole.entities.User.update(userRecord.id, {
        password_hint: newPassword,
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('manageAccountPassword error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});