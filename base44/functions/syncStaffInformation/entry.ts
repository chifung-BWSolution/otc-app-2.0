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
    if (!res.ok) {
      console.log(`Bubble ${dataType} error: ${res.status}`);
      break;
    }
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
  try { return new Date(val).toISOString().split('T')[0]; } catch { return null; }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    console.log('Fetching Bubble Staff Information...');
    const bubbleRecords = await bubbleFetchAll('Staff Information');
    console.log(`Bubble Staff Information: ${bubbleRecords.length} records`);

    // Build Staff bubble_id → base44 record id map
    const staffList = await base44.asServiceRole.entities.Staff.list('-created_date', 500);
    const staffMap = {}; // bubble_id → { id, display_name }
    for (const s of staffList) {
      if (s.bubble_id) {
        staffMap[s.bubble_id] = { id: s.id, name: s.display_name || s.full_name || '' };
      }
    }
    console.log(`Staff map: ${Object.keys(staffMap).length} entries`);

    // Get existing StaffInformation records
    const existing = await base44.asServiceRole.entities.StaffInformation.list('-created_date', 500);
    const existingMap = {};
    const existingModMap = {};
    for (const e of existing) {
      if (e.bubble_id) {
        existingMap[e.bubble_id] = e.id;
        existingModMap[e.bubble_id] = e.bubble_modified_date || '';
      }
    }
    console.log(`Existing StaffInformation: ${existing.length}`);

    const toCreate = [];
    const toUpdate = [];
    let noStaffMatch = 0;

    for (const r of bubbleRecords) {
      const staffBubbleId = r['Staff'] || '';
      const staffInfo = staffMap[staffBubbleId] || null;

      const record = {
        bubble_id: r['_id'],
        bubble_created_date: r['Created Date'] || null,
        bubble_modified_date: r['Modified Date'] || null,
        staff_id: staffBubbleId,
        staff_record_id: staffInfo ? String(staffInfo.id) : '',
        staff_name: staffInfo ? staffInfo.name : '',
        chinese_name: r['Chinese Name'] || '',
        english_name: r['English Name'] || '',
        nickname: r['Nickname'] || '',
        birthday: toDateStr(r['Birthday']),
        phone: r['Phone'] != null ? String(r['Phone']) : '',
        email1: r['Email1'] || '',
        email2: r['Email2'] || '',
        identity_card_number: r['Identity Card Number'] || '',
        bank_card_number: r['Bank Card Number'] != null ? String(r['Bank Card Number']) : '',
        new_bank_card_number: r['New Bank Card Number'] || '',
        bank_card_name: r['Bank Card Name'] || '',
        bank_card_owner: r['Bank Card Owner'] || '',
        chinese_mailing_address: r['Chinese Mailing Address'] || '',
        english_mailing_address: r['English Mailing Address'] || '',
        native_place: r['Native Place'] || '',
        residential_area: r['Residential Area'] || '',
        marital_status: r['Marital Status'] || '',
        commuting_time: r['Commuting Time'] || '',
        is_active: r['Is Active'] === true,
      };

      if (!staffInfo) noStaffMatch++;

      const bid = r['_id'];
      if (existingMap[bid]) {
        const bubbleMod = r['Modified Date'] || '';
        const localMod = existingModMap[bid] || '';
        if (bubbleMod !== localMod) {
          toUpdate.push({ id: existingMap[bid], data: record });
        }
      } else {
        toCreate.push(record);
      }
    }

    console.log(`To create: ${toCreate.length}, to update: ${toUpdate.length}, no staff match: ${noStaffMatch}`);

    // Bulk create in batches of 5
    let created = 0;
    for (let i = 0; i < toCreate.length; i += 5) {
      const batch = toCreate.slice(i, i + 5);
      await base44.asServiceRole.entities.StaffInformation.bulkCreate(batch);
      created += batch.length;
      console.log(`Created ${created}/${toCreate.length}`);
      await sleep(1500);
    }

    // Update changed records
    let updated = 0;
    for (const item of toUpdate) {
      await base44.asServiceRole.entities.StaffInformation.update(item.id, item.data);
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