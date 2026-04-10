import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BUBBLE_URL = Deno.env.get('BUBBLE_API_URL');
const BUBBLE_TOKEN = Deno.env.get('BUBBLE_API_TOKEN');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function bubbleFetchAll(dataType) {
  let all = [];
  let cursor = 0;
  while (true) {
    const url = `${BUBBLE_URL}/${encodeURIComponent(dataType)}?limit=100&cursor=${cursor}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${BUBBLE_TOKEN}` } });
    if (!res.ok) break;
    const data = await res.json();
    const results = data.response?.results || [];
    all = all.concat(results);
    if ((data.response?.remaining || 0) === 0 || results.length === 0) break;
    cursor += results.length;
    await sleep(300);
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // 1. Fetch lookup tables from Bubble in parallel
    console.log('Fetching lookup tables from Bubble...');
    const [staffList, teamList, buList, teamRoleList] = await Promise.all([
      bubbleFetchAll('Staff'),
      bubbleFetchAll('NOS Team'),
      bubbleFetchAll('NOS BU'),
      bubbleFetchAll('NOS Team Role'),
    ]);

    console.log(`Staff: ${staffList.length}, Teams: ${teamList.length}, BUs: ${buList.length}, Roles: ${teamRoleList.length}`);

    // 2. Build lookup maps
    const teamMap = {};
    const buMap = {};
    const teamRoleMap = {};
    const staffNameMap = {};

    for (const t of teamList) teamMap[t['_id']] = t['Display'] || '';
    for (const b of buList) buMap[b['_id']] = b['Display'] || '';
    for (const r of teamRoleList) teamRoleMap[r['_id']] = r['Display'] || '';
    for (const s of staffList) staffNameMap[s['_id']] = s['Display Name'] || s['Full Name'] || '';

    // Build bubble_id → bubble data map
    const bubbleMap = {};
    for (const s of staffList) bubbleMap[s['_id']] = s;

    // 3. Get all existing base44 Staff records
    console.log('Fetching base44 staff...');
    const existing = await base44.asServiceRole.entities.Staff.list('-created_date', 500);
    console.log(`Found ${existing.length} base44 staff records`);

    // 4. Force update in batches with offset
    const body = await req.json().catch(() => ({}));
    const offset = body.offset || 0;
    const batchSize = body.batchSize || 50;
    const batch = existing.slice(offset, offset + batchSize);

    console.log(`Processing offset ${offset}, batch ${batch.length} records`);

    let updated = 0;
    let skipped = 0;

    for (const staff of batch) {
      if (!staff.bubble_id) { skipped++; continue; }

      const s = bubbleMap[staff.bubble_id];
      if (!s) { skipped++; continue; }

      const teamId = s['N_Team'] || '';
      const buId = s['N_BU'] || '';
      const teamRoleId = s['N_Team Role'] || '';
      const teamLeaderId = s['Team Leader'] || '';

      await base44.asServiceRole.entities.Staff.update(staff.id, {
        team_name: teamMap[teamId] || '',
        bu_name: buMap[buId] || '',
        team_role_name: teamRoleMap[teamRoleId] || '',
        team_leader_name: staffNameMap[teamLeaderId] || '',
        n_team: teamId,
        n_bu: buId,
        n_team_role: teamRoleId,
        team_leader: teamLeaderId,
      });

      updated++;
      await sleep(1500);
    }

    return Response.json({
      success: true,
      total: existing.length,
      offset,
      processed: batch.length,
      updated,
      skipped,
      nextOffset: offset + batchSize,
      done: offset + batchSize >= existing.length,
    });

  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});