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

    const { email, full_name, role } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Step 1: Create the auth user (or get existing one)
    // Using admin API to create a user that can login via OTP
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      email_confirm: true, // auto-confirm email so OTP works immediately
      user_metadata: {
        full_name: full_name || "",
      },
    });

    if (authError) {
      // If user already exists in auth, that's OK - just ensure the user table record exists
      if (authError.message?.includes("already been registered") || authError.message?.includes("already exists")) {
        // User already exists in auth - just make sure user table is synced
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const found = existingUser?.users?.find((u: any) => u.email?.toLowerCase() === email.trim().toLowerCase());
        
        if (found) {
          // Ensure user table record exists
          const { data: existingRecord } = await supabase
            .from("user")
            .select("id")
            .eq("email", email.trim().toLowerCase())
            .maybeSingle();

          if (!existingRecord) {
            await supabase.from("user").insert({
              email: email.trim().toLowerCase(),
              full_name: full_name || "",
              role: role || "user",
              account_status: "Active",
            });
          }

          return new Response(
            JSON.stringify({ success: true, message: "User already exists in auth, synced to user table", authUserId: found.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }

      return new Response(
        JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Step 2: Also ensure the user table record exists
    const { data: existingRecord } = await supabase
      .from("user")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (!existingRecord) {
      await supabase.from("user").insert({
        email: email.trim().toLowerCase(),
        full_name: full_name || "",
        role: role || "user",
        account_status: "Active",
      });
    }

    return new Response(
      JSON.stringify({ success: true, authUserId: authData.user?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
