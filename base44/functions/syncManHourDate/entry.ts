import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchAllFromBubble(typeName) {
  const results = [];
  let cursor = 0;
  const limit = 100;
  const baseUrl = BUBBLE_API_URL.replace(/\/$/, '');

  while (true) {
    const url = `${baseUrl}/${typeName}?limit=${limit}&cursor=${cursor}`;
    console.log(`Fetching ${typeName}: cursor=${cursor}`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` } });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Bubble API error ${res.status}: ${txt.substring(0, 200)}`);
    }
    const json = await res.json();
    const items = json.response?.results || [];
    results.push(...items);
    const remaining = json.response?.remaining || 0;
    console.log(`Fetched ${results.length}, remaining: ${remaining}`);
    if (remaining === 0 || items.length === 0) break;
    cursor += items.length;
    await sleep(200);
  }
  return results;
}

function mapManHourDate(r, staffNameMap) {
  const staffId = r["Staff"] || "";
  return {
    bubble_id: r._id,
    report_date: r["Report Date"] || "",
    staff_id: staffId,
    staff_name: staffNameMap[staffId] || "",
    total_work_hour: r["Total Work Hour"] ?? 0,
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

    // 1. Fetch Bubble data + Staff lookup for names
    console.log("Fetching Man Hour Date from Bubble...");
    const [bubbleRecords, staffList] = await Promise.all([
      fetchAllFromBubble("man_hour_date"),
      fetchAllFromBubble("Staff"),
    ]);
    console.log(`Bubble Man Hour Date: ${bubbleRecords.length}, Staff: ${staffList.length}`);

    // Build staff name map
    const staffNameMap = {};
    for (const s of staffList) {
      staffNameMap[s._id] = s["Display Name"] || s["Full Name"] || "";
    }

    // 2. Load existing DB records
    console.log("Loading existing DB records...");
    const allDb = [];
    const pageSize = 5000;
    let hasMore = true;
    while (hasMore) {
      const batch = await base44.asServiceRole.entities.BubbleManHourDate.filter({}, 'id', pageSize, allDb.length);
      allDb.push(...batch);
      if (batch.length < pageSize) hasMore = false;
      else await sleep(500);
    }
    console.log(`Existing DB records: ${allDb.length}`);

    // Build bubble_id -> DB record map
    const dbMap = {};
    for (const rec of allDb) {
      if (rec.bubble_id) dbMap[rec.bubble_id] = rec;
    }

    // 3. Compare and classify
    const toCreate = [];
    const toUpdate = [];
    let skipped = 0;

    for (const raw of bubbleRecords) {
      const mapped = mapManHourDate(raw, staffNameMap);
      if (!mapped.bubble_id) continue;

      const existing = dbMap[mapped.bubble_id];
      if (!existing) {
        toCreate.push(mapped);
      } else {
        // Check if any field changed
        const changed =
          existing.report_date !== mapped.report_date ||
          existing.staff_id !== mapped.staff_id ||
          existing.staff_name !== mapped.staff_name ||
          existing.total_work_hour !== mapped.total_work_hour;

        if (changed) {
          toUpdate.push({ id: existing.id, data: mapped });
        } else {
          skipped++;
        }
      }
    }

    console.log(`To create: ${toCreate.length}, To update: ${toUpdate.length}, Skipped: ${skipped}`);

    if (dryRun) {
      return Response.json({
        dryRun: true,
        bubbleTotal: bubbleRecords.length,
        dbTotal: allDb.length,
        toCreate: toCreate.length,
        toUpdate: toUpdate.length,
        skipped,
        sampleCreate: toCreate.slice(0, 3),
        sampleUpdate: toUpdate.slice(0, 3).map(u => ({ id: u.id, ...u.data })),
      });
    }

    // 4. Create new records in batches
    let created = 0;
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
            console.log(`Batch create error: ${e.message}`);
            // Try one-by-one
            for (const rec of batch) {
              try {
                await base44.asServiceRole.entities.BubbleManHourDate.create(rec);
                created++;
              } catch (e2) {
                console.log(`Single create error: ${e2.message}`);
              }
              await sleep(100);
            }
            success = true;
          }
        }
      }
      if ((Math.floor(i / 20) + 1) % 5 === 0) {
        console.log(`Created ${created}/${toCreate.length}`);
        await sleep(1000);
      } else {
        await sleep(300);
      }
    }

    // 5. Update changed records
    let updated = 0;
    for (let i = 0; i < toUpdate.length; i++) {
      const { id, data } = toUpdate[i];
      let retries = 0;
      let success = false;
      while (retries < 5 && !success) {
        try {
          await base44.asServiceRole.entities.BubbleManHourDate.update(id, data);
          updated++;
          success = true;
        } catch (e) {
          const is429 = e.status === 429 || (e.message || "").includes("Rate limit");
          if (is429 && retries < 4) {
            retries++;
            await sleep(Math.min(3000 * Math.pow(2, retries), 30000));
          } else {
            console.log(`Update error for ${id}: ${e.message}`);
            success = true;
          }
        }
      }
      await sleep(300);
      if ((i + 1) % 20 === 0) {
        console.log(`Updated ${updated}/${toUpdate.length}`);
        await sleep(1000);
      }
    }

    console.log(`Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);

    return Response.json({
      success: true,
      bubbleTotal: bubbleRecords.length,
      dbTotal: allDb.length,
      created,
      updated,
      skipped,
    });
  } catch (error) {
    console.error("syncManHourDate error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});