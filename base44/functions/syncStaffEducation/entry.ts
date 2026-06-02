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
    if (!res.ok) { console.log(`Bubble ${dataType} error: ${res.status}`); break; }
    const data = await res.json();
    const results = data.response?.results || [];
    all = all.concat(results);
    const remaining = data.response?.remaining || 0;
    if (remaining === 0 || results.length === 0) break;
    cursor += results.length;
    await sleep(300);
  }
  return all;
}

function toDateStr(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
  } catch { return null; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const forceUpdate = body.forceUpdate === true;

    console.log('Fetching Bubble Staff Education Background...');
    const bubbleRecords = await bubbleFetchAll('Staff Education Background');
    console.log(`Bubble Staff Education Background: ${bubbleRecords.length} records`);

    // Build StaffInformation bubble_id → staff_bubble_id map
    const siList = await base44.asServiceRole.entities.StaffInformation.list('-created_date', 500);
    const siMap = {}; // StaffInformation bubble_id → staff_id (Staff bubble_id)
    for (const si of siList) {
      if (si.bubble_id) {
        siMap[si.bubble_id] = si.staff_id || '';
      }
    }
    console.log(`StaffInformation map: ${Object.keys(siMap).length} entries`);

    // Get existing StaffEducation records
    const existing = await base44.asServiceRole.entities.StaffEducation.list('-created_date', 1000);
    const existingMap = {};
    const existingModMap = {};
    for (const e of existing) {
      if (e.bubble_id) {
        existingMap[e.bubble_id] = e.id;
        existingModMap[e.bubble_id] = e.bubble_modified_date || '';
      }
    }
    console.log(`Existing StaffEducation: ${existing.length}`);

    const toCreate = [];
    const toUpdate = [];
    let noStaffMatch = 0;

    for (const r of bubbleRecords) {
      const siId = r['Staff Information'] || '';
      const staffBubbleId = siMap[siId] || '';

      const record = {
        bubble_id: r['_id'],
        bubble_created_date: r['Created Date'] || null,
        bubble_modified_date: r['Modified Date'] || null,
        staff_information_id: siId,
        staff_bubble_id: staffBubbleId,
        graduation_school: r['Graduation School'] || '',
        education_background: r['Education Background'] || '',
        graduation_major: r['Graduation Major'] || '',
        graduation_end_date: toDateStr(r['Graduation End Date']),
        is_business: r['Is Business'] === true,
        is_active: r['Is Active'] !== false,
      };

      if (!staffBubbleId) noStaffMatch++;

      const bid = r['_id'];
      if (existingMap[bid]) {
        const bubbleMod = r['Modified Date'] || '';
        const localMod = existingModMap[bid] || '';
        if (forceUpdate || bubbleMod !== localMod) {
          toUpdate.push({ id: existingMap[bid], data: record });
        }
      } else {
        toCreate.push(record);
      }
    }

    console.log(`To create: ${toCreate.length}, to update: ${toUpdate.length}, no staff match: ${noStaffMatch}`);

    let created = 0;
    for (let i = 0; i < toCreate.length; i += 5) {
      const batch = toCreate.slice(i, i + 5);
      await base44.asServiceRole.entities.StaffEducation.bulkCreate(batch);
      created += batch.length;
      console.log(`Created ${created}/${toCreate.length}`);
      await sleep(1500);
    }

    let updated = 0;
    for (const item of toUpdate) {
      await base44.asServiceRole.entities.StaffEducation.update(item.id, item.data);
      updated++;
      if (updated % 10 === 0) console.log(`Updated ${updated}/${toUpdate.length}`);
      await sleep(800);
    }

    return Response.json({
      success: true,
      bubble_total: bubbleRecords.length,
      created,
      updated,
      skipped: bubbleRecords.length - created - updated,
      no_staff_match: noStaffMatch,
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});