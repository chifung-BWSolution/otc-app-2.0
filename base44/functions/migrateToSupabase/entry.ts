import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// All entity schemas: field name -> pg type
const ENTITY_SCHEMAS = {
  Staff: {
    al_quota:'numeric', birthday:'date', brands:'jsonb', business_email:'text',
    clock_in_face:'text', clock_in_face_amazon_id:'text', clock_in_face_amazon_id_2:'text',
    dingding_dept_id:'text', dingding_user_id:'text', direct_phone:'numeric',
    display_name:'text', entry_date:'date', full_name:'text', hotline:'text',
    leave_quota_remain:'numeric', n_bu:'text', bu_name:'text', n_team:'text',
    team_name:'text', n_team_role:'text', team_role_name:'text',
    new_direct_phone:'jsonb', new_work_phone:'text', no_clockin:'boolean',
    no_man_hour_task:'boolean', o_base_location:'text', o_probation:'text',
    o_status:'text', o_status_text:'text', o_user_role:'text', other_phone:'jsonb',
    position:'text', private_email:'text', private_phone:'numeric',
    profile_pic:'text', team_leader:'text', team_leader_name:'text',
    termination_date:'date', voov_id:'numeric', work_email:'text', work_phone:'numeric',
    bubble_id:'text', bubble_created_date:'text', bubble_modified_date:'text',
    linked_user_email:'text', login_mobile:'text', login_password:'text',
    staff_region:'text', team_group:'text',
  },
  StaffInformation: {
    bubble_id:'text', staff_id:'text', staff_record_id:'text', staff_name:'text',
    chinese_name:'text', english_name:'text', nickname:'text', birthday:'date',
    phone:'text', residential_telephone:'text', email1:'text', email2:'text',
    identity_card_number:'text', mainland_travel_permit_number:'text',
    new_bank_card_number:'text', bank_card_name:'text', bank_card_owner:'text',
    chinese_mailing_address:'text', english_mailing_address:'text',
    native_place:'text', residential_area:'text', marital_status:'text',
    commuting_time:'text', is_active:'boolean', is_smoking:'boolean',
    no_working_experience:'boolean',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  StaffEducation: {
    bubble_id:'text', staff_information_id:'text', staff_bubble_id:'text',
    graduation_school:'text', education_background:'text', graduation_major:'text',
    graduation_start_date:'date', graduation_end_date:'date',
    is_arts:'boolean', is_business:'boolean', is_science:'boolean', is_other:'boolean',
    is_part_time:'boolean', is_unfinished:'boolean', other_subjects:'text',
    prove_url:'text', is_active:'boolean',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  StaffWorkExperience: {
    bubble_id:'text', staff_information_id:'text', staff_bubble_id:'text',
    company_name:'text', job_title:'text', job_start_date:'date', job_end_date:'date',
    prove_url:'text', is_active:'boolean',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  StaffContactPerson: {
    bubble_id:'text', staff_information_id:'text', staff_bubble_id:'text',
    person_name:'text', relationship:'text', phone:'text', is_active:'boolean',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  StaffQACategory: {
    bubble_id:'text', display:'text', type:'text', is_active:'boolean',
    bubble_created_by:'text', bubble_modifier:'text',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  StaffQAQuestion: {
    bubble_id:'text', question:'text', category_id:'text', placeholder:'text',
    option_1:'text', option_2:'text', option_3:'text', option_4:'text',
    is_option:'boolean', is_required:'boolean', is_active:'boolean',
    bubble_created_by:'text', bubble_modifier:'text',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  StaffQAAnswer: {
    bubble_id:'text', answer_text:'text', option_point:'numeric', question_id:'text',
    staff_id:'text', is_active:'boolean', bubble_created_by:'text',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  BubbleLeave: {
    bubble_id:'text', prove_url:'text', remarks:'text', quota:'numeric',
    count_year:'text', info_tech_url:'text', approved:'boolean',
    display_name:'text', reject_reason:'text', send_email:'boolean',
    staff_id:'text', staff_name:'text', end_date_time:'timestamptz',
    google_event_id:'text', approver_id:'text', approver_name:'text',
    rejecter_id:'text', rejecter_name:'text', start_date_time:'timestamptz',
    application_reason:'text', interview_email:'boolean',
    send_approval_email:'boolean', leave_type:'text', leave_type_id:'text',
    leave_period:'text',
  },
  BubbleClockin: {
    bubble_id:'text', prove_out_url:'text', remarks_in:'text',
    face_image_in_url:'text', prove_in_url:'text', clockin_time:'text',
    ot_minutes:'numeric', remarks_out:'text', staff_id:'text', staff_name:'text',
    clock_out_time:'text', late_minutes:'numeric', accuracy_in:'numeric',
    accuracy_out:'numeric', face_image_out_url:'text',
    face_image_file_url_in:'text', reason_for_no_clock:'text',
    request_update_end_time:'text', face_image_file_url_out:'text',
    request_update_start_time:'text', geo_location_in:'text', geo_location_out:'text',
    google_location_in:'text', google_location_out:'text',
    status_in:'text', status_out:'text', tags_in:'jsonb', tags_out:'jsonb',
    work_location_in:'text', work_location_out:'text',
    photo_approval_in:'text', photo_approval_out:'text',
    request_update_end_location:'text', request_update_start_location:'text',
    dingding_in_attendance_id:'text', dingding_out_attendance_id:'text',
  },
  BubbleManHourDate: {
    bubble_id:'text', report_date:'text', staff_id:'text', staff_name:'text',
    total_work_hour:'numeric',
  },
  BubbleManHourTask: {
    bubble_id:'text', asana_link:'text', work_hour:'numeric', images:'jsonb',
    keywords:'text', meeting_topic:'text', output_count:'numeric',
    task_description:'text', task_id:'text', task_name:'text',
    project_id:'text', project_name:'text', brand_id:'text', brand_name:'text',
    meeting_invite_sent:'boolean', projects:'jsonb', task_type_id:'text',
    task_type_name:'text', man_hour_date_id:'text', meeting_participants:'jsonb',
    meeting_method:'text', output_unit:'text', work_location:'text',
    meeting_duration:'text', meeting_request_date:'text',
  },
  BubbleProject: {
    bubble_id:'text', outcome:'text', asana_link:'text', pic_id:'text', pic_name:'text',
    display_name:'text', started_date:'date', bubble_api_id:'text',
    is_key_project:'boolean', estimated_income:'numeric', estimated_expense:'numeric',
    estimated_man_hour:'numeric', brands:'jsonb', collaborators:'jsonb',
    status:'text', teams:'jsonb', locations:'jsonb', roles:'jsonb',
    sub_projects:'jsonb', task_types:'jsonb', project_timeline:'text',
  },
  BubbleOT: {
    bubble_id:'text', remarks:'text', ot_hour:'numeric', event_name:'text',
    reject_reason:'text', staff_id:'text', staff_name:'text',
    end_date_time:'timestamptz', is_interview:'boolean',
    start_date_time:'timestamptz', clockin_id:'text', ot_type:'text', status:'text',
  },
  BubbleStaffKPI: {
    bubble_id:'text', score:'numeric', asana_link:'text', kpi_sales:'numeric',
    related_file_url:'text', self_score:'numeric', leader_comment:'text',
    box_folder:'text', key_achievement:'text', project_id:'text', project_name:'text',
    improve_description:'text', leader_suggest_score:'numeric',
    breakthrough_description:'text', staff_kpi_month_id:'text',
  },
  BubbleStaffKPIMonth: {
    bubble_id:'text', report_month:'text', staff_id:'text', staff_name:'text',
    company_comment:'text', company_point:'numeric',
  },
  BubbleMeritsDemerits: {
    bubble_id:'text', staff_id:'text', staff_name:'text', type:'text',
    brief_description:'text', detailed_description:'text', event_date:'timestamptz',
    event_view_role:'text', bubble_created_by:'text',
    bubble_created_date:'timestamptz', bubble_modified_date:'timestamptz',
  },
  AnnualReview: {
    staff_id:'text', staff_name:'text', staff_team:'text', staff_bu:'text',
    staff_position:'text', leader_staff_id:'text', fiscal_year:'text',
    project_contributions:'jsonb', extra_contributions:'jsonb',
    skill_scores:'jsonb', skill_self_scores:'jsonb',
    boss_gp_score:'numeric', boss_gp_comment:'text',
    leader_comment:'text', leader_next_year_expectation:'text', leader_private_note:'text',
    leader_scored_at:'timestamptz', challenges:'text', challenges_solution:'text',
    next_year_goals:'text', commitment:'text', company_feedback:'text',
    boss_score_adjustment:'numeric', boss_adjustment_note:'text',
    boss_dept_goals:'jsonb', boss_personal_goals:'jsonb', boss_extra_notes:'text',
    boss_gp_fields:'jsonb', boss_tender_fields:'jsonb',
    boss_gp_disabled:'boolean', boss_tender_disabled:'boolean',
    attendance_work_days:'numeric', status:'text', submitted_at:'timestamptz',
  },
  PeerReview: {
    reviewer_staff_id:'text', reviewer_name:'text', reviewer_team_group:'text',
    reviewee_staff_id:'text', reviewee_name:'text', reviewee_team_group:'text',
    fiscal_year:'text', score_attitude:'numeric', score_professionalism:'numeric',
    score_teamwork:'numeric', score_problem_solving:'numeric',
    score_company_contribution:'numeric', comment:'text', private_note:'text',
    no_collaboration:'boolean', no_collab_approved:'text', status:'text',
    submitted_at:'timestamptz',
  },
  AppraisalReport: {
    annual_review_id:'text', staff_id:'text', staff_name:'text', staff_team:'text',
    staff_bu:'text', staff_position:'text', fiscal_year:'text',
    report_content:'text', version:'numeric', is_final:'boolean',
    boss_feedback:'text', score_projects:'numeric', score_contributions:'numeric',
    score_challenges:'numeric', score_goals:'numeric', score_peer_review:'numeric',
    score_attendance:'numeric', total_score:'numeric', scoring_completed:'boolean',
    pdf_url:'text',
  },
  LeaveType: {
    code:'text', name:'text', full_label:'text', bubble_id:'text',
    default_entitlement:'numeric', is_paid:'boolean', is_active:'boolean',
  },
  NOSDistrict: {
    bubble_id:'text', district:'text', sub_district:'text', eng_sub_district:'text',
    area:'text', short_form:'text', is_active:'boolean',
  },
  NOSTask: {
    display:'text', eng_display:'text', is_active:'boolean',
    task_type_ids:'jsonb', sorting:'numeric', bubble_id:'text',
  },
  NOSTaskType: {
    display:'text', eng_display:'text', is_active:'boolean',
    brands:'jsonb', teams:'jsonb', bubble_id:'text',
  },
  NOSBU: {
    bubble_id:'text', display:'text', description:'text', is_active:'boolean',
  },
  NOSTeam: {
    bubble_id:'text', display:'text', bu_id:'text', bu_name:'text',
    description:'text', is_active:'boolean', team_group:'text',
  },
  NOSTeamRole: {
    bubble_id:'text', display:'text', description:'text', is_active:'boolean',
  },
  Region: {
    code:'text', name:'text', full_name:'text', office_address:'text',
    timezone:'text', currency:'text', color:'text', icon:'text',
    sort_order:'numeric', is_active:'boolean', base_locations:'jsonb',
    work_start:'text', lunch_start:'text', lunch_end:'text', work_end:'text',
    sat_training_end:'text',
  },
  MeritDemeritType: {
    name:'text', category:'text', score_adjustment:'numeric',
    sort_order:'numeric', is_active:'boolean',
  },
  ReviewPreset: {
    category:'text', label:'text', sort_order:'numeric', is_active:'boolean',
  },
  ContributionType: {
    name:'text', description:'text', icon:'text', sort_order:'numeric', is_active:'boolean',
  },
  ScoreLevel: {
    score:'numeric', label:'text', description:'text', sort_order:'numeric', is_active:'boolean',
  },
  CourseCategory: {
    name:'text', description:'text', service_units:'jsonb', icon:'text',
    color:'text', sort_order:'numeric', is_active:'boolean',
  },
  Course: {
    title:'text', code:'text', category_id:'text', category_name:'text',
    service_units:'jsonb', description:'text', cover_image:'text',
    difficulty:'numeric', duration_hours:'numeric', learning_method:'text',
    objectives:'jsonb', prerequisites:'text', target_audience:'text',
    instructors:'jsonb', has_assessment:'boolean', passing_score:'numeric',
    status:'text', tags:'jsonb', created_by_name:'text',
  },
  CourseResource: {
    title:'text', description:'text', course_id:'text', course_name:'text',
    category:'text', format:'text', url:'text', file_url:'text',
    content_text:'text', tags:'jsonb', difficulty:'numeric',
    target_dept:'jsonb', target_role:'text', learning_method:'text',
    status:'text', reviewed_by:'text', reviewed_at:'timestamptz',
    review_note:'text', duration_minutes:'numeric',
    uploaded_by:'text', uploaded_at:'timestamptz',
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

async function execSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed ${res.status}: ${text}`);
  }
  return true;
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

async function migrateEntity(base44, entityName, fields, dropFirst = false) {
  const snakeTable = entityName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  const fieldKeys = Object.keys(fields);
  const result = { entity: entityName, table: snakeTable };

  // Optionally drop table first
  if (dropFirst) {
    try { await execSQL(`DROP TABLE IF EXISTS "${snakeTable}" CASCADE`); } catch (_) {}
  }

  // Create table and refresh PostgREST schema cache
  const sql = buildCreateTableSQL(snakeTable, fields);
  try {
    await execSQL(sql);
    await execSQL("NOTIFY pgrst, 'reload schema'");
    // Wait for schema cache to refresh
    await new Promise(r => setTimeout(r, 3000));
    result.table_created = true;
  } catch (e) {
    result.table_created = false;
    result.table_error = e.message;
    return result;
  }

  // Fetch data
  const records = await base44.asServiceRole.entities[entityName].filter({}, '-created_date', 10000);
  result.total = records.length;

  if (records.length === 0) {
    result.inserted = 0;
    return result;
  }

  // Insert in batches
  const BATCH = 200;
  let inserted = 0;
  const errors = [];
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const rows = batch.map(r => transformRecord(r, fieldKeys));
    try {
      await insertBatch(snakeTable, rows);
      inserted += batch.length;
    } catch (e) {
      errors.push({ batch: Math.floor(i / BATCH), error: e.message });
    }
  }
  result.inserted = inserted;
  if (errors.length > 0) result.errors = errors;
  return result;
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

    const dropFirst = body.dropFirst === true;

    // Single entity mode
    if (entity && entity !== 'ALL') {
      const fields = ENTITY_SCHEMAS[entity];
      if (!fields) {
        return Response.json({ error: `Unknown entity: ${entity}. Available: ${Object.keys(ENTITY_SCHEMAS).join(', ')}` }, { status: 400 });
      }
      const result = await migrateEntity(base44, entity, fields, dropFirst);
      return Response.json(result);
    }

    // Migrate ALL mode - skip already-done entities if specified
    const skip = body.skip || [];
    const results = [];
    const entityNames = Object.keys(ENTITY_SCHEMAS).filter(e => !skip.includes(e));

    for (const name of entityNames) {
      console.log(`Migrating ${name}...`);
      const result = await migrateEntity(base44, name, ENTITY_SCHEMAS[name]);
      results.push(result);
      console.log(`  -> ${result.inserted || 0}/${result.total || 0} inserted`);
    }

    const summary = {
      total_entities: results.length,
      success: results.filter(r => r.table_created && (!r.errors || r.errors.length === 0)).length,
      total_records: results.reduce((s, r) => s + (r.inserted || 0), 0),
      results,
    };

    return Response.json(summary);

  } catch (err) {
    console.error('Error:', err.message, err.stack);
    return Response.json({ error: err.message }, { status: 500 });
  }
});