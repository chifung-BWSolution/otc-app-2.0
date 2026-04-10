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
    await sleep(200);
  }
  return all;
}

async function syncTable(base44, entityName, bubbleType, mapFn) {
  const bubbleData = await bubbleFetchAll(bubbleType);
  console.log(`Bubble ${bubbleType}: ${bubbleData.length} records`);

  // Get existing records
  const existing = await base44.asServiceRole.entities[entityName].list('-created_date', 500);
  const existingMap = {};
  for (const e of existing) {
    if (e.bubble_id) existingMap[e.bubble_id] = e;
  }

  let created = 0, updated = 0;

  for (const item of bubbleData) {
    const mapped = mapFn(item);
    const bid = item['_id'];
    if (existingMap[bid]) {
      // Update if display changed
      const ex = existingMap[bid];
      if (ex.display !== mapped.display || ex.bu_name !== mapped.bu_name) {
        await base44.asServiceRole.entities[entityName].update(ex.id, mapped);
        updated++;
        await sleep(300);
      }
    } else {
      await base44.asServiceRole.entities[entityName].create({ ...mapped, bubble_id: bid });
      created++;
      await sleep(300);
    }
  }

  return { total: bubbleData.length, created, updated };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    // Sync BU
    console.log('Syncing NOS BU...');
    const buResult = await syncTable(base44, 'NOSBU', 'NOS BU', (item) => ({
      bubble_id: item['_id'],
      display: item['Display'] || item['Name'] || '',
      is_active: true,
    }));

    // Sync Team Role
    console.log('Syncing NOS Team Role...');
    const roleResult = await syncTable(base44, 'NOSTeamRole', 'NOS Team Role', (item) => ({
      bubble_id: item['_id'],
      display: item['Display'] || item['Name'] || '',
      is_active: true,
    }));

    // Sync Team (needs BU mapping)
    console.log('Fetching BU lookup...');
    const buList = await base44.asServiceRole.entities.NOSBU.list('-created_date', 500);
    const bubbleBuIdToLocalId = {};
    const bubbleBuIdToName = {};
    for (const bu of buList) {
      if (bu.bubble_id) {
        bubbleBuIdToLocalId[bu.bubble_id] = bu.id;
        bubbleBuIdToName[bu.bubble_id] = bu.display;
      }
    }

    console.log('Syncing NOS Team...');
    const teamResult = await syncTable(base44, 'NOSTeam', 'NOS Team', (item) => {
      const buBubbleId = item['N_BU'] || item['BU'] || '';
      return {
        bubble_id: item['_id'],
        display: item['Display'] || item['Name'] || '',
        bu_id: bubbleBuIdToLocalId[buBubbleId] || '',
        bu_name: bubbleBuIdToName[buBubbleId] || '',
        is_active: true,
      };
    });

    return Response.json({
      success: true,
      bu: buResult,
      team_role: roleResult,
      team: teamResult,
    });

  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});