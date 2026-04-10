import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const BUBBLE_URL = Deno.env.get('BUBBLE_API_URL');
const BUBBLE_TOKEN = Deno.env.get('BUBBLE_API_TOKEN');

async function bubbleFetch(dataType, params = '') {
  const url = `${BUBBLE_URL}/${dataType}?limit=100${params}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${BUBBLE_TOKEN}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.response?.results || [];
}

async function bubbleFetchById(dataType, id) {
  const url = `${BUBBLE_URL}/${dataType}/${id}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${BUBBLE_TOKEN}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.response || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all staff
    const staffList = await bubbleFetch('Staff');

    // Collect unique related IDs
    const teamIds = new Set();
    const buIds = new Set();
    const teamRoleIds = new Set();

    for (const s of staffList) {
      if (s['N_Team']) teamIds.add(s['N_Team']);
      if (s['N_BU']) buIds.add(s['N_BU']);
      if (s['N_Team Role']) teamRoleIds.add(s['N_Team Role']);
    }

    // Fetch all related data in parallel
    const [teams, bus, teamRoles] = await Promise.all([
      Promise.all([...teamIds].map(id => bubbleFetchById('Team', id))),
      Promise.all([...buIds].map(id => bubbleFetchById('BU', id))),
      Promise.all([...teamRoleIds].map(id => bubbleFetchById('Team_Role', id))),
    ]);

    // Build lookup maps
    const teamMap = {};
    const buMap = {};
    const teamRoleMap = {};

    teams.forEach((t, i) => { if (t) teamMap[[...teamIds][i]] = t; });
    bus.forEach((b, i) => { if (b) buMap[[...buIds][i]] = b; });
    teamRoles.forEach((r, i) => { if (r) teamRoleMap[[...teamRoleIds][i]] = r; });

    // Enrich staff with related data
    const enrichedStaff = staffList.map(s => ({
      ...s,
      _team: s['N_Team'] ? teamMap[s['N_Team']] : null,
      _bu: s['N_BU'] ? buMap[s['N_BU']] : null,
      _teamRole: s['N_Team Role'] ? teamRoleMap[s['N_Team Role']] : null,
    }));

    return Response.json({
      staff: enrichedStaff,
      total: enrichedStaff.length,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});