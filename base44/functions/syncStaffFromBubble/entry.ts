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
    const url = `${BUBBLE_URL}/${dataType}?limit=100&cursor=${cursor}`;
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

    // 1. Fetch Staff from Bubble
    console.log('Fetching Staff...');
    const staffList = await bubbleFetchAll('Staff');
    console.log(`Total staff: ${staffList.length}`);
    await sleep(500);

    // Try common Bubble type name variants for Team/BU/TeamRole
    console.log('Fetching Teams...');
    const teamList = await bubbleFetchAll('team');
    await sleep(300);

    console.log('Fetching BUs...');
    const buList = await bubbleFetchAll('bu');
    await sleep(300);

    console.log('Fetching Team Roles...');
    const teamRoleList = await bubbleFetchAll('team_role');

    // 2. Build lookup maps
    const teamMap = {};
    const buMap = {};
    const teamRoleMap = {};
    const staffNameMap = {};
    for (const t of teamList) teamMap[t['_id']] = t['Name'] || t['name'] || '';
    for (const b of buList) buMap[b['_id']] = b['Name'] || b['name'] || '';
    for (const r of teamRoleList) teamRoleMap[r['_id']] = r['Name'] || r['name'] || '';
    for (const s of staffList) staffNameMap[s['_id']] = s['Display Name'] || s['Full Name'] || '';

    // 3. Get existing base44 Staff records
    const existing = await base44.asServiceRole.entities.Staff.list('-created_date', 500);
    console.log(`Existing base44 staff: ${existing.length}`);

    const existingMap = {};
    const existingModifiedMap = {};
    for (const e of existing) {
      if (e.bubble_id) {
        existingMap[e.bubble_id] = e.id;
        existingModifiedMap[e.bubble_id] = e.bubble_modified_date || '';
      }
    }

    // 4. Classify records
    const toCreate = [];
    const toUpdate = [];

    for (const s of staffList) {
      const record = {
        bubble_id: s['_id'],
        bubble_created_date: s['Created Date'] || null,
        bubble_modified_date: s['Modified Date'] || null,
        display_name: s['Display Name'] || '',
        full_name: s['Full Name'] || '',
        position: s['Position'] || '',
        o_status: s['O_Status'] === 'Inactive' ? 'Inactive' : 'Active',
        o_status_text: s['O_Status_Text'] || '',
        o_user_role: s['O_User Role'] || '',
        o_probation: s['O_Probation'] || '',
        o_base_location: s['O_Base Location'] || '',
        birthday: toDateStr(s['Birthday']),
        entry_date: toDateStr(s['Entry Date']),
        termination_date: toDateStr(s['Termination Date']),
        work_email: s['Work Email'] || '',
        business_email: s['Business Email'] || '',
        private_email: s['Private Email'] || '',
        work_phone: s['Work Phone'] || null,
        private_phone: s['Private Phone'] || null,
        direct_phone: s['Direct Phone'] || null,
        hotline: s['Hotline'] || '',
        voov_id: s['Voov ID'] || null,
        al_quota: s['AL Quota'] || null,
        leave_quota_remain: s['Leave Quota Remain'] || null,
        no_clockin: s['No Clockin'] || false,
        no_man_hour_task: s['No Man Hour Task'] || false,
        profile_pic: s['Profile Pic'] || '',
        clock_in_face: s['Clock In Face'] || '',
        clock_in_face_amazon_id: s['Clock In Face amazon ID'] || '',
        clock_in_face_amazon_id_2: s['Clock In Face amazon ID 2'] || '',
        dingding_dept_id: s['DingDing Dept Id'] || '',
        dingding_user_id: s['DingDing User Id'] || '',
        new_work_phone: s['New Work Phone'] || '',
        brands: Array.isArray(s['Brands']) ? s['Brands'] : [],
        new_direct_phone: Array.isArray(s['New Direct Phone']) ? s['New Direct Phone'] : [],
        other_phone: Array.isArray(s['Other Phone']) ? s['Other Phone'] : [],
        n_team: s['N_Team'] || '',
        team_name: s['N_Team'] ? (teamMap[s['N_Team']] || '') : '',
        n_bu: s['N_BU'] || '',
        bu_name: s['N_BU'] ? (buMap[s['N_BU']] || '') : '',
        n_team_role: s['N_Team Role'] || '',
        team_role_name: s['N_Team Role'] ? (teamRoleMap[s['N_Team Role']] || '') : '',
        team_leader: s['Team Leader'] || '',
        team_leader_name: s['Team Leader'] ? (staffNameMap[s['Team Leader']] || '') : '',
      };

      const bid = s['_id'];
      if (existingMap[bid]) {
        const bubbleMod = s['Modified Date'] || '';
        const localMod = existingModifiedMap[bid] || '';
        if (bubbleMod !== localMod) {
          toUpdate.push({ id: existingMap[bid], data: record });
        }
      } else {
        toCreate.push(record);
      }
    }

    console.log(`To create: ${toCreate.length}, to update: ${toUpdate.length}`);

    // 5. Bulk create in batches of 5
    let created = 0;
    for (let i = 0; i < toCreate.length; i += 5) {
      const batch = toCreate.slice(i, i + 5);
      await base44.asServiceRole.entities.Staff.bulkCreate(batch);
      created += batch.length;
      console.log(`Created ${created}/${toCreate.length}`);
      await sleep(1500);
    }

    // 6. Update changed records
    let updated = 0;
    for (const item of toUpdate) {
      await base44.asServiceRole.entities.Staff.update(item.id, item.data);
      updated++;
      if (updated % 10 === 0) console.log(`Updated ${updated}/${toUpdate.length}`);
      await sleep(800);
    }

    return Response.json({
      success: true,
      bubble_total: staffList.length,
      created,
      updated,
      skipped: staffList.length - created - updated,
    });

  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});