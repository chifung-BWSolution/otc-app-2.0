import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { userId, data } = await req.json();
    if (!userId || !data) {
      return Response.json({ error: 'userId and data are required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(userId, data);
    return Response.json({ success: true });
  } catch (error) {
    console.error('updateUserAdmin error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});