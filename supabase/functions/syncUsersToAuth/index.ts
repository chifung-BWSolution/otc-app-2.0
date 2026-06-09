import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all users from the user table that have emails
    const { data: users, error: fetchError } = await supabase
      .from("user")
      .select("email, full_name, role")
      .not("email", "is", null)
      .neq("email", "")
      .eq("account_status", "Active");

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of users || []) {
      if (!user.email) continue;
      
      const email = user.email.trim().toLowerCase();
      
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name || "",
          },
        });

        if (error) {
          if (error.message?.includes("already been registered") || error.message?.includes("already exists")) {
            results.push({ email, status: "already_exists" });
          } else {
            results.push({ email, status: "error", error: error.message });
          }
        } else {
          results.push({ email, status: "created" });
        }
      } catch (e) {
        results.push({ email, status: "error", error: e.message });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const existing = results.filter(r => r.status === "already_exists").length;
    const errors = results.filter(r => r.status === "error").length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total: results.length, created, already_exists: existing, errors },
        details: results,
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
