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

    // 1. Load ALL DB bubble_ids
    console.log("Loading DB bubble_ids...");
    const dbIds = new Set();
    const pageSize = 5000;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'id', pageSize, offset);
      for (const r of batch) {
        if (r.bubble_id) dbIds.add(r.bubble_id);
      }
      offset += batch.length;
      if (batch.length < pageSize) hasMore = false;
      else await sleep(300);
    }
    console.log(`DB records with bubble_id: ${dbIds.size}`);

    // 2. Fetch ALL Bubble clockin _ids
    console.log("Fetching Bubble clockin IDs...");
    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
    const bubbleIds = [];
    let cursor = 0;
    while (true) {
      const url = `${baseUrl}/clock-in?limit=100&cursor=${cursor}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
      if (!res.ok) throw new Error(`Bubble API ${res.status}`);
      const json = await res.json();
      const results = json.response?.results || [];
      for (const r of results) {
        if (r._id) bubbleIds.push(r._id);
      }
      const remaining = json.response?.remaining || 0;
      if (remaining === 0 || results.length === 0) break;
      cursor += results.length;
      await sleep(150);
    }
    console.log(`Bubble total: ${bubbleIds.length}`);

    // 3. Find missing
    const missing = bubbleIds.filter(id => !dbIds.has(id));
    const extra = [...dbIds].filter(id => !bubbleIds.includes(id));

    console.log(`Missing from DB: ${missing.length}, Extra in DB: ${extra.length}`);

    return Response.json({
      bubbleTotal: bubbleIds.length,
      dbTotal: dbIds.size,
      missingFromDb: missing.length,
      extraInDb: extra.length,
      sampleMissing: missing.slice(0, 10),
    });
  } catch (error) {
    console.error("checkClockinGap error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});