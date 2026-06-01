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

    const bubbleStaff = await bubbleFetchAll('Staff');
    console.log(`Bubble staff: ${bubbleStaff.length}`);

    // Build bubble_id → { al_quota, no_clockin } map
    const bubbleMap = {};
    let bubbleAlCount = 0;
    let bubbleNoClockinCount = 0;
    for (const s of bubbleStaff) {
      bubbleMap[s['_id']] = {
        al_quota: s['AL Quota'] != null ? s['AL Quota'] : null,
        no_clockin: s['No Clockin'] === true,
      };
      if (s['AL Quota'] != null) bubbleAlCount++;
      if (s['No Clockin'] === true) bubbleNoClockinCount++;
    }
    console.log(`Bubble AL Quota count: ${bubbleAlCount}, No Clockin count: ${bubbleNoClockinCount}`);

    const localStaff = await base44.asServiceRole.entities.Staff.list('-created_date', 500);
    console.log(`Local staff: ${localStaff.length}`);

    let fixedAl = 0;
    let fixedNoClockin = 0;
    let skipped = 0;

    for (const staff of localStaff) {
      if (!staff.bubble_id || !bubbleMap[staff.bubble_id]) {
        skipped++;
        continue;
      }
      const bubble = bubbleMap[staff.bubble_id];
      const updates = {};

      // Fix AL Quota
      if (bubble.al_quota !== null && staff.al_quota !== bubble.al_quota) {
        updates.al_quota = bubble.al_quota;
        fixedAl++;
      }

      // Fix No Clockin
      const localNoClockin = staff.no_clockin === true;
      if (localNoClockin !== bubble.no_clockin) {
        updates.no_clockin = bubble.no_clockin;
        fixedNoClockin++;
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Staff.update(staff.id, updates);
        console.log(`Fixed ${staff.display_name}: ${JSON.stringify(updates)}`);
        await sleep(300);
      } else {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      bubble_al_quota_count: bubbleAlCount,
      bubble_no_clockin_count: bubbleNoClockinCount,
      fixed_al_quota: fixedAl,
      fixed_no_clockin: fixedNoClockin,
      skipped,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});