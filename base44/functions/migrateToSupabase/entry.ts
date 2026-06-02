import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// All entity schemas (field name -> pg type)
const ENTITY_SCHEMAS = {
  Staff: {
    al_quota: 'numeric', birthday: 'date', brands: 'jsonb', business_email: 'text',
    clock_in_face: 'text', clock_in_face_amazon_id: 'text', clock_in_face_amazon_id_2: 'text',
    dingding_dept_id: 'text', dingding_user_id: 'text', direct_phone: 'numeric',
    display_name: 'text', entry_date: 'date', full_name: 'text', hotline: 'text',
    leave_quota_remain: 'numeric', n_bu: 'text', bu_name: 'text', n_team: 'text',
    team_name: 'text', n_team_role: 'text', team_role_name: 'text',
    new_direct_phone: 'jsonb', new_work_phone: 'text', no_clockin: 'boolean',
    no_man_hour_task: 'boolean', o_base_location: 'text', o_probation: 'text',
    o_status: 'text', o_status_text: 'text', o_user_role: 'text', other_phone: 'jsonb',
    position: 'text', private_email: 'text', private_phone: 'numeric',
    profile_pic: 'text', team_leader: 'text', team_leader_name: 'text',
    termination_date: 'date', voov_id: 'numeric', work_email: 'text', work_phone: 'numeric',
    bubble_id: 'text', bubble_created_date: 'text', bubble_modified_date: 'text',
    linked_user_email: 'text', login_mobile: 'text', login_password: 'text',
    staff_region: 'text', team_group: 'text',
  },
};

function buildCreateTableSQL(tableName, fields) {
  const cols = [
    'id bigint generated always as identity primary key',
    'base44_id text unique',
    'created_date timestamptz',
    'updated_date timestamptz',
    'created_by_id text',
  ];
  for (const [key, pgType] of Object.entries(fields)) {
    cols.push(`"${key}" ${pgType}`);
  }
  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${cols.join(',\n  ')}\n);`;
}

async function supabaseRpc(fnName, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

async function insertBatch(tableName, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Insert ${res.status}: ${errText}`);
  }
}

function transformRecord(record, fieldKeys) {
  const row = {
    base44_id: String(record.id),
    created_date: record.created_date || null,
    updated_date: record.updated_date || null,
    created_by_id: record.created_by_id ? String(record.created_by_id) : null,
  };
  for (const key of fieldKeys) {
    const val = record[key];
    row[key] = val === undefined ? null : val;
  }
  return row;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const entity = body.entity;
    if (!entity) {
      return Response.json({ error: 'Missing entity parameter' }, { status: 400 });
    }

    const fields = ENTITY_SCHEMAS[entity];
    if (!fields) {
      return Response.json({
        error: `Entity "${entity}" schema not configured. Available: ${Object.keys(ENTITY_SCHEMAS).join(', ')}`,
      }, { status: 400 });
    }

    const snakeTable = entity.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
    const fieldKeys = Object.keys(fields);
    const results = { entity, table: snakeTable, steps: [] };

    // Step 1: Generate CREATE TABLE SQL
    const createSQL = buildCreateTableSQL(snakeTable, fields);
    results.create_table_sql = createSQL;
    results.steps.push({ step: 'schema', fields: fieldKeys.length });

    // Step 2: Try creating table via exec_sql RPC
    console.log('Trying exec_sql RPC to create table...');
    const rpcResult = await supabaseRpc('exec_sql', { query: createSQL });
    if (rpcResult.ok) {
      results.steps.push({ step: 'table_created', success: true });
    } else {
      results.steps.push({
        step: 'table_creation',
        success: false,
        note: 'exec_sql RPC not available. Please run the SQL in create_table_sql in Supabase SQL Editor first. To enable auto-creation, run this SQL in Supabase: CREATE OR REPLACE FUNCTION exec_sql(query text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN EXECUTE query; RETURN json_build_object($$ok$$, true); END; $$;',
        rpc_status: rpcResult.status,
      });
      return Response.json(results);
    }

    // Step 3: Fetch all data from Base44
    console.log('Fetching', entity, 'data...');
    const allRecords = await base44.asServiceRole.entities[entity].filter({}, '-created_date', 10000);
    results.steps.push({ step: 'fetch_data', count: allRecords.length });

    if (allRecords.length === 0) {
      results.steps.push({ step: 'done', message: 'No data to migrate' });
      return Response.json(results);
    }

    // Step 4: Insert in batches
    console.log(`Inserting ${allRecords.length} records into ${snakeTable}...`);
    const BATCH_SIZE = 200;
    let inserted = 0;
    const insertErrors = [];

    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE);
      const rows = batch.map(r => transformRecord(r, fieldKeys));
      try {
        await insertBatch(snakeTable, rows);
        inserted += batch.length;
        console.log(`Inserted ${inserted}/${allRecords.length}`);
      } catch (e) {
        insertErrors.push({ batch: Math.floor(i / BATCH_SIZE), error: e.message });
        console.error(`Batch error:`, e.message);
      }
    }

    results.steps.push({ step: 'insert_data', inserted, total: allRecords.length, errors: insertErrors });
    return Response.json(results);

  } catch (err) {
    console.error('Error:', err.message, err.stack);
    return Response.json({ error: err.message }, { status: 500 });
  }
});