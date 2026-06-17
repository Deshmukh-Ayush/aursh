import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendProjectInvitationEmail(
  email: string,
  projectName: string,
  inviteLink: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Aursh <onboarding@resend.dev>", // Using Resend's testing domain by default
      to: email,
      subject: `You have been invited to join ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Project Invitation</h2>
          <p>You have been invited to join the project <strong>${projectName}</strong> on Aursh.</p>
          <p>Click the link below to accept the invitation and access the workspace:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Accept Invitation
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
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
