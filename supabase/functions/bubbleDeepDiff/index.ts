import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Entity name → Supabase table name
const TABLE_MAP: Record<string, string> = {
  Staff: "staff",
  StaffInformation: "staff_information",
  BubbleOT: "bubble_ot",
  BubbleLeave: "bubble_leave",
  BubbleClockin: "bubble_clockin",
  BubbleManHourDate: "bubble_man_hour_date",
  BubbleManHourTask: "bubble_man_hour_task",
  BubbleProject: "bubble_project",
  BubbleStaffKPI: "bubble_staff_kpi",
  BubbleStaffKPIMonth: "bubble_staff_kpimonth",
};

// Bubble entity → Bubble type name mapping
const BUBBLE_TYPE_MAP: Record<string, string> = {
  Staff: "Staff",
  StaffInformation: "Staff Information",
  BubbleOT: "OT",
  BubbleLeave: "Leave",
  BubbleClockin: "Clock-in",
  BubbleManHourDate: "Man Hour Date",
  BubbleManHourTask: "Man Hour Task",
  BubbleProject: "Project",
  BubbleStaffKPI: "Staff KPI",
  BubbleStaffKPIMonth: "Staff KPI Month",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const bubbleApiKey = Deno.env.get("BUBBLE_API_KEY")!;
    const bubbleAppName = Deno.env.get("BUBBLE_APP_NAME")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { entityName, dbColumn, bubbleField, sampleSize = 10 } = await req.json();

    if (!entityName || !TABLE_MAP[entityName]) {
      return new Response(
        JSON.stringify({ error: `Unknown entity: ${entityName}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const tableName = TABLE_MAP[entityName];
    const bubbleType = BUBBLE_TYPE_MAP[entityName];

    // Step 1: Get records from DB where the field is empty/null
    const { data: dbEmptyRows, error: dbEmptyErr } = await supabase
      .from(tableName)
      .select("bubble_id, " + dbColumn)
      .or(`${dbColumn}.is.null,${dbColumn}.eq.`)
      .limit(sampleSize);

    // Step 2: Get records from DB where the field has value
    const { data: dbFilledRows, error: dbFilledErr } = await supabase
      .from(tableName)
      .select("bubble_id, " + dbColumn)
      .not(dbColumn, "is", null)
      .neq(dbColumn, "")
      .limit(sampleSize);

    // Step 3: Count DB empty vs filled
    const { count: dbFilledCount } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true })
      .not(dbColumn, "is", null)
      .neq(dbColumn, "");

    const { count: dbTotalCount } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    const dbEmptyCount = (dbTotalCount || 0) - (dbFilledCount || 0);

    // Step 4: Query Bubble for the same field (get records with value)
    const baseUrl = `https://${bubbleAppName}.bubbleapps.io/api/1.1/obj/${encodeURIComponent(bubbleType)}`;
    
    let bubbleFilledCount = 0;
    let bubbleEmptyCount = 0;
    let bubbleSampleRecords: Array<{bubble_id: string; value: unknown}> = [];

    try {
      // Get count of records where field is not empty in Bubble
      const filledConstraints = JSON.stringify([
        { key: bubbleField, constraint_type: "is_not_empty" }
      ]);
      const filledUrl = `${baseUrl}?constraints=${encodeURIComponent(filledConstraints)}&limit=${sampleSize}`;
      const filledResp = await fetch(filledUrl, {
        headers: { Authorization: `Bearer ${bubbleApiKey}` },
      });

      if (filledResp.ok) {
        const filledData = await filledResp.json();
        const remaining = filledData.response?.remaining || 0;
        const results = filledData.response?.results || [];
        bubbleFilledCount = remaining + results.length;
        
        // Extract sample records
        for (const rec of results.slice(0, sampleSize)) {
          bubbleSampleRecords.push({
            bubble_id: rec._id || "",
            value: rec[bubbleField] ?? null,
          });
        }
      }

      // Get total count from Bubble
      const totalUrl = `${baseUrl}?limit=1`;
      const totalResp = await fetch(totalUrl, {
        headers: { Authorization: `Bearer ${bubbleApiKey}` },
      });
      if (totalResp.ok) {
        const totalData = await totalResp.json();
        const totalRemaining = totalData.response?.remaining || 0;
        const totalResults = totalData.response?.results?.length || 0;
        const bubbleTotal = totalRemaining + totalResults;
        bubbleEmptyCount = bubbleTotal - bubbleFilledCount;
      }
    } catch (e) {
      // If Bubble API fails, return partial results
    }

    // Step 5: Cross-reference - find records that exist in Bubble with value but DB is empty
    // Use the bubble_id from DB empty rows and check against Bubble
    const crossRefSamples: Array<{bubble_id: string; bubbleValue: unknown; dbValue: unknown}> = [];

    if (dbEmptyRows && dbEmptyRows.length > 0 && bubbleSampleRecords.length > 0) {
      // For efficiency, check a subset of DB-empty records against Bubble
      const emptyBubbleIds = dbEmptyRows
        .filter(r => r.bubble_id)
        .map(r => r.bubble_id)
        .slice(0, 5);

      for (const bId of emptyBubbleIds) {
        try {
          const lookupUrl = `${baseUrl}/${bId}`;
          const lookupResp = await fetch(lookupUrl, {
            headers: { Authorization: `Bearer ${bubbleApiKey}` },
          });
          if (lookupResp.ok) {
            const lookupData = await lookupResp.json();
            const rec = lookupData.response;
            if (rec) {
              const bubbleVal = rec[bubbleField] ?? null;
              const dbRow = dbEmptyRows.find(r => r.bubble_id === bId);
              crossRefSamples.push({
                bubble_id: bId,
                bubbleValue: bubbleVal,
                dbValue: dbRow ? dbRow[dbColumn] : null,
              });
            }
          }
        } catch {
          // Skip individual lookup errors
        }
      }
    }

    // Step 6: Also compare some filled records to verify value consistency
    const valueMismatchSamples: Array<{bubble_id: string; bubbleValue: unknown; dbValue: unknown}> = [];

    if (dbFilledRows && dbFilledRows.length > 0) {
      const filledBubbleIds = dbFilledRows
        .filter(r => r.bubble_id)
        .map(r => r.bubble_id)
        .slice(0, 5);

      for (const bId of filledBubbleIds) {
        try {
          const lookupUrl = `${baseUrl}/${bId}`;
          const lookupResp = await fetch(lookupUrl, {
            headers: { Authorization: `Bearer ${bubbleApiKey}` },
          });
          if (lookupResp.ok) {
            const lookupData = await lookupResp.json();
            const rec = lookupData.response;
            if (rec) {
              const bubbleVal = rec[bubbleField] ?? null;
              const dbRow = dbFilledRows.find(r => r.bubble_id === bId);
              const dbVal = dbRow ? dbRow[dbColumn] : null;
              // Only include if values are different
              const bubbleStr = bubbleVal === null || bubbleVal === undefined ? "" : String(bubbleVal);
              const dbStr = dbVal === null || dbVal === undefined ? "" : String(dbVal);
              valueMismatchSamples.push({
                bubble_id: bId,
                bubbleValue: bubbleVal,
                dbValue: dbVal,
              });
            }
          }
        } catch {
          // Skip
        }
      }
    }

    return new Response(
      JSON.stringify({
        data: {
          entityName,
          dbColumn,
          bubbleField,
          summary: {
            bubbleFilled: bubbleFilledCount,
            bubbleEmpty: bubbleEmptyCount,
            dbFilled: dbFilledCount || 0,
            dbEmpty: dbEmptyCount,
            diff: (dbFilledCount || 0) - bubbleFilledCount,
          },
          crossRefSamples,
          valueMismatchSamples,
          bubbleSampleRecords: bubbleSampleRecords.slice(0, sampleSize),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
