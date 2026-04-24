import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
  const errors = [];

  // Process in batches to avoid rate limits
  const toUpdate = [];
  for (const staff of allStaff) {
    const group = teamGroupMap[staff.team_name] || null;
    if ((staff.team_group || null) === group) {
      skipped++;
    } else {
      toUpdate.push({ id: staff.id, name: staff.display_name, team_group: group });
    }
  }

  for (let i = 0; i < toUpdate.length; i++) {
    const item = toUpdate[i];
    try {
      await base44.asServiceRole.entities.Staff.update(item.id, { team_group: item.team_group });
      updated++;
    } catch (err) {
      // If rate limited, wait and retry once
      if (err.status === 429) {
        await sleep(2000);
        try {
          await base44.asServiceRole.entities.Staff.update(item.id, { team_group: item.team_group });
          updated++;
        } catch (retryErr) {
          errors.push({ id: item.id, name: item.name, error: retryErr.message });
        }
      } else {
        errors.push({ id: item.id, name: item.name, error: err.message });
      }
    }
    // Throttle: pause every 10 updates
    if ((i + 1) % 10 === 0) {
      await sleep(500);
    }
  }

  return Response.json({
    success: true,
    total: allStaff.length,
    updated,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
});