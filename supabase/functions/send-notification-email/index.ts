import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "cashback_confirmed" | "cashback_pending" | "referral_completed" | "withdrawal_processed";
  userId: string;
  data: {
    amount?: number;
    storeName?: string;
    referralName?: string;
    status?: string;
  };
}

const getEmailTemplate = (type: string, data: EmailRequest["data"]) => {
  switch (type) {
    case "cashback_confirmed":
      return {
        subject: `🎉 Your cashback of ₹${data.amount} is confirmed!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #10b981;">Cashback Confirmed!</h1>
            <p>Great news! Your cashback from <strong>${data.storeName}</strong> has been confirmed.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; color: #10b981; font-weight: bold; margin: 0;">₹${data.amount}</p>
              <p style="color: #666; margin: 10px 0 0;">has been added to your wallet</p>
            </div>
            <p>You can now withdraw this amount to your bank account or UPI.</p>
            <a href="${Deno.env.get("SITE_URL") || "https://paisewaala.lovable.app"}/dashboard" 
               style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
              View Dashboard
            </a>
          </div>
        `,
      };
    case "cashback_pending":
      return {
        subject: `🕐 Cashback of ₹${data.amount} is being processed`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f59e0b;">Cashback Pending</h1>
            <p>Your cashback from <strong>${data.storeName}</strong> is being tracked and processed.</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; color: #f59e0b; font-weight: bold; margin: 0;">₹${data.amount}</p>
              <p style="color: #666; margin: 10px 0 0;">is pending confirmation</p>
            </div>
            <p>This usually takes 30-90 days depending on the store's confirmation period.</p>
          </div>
        `,
      };
    case "referral_completed":
      return {
        subject: `🎁 You earned ₹${data.amount} from a referral!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6366f1;">Referral Bonus Earned!</h1>
            <p><strong>${data.referralName}</strong> signed up using your referral link and completed their first purchase.</p>
            <div style="background: #eef2ff; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; color: #6366f1; font-weight: bold; margin: 0;">₹${data.amount}</p>
              <p style="color: #666; margin: 10px 0 0;">referral bonus credited</p>
            </div>
            <p>Keep sharing your referral link to earn more!</p>
          </div>
        `,
      };
    case "withdrawal_processed":
      return {
        subject: `💸 Your withdrawal of ₹${data.amount} has been ${data.status}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: ${data.status === "completed" ? "#10b981" : "#ef4444"};">
              Withdrawal ${data.status === "completed" ? "Completed" : "Update"}
            </h1>
            <p>Your withdrawal request has been ${data.status}.</p>
            <div style="background: ${data.status === "completed" ? "#f0fdf4" : "#fef2f2"}; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <p style="font-size: 32px; color: ${data.status === "completed" ? "#10b981" : "#ef4444"}; font-weight: bold; margin: 0;">₹${data.amount}</p>
            </div>
            ${data.status === "completed" 
              ? "<p>The amount has been transferred to your registered payment method.</p>"
              : "<p>Please contact support if you have any questions.</p>"
            }
          </div>
        `,
      };
    default:
      return null;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ message: "Email service not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, userId, data }: EmailRequest = await req.json();

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      console.error("Failed to get user email:", userError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = getEmailTemplate(type, data);
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Invalid email type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PaiseWaala <notifications@resend.dev>",
        to: [userData.user.email],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Resend API error:", error);
      throw new Error("Failed to send email");
    }

    const result = await emailResponse.json();
    console.log("Email sent successfully:", result);

    // Create notification in database
    await supabase.from("notifications").insert({
      user_id: userId,
      title: template.subject.replace(/^[^\s]+ /, ""), // Remove emoji
      message: `${type.replace(/_/g, " ")} - ₹${data.amount}`,
      type: type,
      link: "/dashboard",
    });

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification-email:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
