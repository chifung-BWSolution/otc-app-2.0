import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun !== false; // default dry run

    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');

    // Step 1: Read ALL Bubble Clockin records that have ot_minutes_approved > 0
    console.log("Fetching Bubble clock-in records with OT minutes...");
    const bubbleRecords = [];
    let cursor = 0;
    const batchSize = 100;

    // We need to find records where ot_minutes_approved > 0
    // Bubble constraint format: constraints=[{"key":"OT minutes approved","constraint_type":"greater than","value":0}]
    const constraints = JSON.stringify([{"key":"OT minutes approved","constraint_type":"greater than","value":0}]);

    while (true) {
      const url = `${baseUrl}/clock-in?limit=${batchSize}&cursor=${cursor}&constraints=${encodeURIComponent(constraints)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Bubble API error ${res.status}: ${text}`);
      }
      const json = await res.json();
      const results = json.response?.results || [];
      bubbleRecords.push(...results);

      const remaining = json.response?.remaining || 0;
      console.log(`Fetched ${bubbleRecords.length} records, remaining: ${remaining}`);
      if (remaining === 0 || results.length === 0) break;
      cursor += results.length;
      await sleep(300);
    }

    console.log(`Total Bubble records with OT minutes: ${bubbleRecords.length}`);

    if (bubbleRecords.length === 0) {
      return Response.json({ message: "No Bubble records found with OT minutes > 0", updated: 0 });
    }

    // Log a sample to see field names
    const sample = bubbleRecords[0];
    console.log("Sample Bubble record keys:", Object.keys(sample).join(", "));
    console.log("Sample _id:", sample._id);
    console.log("Sample OT minutes approved:", sample["OT minutes approved"]);

    // Step 2: Build a map of bubble_id -> ot_minutes
    const otMap = {};
    for (const rec of bubbleRecords) {
      const bubbleId = rec._id;
      const otMinutes = rec["OT minutes approved"];
      if (bubbleId && otMinutes != null && otMinutes > 0) {
        otMap[bubbleId] = otMinutes;
      }
    }
    console.log(`OT map size: ${Object.keys(otMap).length}`);

    if (dryRun) {
      // Show sample matches
      const sampleEntries = Object.entries(otMap).slice(0, 10);
      return Response.json({
        dryRun: true,
        totalBubbleWithOT: bubbleRecords.length,
        otMapSize: Object.keys(otMap).length,
        sampleEntries: sampleEntries.map(([id, val]) => ({ bubble_id: id, ot_minutes: val })),
      });
    }

    // Step 3: Load ALL DB clockin records into memory (faster than individual lookups)
    console.log("Loading all DB Clockin records...");
    const allDb = [];
    const pageSize = 5000;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'id', pageSize, allDb.length);
      allDb.push(...batch);
      if (batch.length < pageSize) hasMore = false;
      else await sleep(500);
    }
    console.log(`Loaded ${allDb.length} DB records`);

    // Build bubble_id -> db record map, only where ot_minutes is missing
    const dbMap = {};
    for (const rec of allDb) {
      if (rec.bubble_id && (rec.ot_minutes == null || rec.ot_minutes === 0)) {
        dbMap[rec.bubble_id] = rec.id;
      }
    }

    // Step 4: Update only records that need it
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;

    const bubbleIds = Object.keys(otMap);
    const toUpdate = [];
    for (const bid of bubbleIds) {
      if (dbMap[bid]) {
        toUpdate.push({ dbId: dbMap[bid], otVal: otMap[bid], bid });
      } else {
        // Check if already has value
        const existing = allDb.find(r => r.bubble_id === bid);
        if (existing && existing.ot_minutes > 0) skipped++;
        else notFound++;
      }
    }
    console.log(`Need to update: ${toUpdate.length}, already done: ${skipped}, not found: ${notFound}`);

    for (let i = 0; i < toUpdate.length; i++) {
      const { dbId, otVal, bid } = toUpdate[i];
      let success = false;
      for (let attempt = 0; attempt < 5 && !success; attempt++) {
        try {
          await base44.asServiceRole.entities.BubbleClockin.update(dbId, { ot_minutes: otVal });
          updated++;
          success = true;
        } catch (e) {
          if ((e.status === 429 || (e.message || "").includes("Rate limit")) && attempt < 4) {
            const wait = Math.min(5000 * Math.pow(2, attempt), 60000);
            console.log(`Rate limited on ${bid}, waiting ${wait}ms (attempt ${attempt + 1})`);
            await sleep(wait);
          } else {
            errors++;
            console.log(`Error updating ${bid}: ${e.message}`);
            success = true;
          }
        }
      }
      await sleep(500);
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${toUpdate.length}, updated: ${updated}`);
        await sleep(3000);
      }
    }

    console.log(`Done. Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`);

    return Response.json({
      success: true,
      totalBubbleWithOT: bubbleRecords.length,
      updated,
      notFound,
      errors,
      skipped,
    });
  } catch (error) {
    console.error("repairOtMinutes error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});