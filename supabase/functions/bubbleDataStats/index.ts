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

// Columns to skip in field stats (internal/system columns)
const SKIP_COLUMNS = new Set(["id", "created_at", "updated_at", "created_date", "modified_date", "updated_date", "base44_id"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { entityName } = await req.json();

    if (!entityName || !TABLE_MAP[entityName]) {
      return new Response(
        JSON.stringify({ error: `Unknown entity: ${entityName}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const tableName = TABLE_MAP[entityName];

    // Get total count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (countError) {
      return new Response(
        JSON.stringify({ error: `Count error: ${countError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const totalCount = count || 0;

    // Get column info by fetching a sample of rows to determine which columns exist
    // First, get one row to discover columns
    const { data: sampleRow, error: sampleError } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);

    if (sampleError) {
      return new Response(
        JSON.stringify({ error: `Sample error: ${sampleError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const fields: Record<string, { filled: number; empty: number }> = {};

    if (sampleRow && sampleRow.length > 0) {
      const columns = Object.keys(sampleRow[0]).filter(col => !SKIP_COLUMNS.has(col));

      // For each column, count non-null AND non-empty-string values
      // This aligns with Bubble's "is_not_empty" constraint which excludes both null and ""
      for (const col of columns) {
        try {
          // First try: exclude both null and empty string (for text columns)
          const { count: filledCount, error: fErr } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })
            .not(col, "is", null)
            .neq(col, "");

          if (!fErr) {
            const filled = filledCount || 0;
            fields[col] = { filled, empty: totalCount - filled };
          } else {
            // Fallback for non-text columns: just count non-null
            // .neq with "" fails on integer/boolean/timestamp columns
            const { count: filledCount2, error: fErr2 } = await supabase
              .from(tableName)
              .select("*", { count: "exact", head: true })
              .not(col, "is", null);
            if (!fErr2) {
              const filled = filledCount2 || 0;
              fields[col] = { filled, empty: totalCount - filled };
            }
          }
        } catch (e) {
          // Last resort fallback
          try {
            const { count: filledCount3, error: fErr3 } = await supabase
              .from(tableName)
              .select("*", { count: "exact", head: true })
              .not(col, "is", null);
            if (!fErr3) {
              const filled = filledCount3 || 0;
              fields[col] = { filled, empty: totalCount - filled };
            }
          } catch {
            // Skip entirely
          }
        }
      }
    }

    // Include debug info about columns discovered vs successfully counted
    const allColumns = (sampleRow && sampleRow.length > 0)
      ? Object.keys(sampleRow[0]).filter(col => !SKIP_COLUMNS.has(col))
      : [];
    const countedColumns = Object.keys(fields);
    const skippedColumns = allColumns.filter(col => !fields[col]);

    return new Response(
      JSON.stringify({
        data: {
          totalCount,
          fields,
          _debug: {
            columnsDiscovered: allColumns.length,
            columnsCounted: countedColumns.length,
            skippedColumns,
          },
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
