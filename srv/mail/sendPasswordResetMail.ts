import { sendMailCore } from "../lib/mail/core";
import { plmsBaseEmailTemplate } from "../lib/mail/template";

export const sendPasswordResetMail = async ({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) => {
  try {
    const content = `
<p><b>Dear ${name},</b></p>

<p>We received a request to reset your password.</p>

<p>
  <a href="${resetUrl}">
    Reset Password
  </a>
</p>

<p>This link expires in 30 minutes and can be used only once.</p>

<p>If you did not request this, you can safely ignore this email.</p>

<p>Regards,<br/>PLMS Team</p>
`;

    const html = plmsBaseEmailTemplate({
      title: "Reset Password",
      content,
    });

    await sendMailCore({
      to,
      subject: "Reset your PLMS password",
      html,
    });

    console.log("PASSWORD RESET MAIL SENT:", to);
  } catch (err) {
    console.error("PASSWORD RESET MAIL ERROR:", err);
    throw err;
  }
};
