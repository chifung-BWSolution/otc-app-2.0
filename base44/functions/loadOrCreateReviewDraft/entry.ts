import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const staffId = body.staff_id || user.linked_staff_id;
    const fiscalYear = body.fiscal_year;

    if (!staffId || !fiscalYear) {
      return Response.json({ error: 'Missing staff_id or fiscal_year' }, { status: 400 });
    }

    // Security: only own data unless admin
    if (staffId !== user.linked_staff_id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sr = base44.asServiceRole;

    // Check for existing review for this FY
    const existing = await sr.entities.AnnualReview.filter(
      { staff_id: staffId, fiscal_year: fiscalYear }, "-created_date", 1
    );

    if (existing.length > 0) {
      const review = existing[0];
      return Response.json({
        action: 'found_existing',
        review: review,
      });
    }

    // No existing review — need to load project data and create draft
    const fyMatch = fiscalYear.match(/FY(\d{4})\/(\d{4})/);
    if (!fyMatch) {
      return Response.json({ error: 'Invalid fiscal_year format' }, { status: 400 });
    }
    const y = parseInt(fyMatch[1]);
    const fyStart = `${y}-04-01`;
    const fyEnd = `${y + 1}-03-31`;

    // Load man hour dates for this staff
    const allDates = [];
    let offset = 0;
    while (true) {
      const batch = await sr.entities.BubbleManHourDate.filter(
        { staff_id: staffId }, "-report_date", 5000, offset
      );
      allDates.push(...batch);
      if (batch.length < 5000) break;
      offset += batch.length;
    }

    const toLocalDate = (val) => {
      if (!val) return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const cleaned = val.split(' ')[0];
      const parts = cleaned.split('/');
      if (parts.length === 3) {
        const [d, m, yy] = parts;
        return `${yy}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      if (val.includes('T')) {
        const dt = new Date(val);
        const hkt = new Date(dt.getTime() + 8 * 60 * 60 * 1000);
        return hkt.toISOString().slice(0, 10);
      }
      return null;
    };

    const fyDates = allDates.filter(d => {
      const rd = toLocalDate(d.report_date);
      return rd && rd >= fyStart && rd <= fyEnd;
    });

    const bubbleDateIds = new Set(fyDates.map(d => d.bubble_id).filter(Boolean));
    const base44DateIds = new Set(fyDates.map(d => d.id));

    console.log(`Staff ${staffId}: ${allDates.length} total dates, ${fyDates.length} in FY range`);

    // Load ALL tasks via service role, filter client-side
    const allTasks = [];
    offset = 0;
    while (true) {
      const batch = await sr.entities.BubbleManHourTask.filter(
        {}, "-created_date", 5000, offset
      );
      allTasks.push(...batch);
      if (batch.length < 5000) break;
      offset += batch.length;
      await new Promise(r => setTimeout(r, 300));
    }

    const myTasks = allTasks.filter(t => {
      const mid = t.man_hour_date_id;
      return bubbleDateIds.has(mid) || base44DateIds.has(mid);
    });

    console.log(`Total tasks: ${allTasks.length}, matched: ${myTasks.length}`);

    // Load lookups
    const [taskTypes, nosTasks, projects] = await Promise.all([
      sr.entities.NOSTaskType.filter({}, "display", 500),
      sr.entities.NOSTask.filter({}, "display", 500),
      sr.entities.BubbleProject.filter({}, "display_name", 5000),
    ]);

    // Build maps
    const projectMap = {};
    for (const p of projects) { if (p.bubble_id) projectMap[p.bubble_id] = p; }
    const taskTypeMap = {};
    for (const t of taskTypes) { if (t.bubble_id) taskTypeMap[t.bubble_id] = t; }
    const nosTaskMap = {};
    for (const t of nosTasks) { if (t.bubble_id) nosTaskMap[t.bubble_id] = t; }

    const resolveProjectName = (t) => {
      if (t.project_name) return t.project_name;
      if (t.project_id && projectMap[t.project_id]) return projectMap[t.project_id].display_name;
      return "未指定項目";
    };

    // Aggregate by project
    const projAgg = {};
    for (const t of myTasks) {
      const projName = resolveProjectName(t);
      const projId = t.project_id || "";
      if (!projAgg[projName]) projAgg[projName] = { project_name: projName, project_id: projId, hours: 0, tasks: 0, sales_amount: 0, contribution_note: "" };
      projAgg[projName].hours += t.work_hour || 0;
      projAgg[projName].tasks += 1;
    }

    const projectContributions = Object.values(projAgg)
      .map(p => ({ ...p, hours: Math.round(p.hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);

    // Load staff info
    const staffList = await sr.entities.Staff.filter({ bubble_id: staffId }, "id", 1);
    const staff = staffList[0] || {};

    // Create draft
    const draftPayload = {
      staff_id: staffId,
      staff_name: staff.display_name || "",
      staff_team: staff.team_name || "",
      staff_bu: staff.bu_name || "",
      staff_position: staff.position || "",
      leader_staff_id: staff.team_leader || "",
      fiscal_year: fiscalYear,
      project_contributions: projectContributions,
      extra_contributions: [],
      status: "draft",
    };

    const created = await sr.entities.AnnualReview.create(draftPayload);
    console.log(`Created draft: ${created.id} with ${projectContributions.length} projects`);

    return Response.json({
      action: 'created_new',
      review: created,
    });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});