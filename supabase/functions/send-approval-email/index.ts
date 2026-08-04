// @ts-ignore: Deno URL imports are not recognized by standard TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore: Deno global is not recognized by standard TypeScript
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req: Request) => {
  try {
    const { record } = await req.json();

    // Verify status changed to approved
    if (record.verification_status !== "approved") {
      return new Response(JSON.stringify({ message: "Not an approval event" }), { status: 200 });
    }

    // Send email via Resend API
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "KTU Housing Portal <notifications@yourdomain.com>", // or 'onboarding@resend.dev' during testing
        to: [record.email],
        subject: "Verification Approved - KTU Housing Portal",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #f97316;">Congratulations, ${record.full_name || 'Landlord'}!</h2>
            <p>Your landlord verification documents have been reviewed and <strong>approved</strong> by the admin team.</p>
            <p>You can now log in to your account and start posting hostel listings on the KTU Housing Portal.</p>
            <a href="https://ktu-hostel-system.vercel.app/dashboard" 
               style="background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">
               Go to Dashboard
            </a>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
