import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  otp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp }: EmailRequest = await req.json();

    console.log(`Sending OTP to ${email}`);

    const gmailEmail = Deno.env.get("GMAIL_EMAIL");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!gmailEmail || !gmailPassword) {
      throw new Error("Gmail credentials not configured");
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: gmailEmail,
          password: gmailPassword,
        },
      },
    });

    await client.send({
      from: gmailEmail,
      to: email,
      subject: "Your Verification Code - Storify",
      content: `Hello,

      Your one-time password (OTP) for Storify is:${otp}

      This code will expire in 10 minutes.

      If you didn't request this code, please ignore this email.

    Best regards,
    Storify Team`,
    });

    await client.close();

    console.log(`OTP email sent successfully to ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
