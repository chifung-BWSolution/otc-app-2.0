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
    const typeName = body.typeName || "clock-in";
    const limit = body.limit || 5;
    const cursor = body.cursor || 0;

    const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');
    const url = `${baseUrl}/${typeName}?limit=${limit}&cursor=${cursor}`;
    
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
    const count = json.response?.count || 0;

    // Collect all unique keys across all records
    const allKeys = new Set();
    for (const r of results) {
      for (const key of Object.keys(r)) {
        allKeys.add(key);
      }
    }

    // Build field summary: for each key, show type and a sample value
    const fieldSummary = {};
    for (const key of [...allKeys].sort()) {
      const sampleRecord = results.find(r => r[key] !== null && r[key] !== undefined && r[key] !== "");
      const sampleVal = sampleRecord ? sampleRecord[key] : null;
      const valType = sampleVal === null ? "null" : Array.isArray(sampleVal) ? "array" : typeof sampleVal;
      
      // Truncate long values
      let displayVal = sampleVal;
      if (typeof sampleVal === "string" && sampleVal.length > 100) {
        displayVal = sampleVal.substring(0, 100) + "...";
      }
      if (Array.isArray(sampleVal) && sampleVal.length > 3) {
        displayVal = sampleVal.slice(0, 3).concat(["..."]);
      }

      fieldSummary[key] = { type: valType, sample: displayVal };
    }

    return Response.json({
      typeName,
      totalFetched: results.length,
      remaining,
      totalFields: allKeys.size,
      fieldSummary,
      rawRecords: results.slice(0, 3), // show first 3 raw records for inspection
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});