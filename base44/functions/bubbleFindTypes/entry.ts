import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const BUBBLE_URL = Deno.env.get('BUBBLE_API_URL');
  const BUBBLE_TOKEN = Deno.env.get('BUBBLE_API_TOKEN');
  const headers = { 'Authorization': `Bearer ${BUBBLE_TOKEN}` };

  // Try to fetch by ID - team ID from staff record
  const teamId = '1730357537080x598206154400152400';
  const buId = '1730346136827x527924578286488770';
  const teamRoleId = '1730353590376x686173271269438200';
  const brandId = '1735810669708x834789151519539200';
  const phoneId = '1750649992143x967274231361437700'; // from New Work Phone

  // Try different type names
  const typesToTry = [
    'Team', 'team', 'N_Team', 'n_team',
    'BU', 'bu', 'N_BU', 'n_bu', 'business_unit', 'BusinessUnit',
    'Team_Role', 'team_role', 'TeamRole', 'N_Team_Role',
    'Brand', 'brand', 'N_Brand',
    'Phone', 'phone', 'PhoneNumber', 'direct_phone', 'Work_Phone',
    'DirectPhone', 'New_Work_Phone', 'new_work_phone',
  ];

  const results = {};
  for (const t of typesToTry) {
    const r = await fetch(`${BUBBLE_URL}/${t}?limit=1`, { headers });
    if (r.ok) {
      const d = await r.json();
      results[t] = { status: 200, count: d.response?.count };
    } else {
      results[t] = { status: r.status };
    }
  }

  // Also try fetching specific IDs
  const idTests = {};
  for (const [name, id] of [['teamId', teamId], ['buId', buId], ['teamRoleId', teamRoleId], ['brandId', brandId], ['phoneId', phoneId]]) {
    // Try a few type guesses by direct ID
    for (const t of ['Team', 'BU', 'Team_Role', 'Brand', 'Phone', 'new_work_phone']) {
      const r = await fetch(`${BUBBLE_URL}/${t}/${id}`, { headers });
      if (r.ok) {
        const d = await r.json();
        idTests[`${name}@${t}`] = { status: 200, data: d.response };
      }
    }
  }

  return Response.json({ typeResults: results, idTests });
});