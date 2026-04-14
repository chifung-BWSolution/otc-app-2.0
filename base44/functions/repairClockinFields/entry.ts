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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "repair";

    if (action === "status") {
      // Check current state
      let dbLateCount = 0;
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'id', 5000, offset);
        for (const r of batch) {
          if (r.late_minutes > 0 || r.ot_minutes > 0) dbLateCount++;
        }
        offset += batch.length;
        if (batch.length < 5000) hasMore = false;
      }
      return Response.json({ dbRecordsWithLateOrOT: dbLateCount, totalDbRecords: offset });
    }

    // REPAIR: Load all DB records, find ones that need updating from Bubble
    console.log("Loading DB records...");
    const dbMap = {}; // bubble_id -> { id, late_minutes, ot_minutes }
    let dbOffset = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'id', 5000, dbOffset);
      for (const r of batch) {
        if (r.bubble_id) {
          dbMap[r.bubble_id] = { id: r.id, late_minutes: r.late_minutes || 0, ot_minutes: r.ot_minutes || 0 };
        }
      }
      dbOffset += batch.length;
      if (batch.length < 5000) hasMore = false;
      else await sleep(500);
    }
    console.log(`Loaded ${Object.keys(dbMap).length} DB records`);

    // Fetch ALL Bubble records that have Late minutes > 0
    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
    const updates = []; // { dbId, data }

    // Fetch late records
    let cursor = 0;
    hasMore = true;
    while (hasMore) {
      const constraints = JSON.stringify([
        { key: "Late minutes", constraint_type: "greater than", value: 0 }
      ]);
      const url = `${baseUrl}/clock-in?limit=100&cursor=${cursor}&constraints=${encodeURIComponent(constraints)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) break;
      const json = await res.json();
      const results = json.response?.results || [];
      const remaining = json.response?.remaining || 0;
      
      for (const r of results) {
        const db = dbMap[r._id];
        if (!db) continue;
        const bLate = r["Late minutes"] || 0;
        const bOT = r["OT minutes approved"] || 0;
        // Only update if different
        if (db.late_minutes !== bLate || (bOT > 0 && db.ot_minutes !== bOT)) {
          const data = {};
          if (db.late_minutes !== bLate) data.late_minutes = bLate;
          if (bOT > 0 && db.ot_minutes !== bOT) data.ot_minutes = bOT;
          updates.push({ dbId: db.id, data });
        }
      }
      
      if (results.length === 0 || remaining === 0) hasMore = false;
      else { cursor += results.length; await sleep(200); }
    }

    // Fetch OT records
    cursor = 0;
    hasMore = true;
    const updatedIds = new Set(updates.map(u => u.dbId));
    while (hasMore) {
      const constraints = JSON.stringify([
        { key: "OT minutes approved", constraint_type: "greater than", value: 0 }
      ]);
      const url = `${baseUrl}/clock-in?limit=100&cursor=${cursor}&constraints=${encodeURIComponent(constraints)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) break;
      const json = await res.json();
      const results = json.response?.results || [];
      const remaining = json.response?.remaining || 0;
      
      for (const r of results) {
        const db = dbMap[r._id];
        if (!db) continue;
        const bOT = r["OT minutes approved"] || 0;
        const bLate = r["Late minutes"] || 0;
        
        // Check if already in updates list
        const existingUpdate = updates.find(u => u.dbId === db.id);
        if (existingUpdate) {
          if (bOT > 0) existingUpdate.data.ot_minutes = bOT;
        } else if (db.ot_minutes !== bOT) {
          const data = { ot_minutes: bOT };
          if (bLate > 0 && db.late_minutes !== bLate) data.late_minutes = bLate;
          updates.push({ dbId: db.id, data });
        }
      }
      
      if (results.length === 0 || remaining === 0) hasMore = false;
      else { cursor += results.length; await sleep(200); }
    }

    console.log(`Total updates needed: ${updates.length}`);

    // Apply updates with aggressive rate limiting (10 per batch, 3s pause)
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < updates.length; i++) {
      const u = updates[i];
      try {
        await base44.asServiceRole.entities.BubbleClockin.update(u.dbId, u.data);
        updated++;
      } catch (err) {
        if (err.message?.includes('Rate limit') || err.message?.includes('429')) {
          console.log(`Rate limited at ${updated}, waiting 15s...`);
          await sleep(15000);
          try {
            await base44.asServiceRole.entities.BubbleClockin.update(u.dbId, u.data);
            updated++;
          } catch (err2) {
            errors++;
          }
        } else {
          errors++;
        }
      }
      
      // 10 per batch, then 3s wait
      if ((i + 1) % 10 === 0) {
        await sleep(3000);
      }
    }

    console.log(`Done. Updated: ${updated}, Errors: ${errors}`);

    return Response.json({
      success: true,
      totalNeeded: updates.length,
      updated,
      errors,
      remaining: updates.length - updated - errors,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});