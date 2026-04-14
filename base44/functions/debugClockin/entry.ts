import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "findLateMinutes";

    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');

    if (action === "findLateMinutes") {
      // Search for clockin records with Late minutes > 0
      const constraints = JSON.stringify([
        { key: "Late minutes", constraint_type: "greater than", value: 0 }
      ]);
      const url = `${baseUrl}/clock-in?limit=5&cursor=0&constraints=${encodeURIComponent(constraints)}`;
      console.log("URL:", url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        return Response.json({ error: `Bubble API: ${res.status}`, body: txt.substring(0, 500) });
      }
      const json = await res.json();
      const results = json.response?.results || [];
      const remaining = json.response?.remaining || 0;
      
      return Response.json({
        action,
        found: results.length,
        remaining,
        totalWithLateMinutes: results.length + remaining,
        records: results.map(r => ({
          _id: r._id,
          "Late minutes": r["Late minutes"],
          "Late Minutes": r["Late Minutes"],
          "OT minutes approved": r["OT minutes approved"],
          "OT Minutes Approved": r["OT Minutes Approved"],
          "Clock In Time": r["Clock In Time"],
          "Staff": r["Staff"],
          allKeys: Object.keys(r).sort()
        }))
      });
    }

    if (action === "findOTMinutes") {
      const constraints = JSON.stringify([
        { key: "OT minutes approved", constraint_type: "greater than", value: 0 }
      ]);
      const url = `${baseUrl}/clock-in?limit=5&cursor=0&constraints=${encodeURIComponent(constraints)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        return Response.json({ error: `Bubble API: ${res.status}`, body: txt.substring(0, 500) });
      }
      const json = await res.json();
      const results = json.response?.results || [];
      const remaining = json.response?.remaining || 0;
      
      return Response.json({
        action,
        found: results.length,
        remaining,
        totalWithOTMinutes: results.length + remaining,
        records: results.map(r => ({
          _id: r._id,
          "Late minutes": r["Late minutes"],
          "OT minutes approved": r["OT minutes approved"],
          "OT Minutes Approved": r["OT Minutes Approved"],
          "Clock In Time": r["Clock In Time"],
          "Staff": r["Staff"],
          allKeys: Object.keys(r).sort()
        }))
      });
    }

    if (action === "checkDbLate") {
      // Find DB records where late_minutes > 0
      const records = await base44.asServiceRole.entities.BubbleClockin.filter(
        { late_minutes: { $gt: 0 } }, '-late_minutes', 10
      );
      return Response.json({
        action,
        found: records.length,
        records: records.map(r => ({
          id: r.id,
          bubble_id: r.bubble_id,
          late_minutes: r.late_minutes,
          ot_minutes: r.ot_minutes,
          clockin_time: r.clockin_time,
          staff_id: r.staff_id
        }))
      });
    }

    if (action === "rawRecord") {
      // Fetch a specific bubble record by _id
      const bubbleId = body.bubbleId;
      if (!bubbleId) return Response.json({ error: "bubbleId required" });
      const constraints = JSON.stringify([
        { key: "_id", constraint_type: "equals", value: bubbleId }
      ]);
      const url = `${baseUrl}/clock-in?limit=1&cursor=0&constraints=${encodeURIComponent(constraints)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        return Response.json({ error: `Bubble API: ${res.status}`, body: txt.substring(0, 500) });
      }
      const json = await res.json();
      return Response.json({
        action,
        record: json.response?.results?.[0] || null
      });
    }

    if (action === "totalCount") {
      const res = await fetch(`${baseUrl}/clock-in?limit=1&cursor=0`, {
        headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
      });
      const json = await res.json();
      const total = (json.response?.results?.length || 0) + (json.response?.remaining || 0);
      
      // Count DB records
      let dbCount = 0;
      let hasMore = true;
      while (hasMore) {
        const batch = await base44.asServiceRole.entities.BubbleClockin.filter({}, 'id', 5000, dbCount);
        dbCount += batch.length;
        if (batch.length < 5000) hasMore = false;
      }
      
      return Response.json({ bubbleTotal: total, dbTotal: dbCount, diff: dbCount - total });
    }

    return Response.json({ error: "Unknown action" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});