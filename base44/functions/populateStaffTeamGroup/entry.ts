import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const [teams, allStaff] = await Promise.all([
    base44.asServiceRole.entities.NOSTeam.filter({ is_active: true }, 'display', 200),
    base44.asServiceRole.entities.Staff.list('display_name', 2000),
  ]);

  // Build team_name → team_group lookup
  const teamGroupMap = {};
  for (const t of teams) {
    if (t.display && t.team_group) {
      teamGroupMap[t.display] = t.team_group;
    }
  }

  let updated = 0;
  let skipped = 0;

  for (const staff of allStaff) {
    const group = teamGroupMap[staff.team_name] || null;
    // Only update if different
    if ((staff.team_group || null) === group) {
      skipped++;
      continue;
    }
    await base44.asServiceRole.entities.Staff.update(staff.id, { team_group: group });
    updated++;
  }

  return Response.json({
    success: true,
    total: allStaff.length,
    updated,
    skipped,
  });
});