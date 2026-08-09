import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function sendProjectInvitationEmail(
  email: string,
  projectName: string,
  inviteLink: string,
  orgPlan: "free" | "freelancer" | "agency" | undefined = "free",
  orgLogo?: string | null
) {
  try {
    const safeProjectName = escapeHtml(projectName);
    const safeInviteLink = escapeHtml(inviteLink);
    const safeLogoUrl = safeImageUrl(orgLogo);
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Scrunity <noreply@scrunity.com>",
      replyTo: "support@scrunity.com",
      to: email,
      subject: `You have been invited to join ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${orgPlan !== "free" && safeLogoUrl ? `<img src="${escapeHtml(safeLogoUrl)}" alt="Logo" style="max-height: 40px; margin-bottom: 20px;" />` : ''}
          <h2 style="margin-top: 0;">Project Invitation</h2>
          <p>You have been invited to join the project <strong>${safeProjectName}</strong>.</p>
          <p>Click the link below to accept the invitation and access the project:</p>
          <a href="${safeInviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #111111; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold;">
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

export async function sendActivityNotificationEmail(
  email: string,
  projectName: string,
  activityMessage: string,
  projectId: string,
  orgPlan: "free" | "freelancer" | "agency" | undefined = "free",
  orgLogo?: string | null
) {
  const primaryColor = "#111111";
  const showBranding = orgPlan !== "free" && orgLogo;
  
  const baseUrl = process.env.BETTER_AUTH_URL 
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));

  const safeProjectName = escapeHtml(projectName);
  const safeActivityMessage = escapeHtml(activityMessage);
  const safeLogoUrl = safeImageUrl(orgLogo);
  const safeBaseUrl = escapeHtml(baseUrl);
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <body style="margin: 0; padding: 40px 20px; background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #111111;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto;">
        <tr>
          <td style="background-color: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 12px; padding: 40px; box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.02);">
             ${showBranding && safeLogoUrl ? `<img src="${escapeHtml(safeLogoUrl)}" alt="Logo" style="height: 32px; max-width: 140px; object-fit: contain; margin-bottom: 32px; display: block;" />` : `<div style="font-size: 16px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 32px; color: #111111;">Scrunity</div>`}
            
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: #111111; line-height: 1.3;">
               New update in ${safeProjectName}
            </h2>
            
            <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #555555;">
               ${safeActivityMessage}
            </p>
            
             <a href="${safeBaseUrl}/projects/${encodeURIComponent(projectId)}" style="display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; letter-spacing: -0.01em;">
              View Project
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 24px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999999; line-height: 1.5;">
               You received this email because you're a member of ${safeProjectName}.
            </p>
            ${orgPlan === "free" ? `
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #999999;">
                 Powered by <a href="${safeBaseUrl}" style="color: #666666; text-decoration: none; font-weight: 500;">Scrunity</a>
              </p>
            ` : ""}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Scrunity <noreply@scrunity.com>",
      replyTo: "support@scrunity.com",
      to: email,
      subject: `Update on ${projectName}`,
      html,
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
