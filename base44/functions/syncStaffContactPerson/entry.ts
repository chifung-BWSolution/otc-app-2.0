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
    await sleep(200);
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

    const body = await req.json().catch(() => ({}));
    const forceUpdate = body.forceUpdate === true;

    console.log('Fetching Bubble Staff Contact Person...');
    const bubbleRecords = await bubbleFetchAll('Staff Contact Person');
    console.log(`Bubble Staff Contact Person: ${bubbleRecords.length} records`);

    // Build StaffInformation bubble_id → staff_id (Staff bubble_id) map
    const staffInfoList = await base44.asServiceRole.entities.StaffInformation.list('-created_date', 500);
    const staffInfoMap = {}; // StaffInformation bubble_id → staff_id (Staff bubble_id)
    for (const si of staffInfoList) {
      if (si.bubble_id) {
        staffInfoMap[si.bubble_id] = si.staff_id || '';
      }
    }
    console.log(`StaffInformation map: ${Object.keys(staffInfoMap).length} entries`);

    // Get existing records
    const existing = await base44.asServiceRole.entities.StaffContactPerson.list('-created_date', 500);
    const existingMap = {};
    const existingModMap = {};
    for (const e of existing) {
      if (e.bubble_id) {
        existingMap[e.bubble_id] = e.id;
        existingModMap[e.bubble_id] = e.bubble_modified_date || '';
      }
    }
    console.log(`Existing StaffContactPerson: ${existing.length}`);

    const toCreate = [];
    const toUpdate = [];

    for (const r of bubbleRecords) {
      const staffInfoBubbleId = r['Staff Information'] || '';
      const staffBubbleId = staffInfoMap[staffInfoBubbleId] || '';

      const record = {
        bubble_id: r['_id'],
        staff_information_id: staffInfoBubbleId,
        staff_bubble_id: staffBubbleId,
        person_name: r['Person Name'] || '',
        relationship: r['Relationship'] || '',
        phone: r['Phone'] != null ? String(r['Phone']) : '',
        is_active: r['Is Active'] !== false,
        bubble_created_date: r['Created Date'] || null,
        bubble_modified_date: r['Modified Date'] || null,
      };

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

    console.log(`To create: ${toCreate.length}, to update: ${toUpdate.length}`);

    let created = 0;
    for (let i = 0; i < toCreate.length; i += 10) {
      const batch = toCreate.slice(i, i + 10);
      await base44.asServiceRole.entities.StaffContactPerson.bulkCreate(batch);
      created += batch.length;
      console.log(`Created ${created}/${toCreate.length}`);
      await sleep(1000);
    }

    let updated = 0;
    for (const item of toUpdate) {
      await base44.asServiceRole.entities.StaffContactPerson.update(item.id, item.data);
      updated++;
      if (updated % 10 === 0) console.log(`Updated ${updated}/${toUpdate.length}`);
      await sleep(500);
    }

    return Response.json({
      success: true,
      bubble_total: bubbleRecords.length,
      created,
      updated,
      skipped: bubbleRecords.length - created - updated,
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});