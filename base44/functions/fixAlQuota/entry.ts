import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_URL = Deno.env.get('BUBBLE_API_URL');
const BUBBLE_TOKEN = Deno.env.get('BUBBLE_API_TOKEN');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

    // Fetch all staff from Bubble
    const bubbleStaff = await bubbleFetchAll('Staff');
    console.log(`Bubble staff: ${bubbleStaff.length}`);

    // Build bubble_id → AL Quota map
    const quotaMap = {};
    for (const s of bubbleStaff) {
      if (s['AL Quota'] != null) {
        quotaMap[s['_id']] = s['AL Quota'];
      }
    }
    console.log(`Bubble staff with AL Quota: ${Object.keys(quotaMap).length}`);

    // Fetch all local staff
    const localStaff = await base44.asServiceRole.entities.Staff.list('-created_date', 500);
    console.log(`Local staff: ${localStaff.length}`);

    let fixed = 0;
    let skipped = 0;
    for (const staff of localStaff) {
      if (!staff.bubble_id || quotaMap[staff.bubble_id] === undefined) {
        skipped++;
        continue;
      }
      const bubbleQuota = quotaMap[staff.bubble_id];
      if (staff.al_quota !== bubbleQuota) {
        await base44.asServiceRole.entities.Staff.update(staff.id, { al_quota: bubbleQuota });
        fixed++;
        console.log(`Fixed ${staff.display_name}: ${staff.al_quota} → ${bubbleQuota}`);
        await sleep(500);
      } else {
        skipped++;
      }
    }

    return Response.json({ success: true, bubble_with_quota: Object.keys(quotaMap).length, fixed, skipped });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});