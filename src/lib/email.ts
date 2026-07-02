import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendProjectInvitationEmail(
  email: string,
  projectName: string,
  inviteLink: string,
  orgPlan: "free" | "paid" = "free",
  orgLogo?: string | null,
  orgColor?: string | null
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Scrunity <onboarding@resend.dev>", // Using Resend's testing domain by default
      to: email,
      subject: `You have been invited to join ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${orgPlan === "paid" && orgLogo ? `<img src="${orgLogo}" alt="Logo" style="max-height: 40px; margin-bottom: 20px;" />` : ''}
          <h2 style="margin-top: 0;">Project Invitation</h2>
          <p>You have been invited to join the project <strong>${projectName}</strong>.</p>
          <p>Click the link below to accept the invitation and access the workspace:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: ${orgPlan === "paid" && orgColor ? orgColor : '#000'}; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">
            Accept Invitation
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
          ${orgPlan === "free" ? `
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center; font-size: 12px; color: #888;">
              Powered by <span style="font-weight: bold; color: #333;">Scrunity</span>
            </div>
          ` : ''}
        </div>
      `,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}
