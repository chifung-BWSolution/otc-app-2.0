import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Simple CSV parser
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map(l => {
    const vals = parseLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
}

function transformRow(row, fieldMapping) {
  const result = {};
  for (const [fileField, dbField] of Object.entries(fieldMapping)) {
    if (!dbField) continue; // skip unmapped
    let val = row[fileField];
    if (val === undefined || val === null || val === "") continue;

    // Handle Bubble image URLs
    if (typeof val === "string" && val.startsWith("//")) {
      val = "https:" + val;
    }

    // Handle geographic_address type (Bubble returns {address, lat, lng})
    if (val && typeof val === "object" && "address" in val) {
      val = val.address || "";
    }

    result[dbField] = val;
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { entityName, fileUrl, fieldMapping, fileType } = await req.json();
    if (!entityName || !fileUrl || !fieldMapping) {
      return Response.json({ error: 'entityName, fileUrl, and fieldMapping are required' }, { status: 400 });
    }

    // 1. Fetch and parse the uploaded file
    const fileResp = await fetch(fileUrl);
    const text = await fileResp.text();

    let rows;
    if (fileType === "csv") {
      rows = parseCSV(text);
    } else {
      let rawData;
      try { rawData = JSON.parse(text); } catch {
        return Response.json({ error: 'Failed to parse file as JSON' }, { status: 400 });
      }
      rows = Array.isArray(rawData) ? rawData : (rawData.results || rawData.response?.results || []);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'No data rows found in file' }, { status: 400 });
    }

    // 2. Transform rows using the user-provided mapping
    const transformed = [];
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const t = transformRow(rows[i], fieldMapping);
        if (t && Object.keys(t).length > 0) transformed.push(t);
        else errors.push({ row: i, error: "no mapped fields had values" });
      } catch (e) {
        errors.push({ row: i, error: e.message });
      }
    }

    // 3. Delete all existing records (overwrite mode)
    const entity = base44.asServiceRole.entities[entityName];
    if (!entity) {
      return Response.json({ error: `Entity ${entityName} not found in SDK` }, { status: 400 });
    }

    // Helper: retry with exponential backoff on rate limit
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const withRetry = async (fn, retries = 8) => {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try { return await fn(); }
        catch (e) {
          if (e.status === 429 && attempt < retries) {
            const wait = Math.min(3000 * Math.pow(2, attempt), 30000);
            console.log(`Rate limited, waiting ${wait}ms (attempt ${attempt + 1}/${retries})`);
            await sleep(wait);
            continue;
          }
          throw e;
        }
      }
    };

    // 3a. Collect all existing record IDs
    let existingIds = [];
    let offset = 0;
    const batchSize = 100;
    while (true) {
      await sleep(200);
      const batch = await withRetry(() => entity.filter({}, 'created_date', batchSize, offset));
      if (!batch || batch.length === 0) break;
      existingIds.push(...batch.map(r => r.id));
      if (batch.length < batchSize) break;
      offset += batchSize;
    }
    console.log(`Found ${existingIds.length} existing records to delete`);

    // 3b. Delete records one by one with mandatory delay between each
    let deleted = 0;
    for (let i = 0; i < existingIds.length; i++) {
      await withRetry(() => entity.delete(existingIds[i]));
      deleted++;
      // Mandatory delay after every single delete
      await sleep(100);
      // Extra pause every 10 deletes
      if (deleted % 10 === 0) await sleep(1000);
    }
    console.log(`Deleted ${deleted} records`);

    // 4. Insert new records in small batches with delays
    let created = 0;
    const insertBatch = 20;
    for (let i = 0; i < transformed.length; i += insertBatch) {
      const batch = transformed.slice(i, i + insertBatch);
      await withRetry(() => entity.bulkCreate(batch));
      created += batch.length;
      // Mandatory delay between every batch
      await sleep(300);
      // Extra pause every 5 batches
      if ((Math.floor(i / insertBatch) + 1) % 5 === 0) await sleep(1500);
    }
    console.log(`Created ${created} records`);

    return Response.json({
      success: true,
      deleted,
      created,
      totalInFile: rows.length,
      transformErrors: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("importBubbleData error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});