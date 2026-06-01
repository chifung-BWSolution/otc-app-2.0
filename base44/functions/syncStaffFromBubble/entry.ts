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

    // 1. Fetch all related lookup tables in parallel
    console.log('Fetching lookup tables...');
    const [staffList, teamList, buList, teamRoleList] = await Promise.all([
      bubbleFetchAll('Staff'),
      bubbleFetchAll('NOS Team'),
      bubbleFetchAll('NOS BU'),
      bubbleFetchAll('NOS Team Role'),
    ]);

    console.log(`Staff: ${staffList.length}, Teams: ${teamList.length}, BUs: ${buList.length}, Team Roles: ${teamRoleList.length}`);

    // 2. Build lookup maps (ID → Display name)
    const teamMap = {};
    const buMap = {};
    const teamRoleMap = {};
    const staffNameMap = {};

    for (const t of teamList) teamMap[t['_id']] = t['Display'] || '';
    for (const b of buList) buMap[b['_id']] = b['Display'] || '';
    for (const r of teamRoleList) teamRoleMap[r['_id']] = r['Display'] || '';
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
      const teamId = s['N_Team'] || '';
      const buId = s['N_BU'] || '';
      const teamRoleId = s['N_Team Role'] || '';
      const teamLeaderId = s['Team Leader'] || '';

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
        al_quota: s['AL Quota'] != null ? s['AL Quota'] : null,
        leave_quota_remain: s['Leave Quota Remain'] != null ? s['Leave Quota Remain'] : null,
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
        // Team/BU/Role with resolved Display names
        n_team: teamId,
        team_name: teamMap[teamId] || '',
        n_bu: buId,
        bu_name: buMap[buId] || '',
        n_team_role: teamRoleId,
        team_role_name: teamRoleMap[teamRoleId] || '',
        team_leader: teamLeaderId,
        team_leader_name: staffNameMap[teamLeaderId] || '',
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
      teams_loaded: teamList.length,
      bus_loaded: buList.length,
      team_roles_loaded: teamRoleList.length,
      created,
      updated,
      skipped: staffList.length - created - updated,
    });

  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});