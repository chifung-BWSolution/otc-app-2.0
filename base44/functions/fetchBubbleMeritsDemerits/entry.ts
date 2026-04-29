import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const BUBBLE_API_URL = Deno.env.get("BUBBLE_API_URL");
    const BUBBLE_API_TOKEN = Deno.env.get("BUBBLE_API_TOKEN");

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "preview"; // "preview" or "import"

    // Fetch all from Bubble
    const url = `${BUBBLE_API_URL}/Merits%20And%20Demerits?limit=100`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${BUBBLE_API_TOKEN}` }
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return Response.json({ error: `Bubble API error: ${resp.status} ${errText}` }, { status: 500 });
    }

    const data = await resp.json();
    const results = data.response?.results || [];
    console.log(`Fetched ${results.length} records from Bubble`);

    // Map to entity fields
    // Also resolve staff names from Staff entity
    const staffIds = [...new Set(results.map(r => r.Staff).filter(Boolean))];
    const staffMap = {};
    if (staffIds.length > 0) {
      const allStaff = await base44.asServiceRole.entities.Staff.list("display_name", 2000);
      for (const s of allStaff) {
        if (s.bubble_id) staffMap[s.bubble_id] = s.display_name;
      }
    }

    const mapped = results.map(r => ({
      bubble_id: r._id || "",
      staff_id: r.Staff || "",
      staff_name: staffMap[r.Staff] || "",
      type: r.Type || "",
      brief_description: r["Brief description"] || "",
      detailed_description: r["Detailed description"] || "",
      event_date: r["Event Date"] || null,
      event_view_role: r["Event View Role"] || "",
      bubble_created_by: r["Created By"] || "",
      bubble_created_date: r["Created Date"] || null,
      bubble_modified_date: r["Modified Date"] || null,
    }));

    if (mode === "preview") {
      return Response.json({ count: mapped.length, records: mapped });
    }

    // Import mode: insert into entity
    let created = 0;
    let errors = 0;
    for (const rec of mapped) {
      try {
        await base44.asServiceRole.entities.BubbleMeritsDemerits.create(rec);
        created++;
      } catch (e) {
        errors++;
        console.log(`Error creating record: ${(e.message || "").substring(0, 100)}`);
      }
    }

    console.log(`Import done. Created: ${created}, Errors: ${errors}`);
    return Response.json({ success: true, created, errors, total: mapped.length });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});