import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Bubble entity → Bubble type name mapping
// Note: Bubble Data API type names are case-sensitive and match the "thing" name in Bubble editor
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
    const bubbleApiKey = Deno.env.get("BUBBLE_API_KEY");
    const bubbleAppName = Deno.env.get("BUBBLE_APP_NAME");

    if (!bubbleApiKey || !bubbleAppName) {
      return new Response(
        JSON.stringify({ error: "Missing BUBBLE_API_KEY or BUBBLE_APP_NAME env vars" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const results: Record<string, { bubbleTotalRows: number; error?: string }> = {};

    // Fetch row count for each entity from Bubble
    for (const [entityName, bubbleType] of Object.entries(BUBBLE_TYPE_MAP)) {
      try {
        const url = `https://${bubbleAppName}.bubbleapps.io/api/1.1/obj/${encodeURIComponent(bubbleType)}?limit=1`;
        console.log(`[bubbleTableInfo] Fetching ${entityName} from: ${url}`);
        const resp = await fetch(url, {
          headers: {
            Authorization: `Bearer ${bubbleApiKey}`,
          },
        });

        if (resp.ok) {
          const data = await resp.json();
          const remaining = data.response?.remaining ?? 0;
          const resultsCount = data.response?.results?.length ?? 0;
          // Bubble Data API: "remaining" = rows NOT in current page, "count" = rows in current page
          // Total rows = remaining + count (or remaining + resultsCount as fallback)
          const pageCount = data.response?.count ?? resultsCount;
          const totalRows = remaining + pageCount;
          console.log(`[bubbleTableInfo] ${entityName}: totalRows=${totalRows}, remaining=${remaining}, pageCount=${pageCount}, raw=`, JSON.stringify(data.response ? { remaining: data.response.remaining, count: data.response.count, resultsLen: data.response.results?.length } : data));
          results[entityName] = {
            bubbleTotalRows: totalRows,
          };
        } else {
          const errText = await resp.text().catch(() => "");
          const shortErr = errText.substring(0, 200);
          console.warn(`Bubble API error for ${bubbleType}: ${resp.status} - ${shortErr}`);
          results[entityName] = { bubbleTotalRows: 0, error: `HTTP ${resp.status}: ${shortErr}` };
        }
      } catch (e) {
        console.warn(`Failed to fetch Bubble info for ${entityName}:`, e);
        results[entityName] = { bubbleTotalRows: 0, error: e.message };
      }
    }

    return new Response(
      JSON.stringify({ data: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
