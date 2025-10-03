import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify OTP from our custom table
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("otp_code", otp)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabaseAdmin
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpData.id);

    // Get the stored password
    const { data: credData } = await supabaseAdmin
      .from("user_credentials")
      .select("password_hash")
      .eq("email", email)
      .maybeSingle();

    const password = credData?.password_hash || otpData.password;

    // Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users?.find(u => u.email === email);

    if (existingUser) {
      // User exists, update their password to match our stored password
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: password,
      });
    } else {
      // Create new user with the password
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        user_metadata: { email_verified: true },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "OTP verified, please sign in with your credentials",
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});