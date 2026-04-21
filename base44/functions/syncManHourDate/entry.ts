import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Fetch a batch of Bubble records starting at cursor
async function fetchBubbleBatch(typeName, cursor, limit) {
  const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
  const url = `${baseUrl}/${typeName}?limit=${limit}&cursor=${cursor}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Bubble API error ${res.status}: ${txt.substring(0, 200)}`);
  }
  const json = await res.json();
  return {
    results: json.response?.results || [],
    remaining: json.response?.remaining || 0,
    count: json.response?.count || 0,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    // startCursor lets us resume from where we left off
    const startCursor = body.startCursor || 0;
    // How many Bubble records to process per call (keep small to avoid timeout)
    const batchLimit = body.batchLimit || 2000;

    // 1. Load existing DB bubble_ids into a Set (fast lookup)
    console.log("Loading existing DB bubble_ids...");
    const existingIds = new Set();
    const pageSize = 5000;
    let hasMore = true;
    let offset = 0;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', pageSize, offset);
      for (const rec of batch) {
        if (rec.bubble_id) existingIds.add(rec.bubble_id);
      }
      offset += batch.length;
      if (batch.length < pageSize) hasMore = false;
      else await sleep(300);
    }
    console.log(`Existing DB records: ${existingIds.size}`);

    // 2. Fetch Bubble records in pages starting at cursor, up to batchLimit
    console.log(`Fetching Bubble man_hour_date from cursor=${startCursor}, limit=${batchLimit}...`);
    const bubbleRecords = [];
    let cursor = startCursor;
    let totalRemaining = 0;
    while (bubbleRecords.length < batchLimit) {
      const pageLimit = Math.min(100, batchLimit - bubbleRecords.length);
      const page = await fetchBubbleBatch("man_hour_date", cursor, pageLimit);
      bubbleRecords.push(...page.results);
      totalRemaining = page.remaining;
      console.log(`Fetched so far: ${bubbleRecords.length}, remaining in Bubble: ${totalRemaining}`);
      if (page.results.length === 0 || totalRemaining === 0) break;
      cursor += page.results.length;
      await sleep(150);
    }
    const nextCursor = totalRemaining > 0 ? cursor : null;
    console.log(`Got ${bubbleRecords.length} Bubble records. nextCursor=${nextCursor}`);

    // 3. Find records missing from DB
    const toCreate = [];
    let alreadyExists = 0;
    for (const raw of bubbleRecords) {
      const bid = raw._id;
      if (!bid) continue;
      if (existingIds.has(bid)) {
        alreadyExists++;
        continue;
      }
      toCreate.push({
        bubble_id: bid,
        report_date: raw["Report Date"] || "",
        staff_id: raw["Staff"] || "",
        staff_name: "", // will be filled by a separate repair pass
        total_work_hour: raw["Total Work Hour"] ?? 0,
      });
    }
    console.log(`To create: ${toCreate.length}, Already exists: ${alreadyExists}`);

    if (dryRun) {
      return Response.json({
        dryRun: true,
        dbTotal: existingIds.size,
        bubbleFetched: bubbleRecords.length,
        toCreate: toCreate.length,
        alreadyExists,
        nextCursor,
        sampleCreate: toCreate.slice(0, 3),
      });
    }

    // 4. Insert missing records
    let created = 0;
    let errors = 0;
    for (let i = 0; i < toCreate.length; i += 20) {
      const batch = toCreate.slice(i, i + 20);
      let retries = 0;
      let success = false;
      while (retries < 5 && !success) {
        try {
          await base44.asServiceRole.entities.BubbleManHourDate.bulkCreate(batch);
          created += batch.length;
          success = true;
        } catch (e) {
          const is429 = e.status === 429 || (e.message || "").includes("Rate limit");
          if (is429 && retries < 4) {
            retries++;
            const wait = Math.min(3000 * Math.pow(2, retries), 30000);
            console.log(`Rate limited, waiting ${wait}ms (attempt ${retries})`);
            await sleep(wait);
          } else {
            // Try one-by-one
            for (const rec of batch) {
              try {
                await base44.asServiceRole.entities.BubbleManHourDate.create(rec);
                created++;
              } catch (e2) {
                errors++;
                if (errors <= 5) console.log(`Single create error: ${e2.message}`);
              }
              await sleep(50);
            }
            success = true;
          }
        }
      }
      if ((Math.floor(i / 20) + 1) % 10 === 0) {
        console.log(`Created ${created}/${toCreate.length}`);
        await sleep(500);
      } else {
        await sleep(200);
      }
    }

    console.log(`Done. Created: ${created}, Errors: ${errors}, nextCursor: ${nextCursor}`);

    return Response.json({
      success: true,
      dbTotal: existingIds.size,
      bubbleFetched: bubbleRecords.length,
      created,
      errors,
      alreadyExists,
      nextCursor,
      newDbTotal: existingIds.size + created,
    });
  } catch (error) {
    console.error("syncManHourDate error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});