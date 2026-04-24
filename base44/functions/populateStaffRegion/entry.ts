import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // Load all regions and all staff
  const [regions, allStaff] = await Promise.all([
    base44.asServiceRole.entities.Region.filter({ is_active: true }, 'sort_order', 50),
    base44.asServiceRole.entities.Staff.list('display_name', 2000),
  ]);

  // Build matching function: try base_locations array first, then code/name
  function matchRegion(staffRec) {
    const loc = (staffRec.o_base_location || staffRec.base_location || '').toLowerCase();
    if (!loc) return null;

    // 1. Match by base_locations array
    for (const r of regions) {
      if ((r.base_locations || []).some(v => v && loc.includes(v.toLowerCase()))) {
        return r.code;
      }
    }
    // 2. Fallback: match by region name or code
    for (const r of regions) {
      if ((r.name && loc.includes(r.name.toLowerCase())) || (r.code && loc.includes(r.code.toLowerCase()))) {
        return r.code;
      }
    }
    return null;
  }

  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (const staff of allStaff) {
    const regionCode = matchRegion(staff);
    if (!regionCode) {
      skipped++;
      continue;
    }
    // Only update if different
    if (staff.staff_region === regionCode) {
      skipped++;
      continue;
    }
    try {
      await base44.asServiceRole.entities.Staff.update(staff.id, { staff_region: regionCode });
      updated++;
    } catch (err) {
      errors.push({ id: staff.id, name: staff.display_name, error: err.message });
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