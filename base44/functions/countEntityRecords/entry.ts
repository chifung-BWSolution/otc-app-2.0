import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ENTITIES = [
  'Staff', 'StaffInformation', 'StaffEducation', 'StaffWorkExperience',
  'StaffContactPerson', 'StaffQACategory', 'StaffQAQuestion', 'StaffQAAnswer',
  'BubbleLeave', 'BubbleClockin', 'BubbleManHourDate', 'BubbleManHourTask',
  'BubbleProject', 'BubbleOT', 'BubbleStaffKPI', 'BubbleStaffKPIMonth',
  'BubbleMeritsDemerits', 'AnnualReview', 'PeerReview', 'AppraisalReport',
  'LeaveType', 'NOSDistrict', 'NOSTask', 'NOSTaskType', 'NOSBU', 'NOSTeam',
  'NOSTeamRole', 'Region', 'MeritDemeritType', 'ReviewPreset',
  'ContributionType', 'ScoreLevel', 'CourseCategory', 'Course', 'CourseResource',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = [];
    for (const name of ENTITIES) {
      try {
        // Fetch with high limit to count
        const records = await base44.asServiceRole.entities[name].filter({}, '-created_date', 1);
        // We need total count - let's fetch in batches
        let total = 0;
        let batch;
        const PAGE = 10000;
        batch = await base44.asServiceRole.entities[name].filter({}, '-created_date', PAGE);
        total = batch.length;
        if (total === PAGE) {
          // Might have more, try next page - use skip approach
          // Base44 filter doesn't support skip easily, so let's use a different approach
          // Just mark as "10000+"
          total = '10000+';
        }
        results.push({ entity: name, count: total });
      } catch (e) {
        results.push({ entity: name, count: 0, error: e.message });
      }
    }

    return Response.json({ results });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});