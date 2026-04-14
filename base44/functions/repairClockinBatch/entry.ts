import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');

    // Step 1: Load ALL DB records into memory (one-time cost)
    console.log("Loading DB records...");
    const dbMap = {};
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'id', 5000, offset);
      for (const rec of batch) {
        if (rec.bubble_id) {
          dbMap[rec.bubble_id] = { id: rec.id, late_minutes: rec.late_minutes || 0, ot_minutes: rec.ot_minutes || 0 };
        }
      }
      offset += batch.length;
      if (batch.length < 5000) hasMore = false;
      else await sleep(1000);
    }
    console.log(`Loaded ${Object.keys(dbMap).length} DB records`);

    // Step 2: Find DB records with late_minutes=0 that might need updating
    // Sample 200 from Bubble that have Late minutes > 0, check if DB matches
    const constraints = JSON.stringify([{ key: "Late minutes", constraint_type: "greater than", value: 0 }]);
    
    const toUpdate = [];
    let cursor = 0;
    let totalChecked = 0;
    
    // Scan through Bubble records until we find 30 that need fixing
    while (toUpdate.length < 30 && totalChecked < 5000) {
      const url = `${baseUrl}/clock-in?limit=100&cursor=${cursor}&constraints=${encodeURIComponent(constraints)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) break;
      const json = await res.json();
      const results = json.response?.results || [];
      const remaining = json.response?.remaining || 0;
      
      for (const r of results) {
        const bid = r._id;
        const bubbleLate = r["Late minutes"] || 0;
        const bubbleOT = r["OT minutes approved"] || 0;
        const dbRec = dbMap[bid];
        
        if (dbRec && bubbleLate > 0 && dbRec.late_minutes !== bubbleLate) {
          toUpdate.push({ dbId: dbRec.id, late_minutes: bubbleLate });
        }
        if (dbRec && bubbleOT > 0 && dbRec.ot_minutes !== bubbleOT) {
          // Check if already in toUpdate
          const existing = toUpdate.find(u => u.dbId === dbRec.id);
          if (existing) {
            existing.ot_minutes = bubbleOT;
          } else {
            toUpdate.push({ dbId: dbRec.id, ot_minutes: bubbleOT });
          }
        }
      }
      
      totalChecked += results.length;
      if (remaining === 0) break;
      cursor += 100;
      await sleep(200);
    }
    
    console.log(`Found ${toUpdate.length} records to update after checking ${totalChecked}`);
    
    if (toUpdate.length === 0) {
      return Response.json({ success: true, message: "All records are up to date!", updated: 0, checked: totalChecked });
    }

    // Step 3: Apply updates with careful pacing
    let updated = 0;
    let errors = 0;
    
    for (const item of toUpdate) {
      const data = {};
      if (item.late_minutes !== undefined) data.late_minutes = item.late_minutes;
      if (item.ot_minutes !== undefined) data.ot_minutes = item.ot_minutes;
      
      try {
        await base44.asServiceRole.entities.BubbleClockin.update(item.dbId, data);
        updated++;
      } catch (err) {
        if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
          console.log(`Rate limited, waiting 15s...`);
          await sleep(15000);
          try {
            await base44.asServiceRole.entities.BubbleClockin.update(item.dbId, data);
            updated++;
          } catch (err2) {
            errors++;
          }
        } else {
          errors++;
        }
      }
      
      await sleep(500);
    }

    console.log(`Updated ${updated}, errors ${errors}`);
    return Response.json({ success: true, checked: totalChecked, needUpdate: toUpdate.length, updated, errors });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});