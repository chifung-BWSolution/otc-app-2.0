import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  // 1. Load all LeaveTypes and build bubble_id → base44 id map
  const leaveTypes = await base44.asServiceRole.entities.LeaveType.list('code', 100);
  const bubbleToBase44 = {};
  for (const lt of leaveTypes) {
    if (lt.bubble_id) {
      bubbleToBase44[lt.bubble_id] = lt.id;
    }
  }
  console.log('LeaveType mapping:', JSON.stringify(bubbleToBase44));

  // 2. Parse optional offset from request body
  let startOffset = 0;
  try {
    const body = await req.json();
    if (body.offset) startOffset = body.offset;
  } catch {}

  const MAX_UPDATES = 150; // process max 150 updates per call
  let updated = 0;
  let skipped = 0;
  let noMatch = 0;
  let offset = startOffset;
  const batchSize = 100;
  const noMatchIds = [];

  while (updated < MAX_UPDATES) {
    const leaves = await base44.asServiceRole.entities.BubbleLeave.list('-created_date', batchSize, offset);
    if (!leaves || leaves.length === 0) break;

    for (const leave of leaves) {
      if (updated >= MAX_UPDATES) break;

      if (leave.leave_type_id) {
        skipped++;
        continue;
      }

      const bubbleLeaveTypeId = leave.leave_type;
      if (!bubbleLeaveTypeId) {
        skipped++;
        continue;
      }

      const base44Id = bubbleToBase44[bubbleLeaveTypeId];
      if (base44Id) {
        await base44.asServiceRole.entities.BubbleLeave.update(leave.id, {
          leave_type_id: base44Id
        });
        updated++;
      } else {
        noMatch++;
        if (noMatchIds.length < 10) noMatchIds.push({ id: leave.id, leave_type: bubbleLeaveTypeId });
      }
    }

    offset += leaves.length;
    if (leaves.length < batchSize) break;
  }

  return Response.json({
    success: true,
    start_offset: startOffset,
    next_offset: offset,
    updated,
    skipped,
    no_match: noMatch,
    no_match_samples: noMatchIds,
    mapping_count: Object.keys(bubbleToBase44).length,
    hint: updated >= MAX_UPDATES ? `Run again with offset=${offset} to continue` : 'Done - all records processed'
  });
});