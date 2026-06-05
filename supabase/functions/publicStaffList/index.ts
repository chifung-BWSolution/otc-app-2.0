import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Use service key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse optional filter from request body
    let filterTeams: string[] = [];
    try {
      const body = await req.json();
      if (body?.teams && Array.isArray(body.teams)) {
        filterTeams = body.teams;
      }
    } catch {
      // No body or invalid JSON - proceed without filter
    }

    const { data, error } = await supabase
      .from("staff")
      .select("id, bubble_id, chinese_name, display_name, full_name, team_name, n_bu, o_status")
      .eq("o_status", "Active")
      .order("display_name");

    if (error) {
      throw new Error(error.message);
    }

    // Map to consistent shape for frontend (no department exposed)
    let staffWithTeam = (data || []).map((s) => ({
      id: s.bubble_id || s.id,
      name_zh: s.chinese_name || s.display_name || s.full_name || "",
      name_en: s.full_name || s.display_name || "",
      _team: s.team_name || s.n_bu || "",
    }));

    // Apply team filter if provided
    if (filterTeams.length > 0) {
      staffWithTeam = staffWithTeam.filter((s) =>
        filterTeams.some((team) =>
          (s._team || "").toLowerCase() === team.toLowerCase()
        )
      );
    }

    // Strip internal _team field before returning
    const mapped = staffWithTeam.map(({ _team, ...rest }) => rest);

    return new Response(JSON.stringify({ data: mapped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
