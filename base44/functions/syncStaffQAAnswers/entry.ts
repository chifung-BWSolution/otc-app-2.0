import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_URL = Deno.env.get('BUBBLE_API_URL');
const BUBBLE_TOKEN = Deno.env.get('BUBBLE_API_TOKEN');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batchSize || 300;

    // Step 1: Collect ALL existing bubble_ids from Base44 (paginated)
    console.log('Collecting existing bubble_ids from Base44...');
    const existingIds = new Set();
    let skip = 0;
    const pageSize = 500;
    while (true) {
      const page = await base44.asServiceRole.entities.StaffQAAnswer.list('-created_date', pageSize, skip);
      if (!page || page.length === 0) break;
      for (const r of page) {
        if (r.bubble_id) existingIds.add(r.bubble_id);
      }
      skip += page.length;
      if (page.length < pageSize) break;
      await sleep(300);
    }
    console.log(`Existing StaffQAAnswer: ${existingIds.size}`);

    // Step 2: Fetch from Bubble starting at cursor 0, find records not yet synced
    console.log('Fetching Staff Q&A Answer from Bubble...');
    const toCreate = [];
    let cursor = 0;
    let bubbleTotal = 0;

    while (toCreate.length < batchSize) {
      const url = `${BUBBLE_URL}/${encodeURIComponent('Staff Q&A Answer')}?limit=100&cursor=${cursor}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${BUBBLE_TOKEN}` } });
      if (!res.ok) {
        console.log(`Bubble error: ${res.status}`);
        break;
      }
      const data = await res.json();
      const results = data.response?.results || [];
      const remaining = data.response?.remaining || 0;

      if (cursor === 0) {
        bubbleTotal = results.length + remaining;
        console.log(`Bubble total: ~${bubbleTotal}, need to sync: ${bubbleTotal - existingIds.size}`);
      }

      for (const r of results) {
        if (!existingIds.has(r['_id'])) {
          toCreate.push({
            bubble_id: r['_id'],
            answer_text: r['Answer Text'] || '',
            option_point: r['Option Point'] != null ? r['Option Point'] : null,
            question_id: r['Question'] || '',
            staff_id: r['Staff'] || '',
            is_active: r['Is Active'] !== false,
            bubble_created_by: r['Created By'] || '',
            bubble_created_date: r['Created Date'] || null,
            bubble_modified_date: r['Modified Date'] || null,
          });
          if (toCreate.length >= batchSize) break;
        }
      }

      if (remaining === 0 || results.length === 0) break;
      cursor += results.length;
      await sleep(300);
    }

    // Step 3: Bulk create in batches of 100
    let created = 0;
    for (let i = 0; i < toCreate.length; i += 100) {
      const batch = toCreate.slice(i, i + 100);
      await base44.asServiceRole.entities.StaffQAAnswer.bulkCreate(batch);
      created += batch.length;
      console.log(`Created ${created}/${toCreate.length}`);
      await sleep(1500);
    }

    const totalSynced = existingIds.size + created;
    return Response.json({
      success: true,
      bubble_total: bubbleTotal,
      already_synced: existingIds.size,
      created,
      total_synced: totalSynced,
      remaining: bubbleTotal - totalSynced,
      message: totalSynced >= bubbleTotal
        ? `All ${totalSynced} records synced!`
        : `Run again to sync more (${totalSynced}/${bubbleTotal})`
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});