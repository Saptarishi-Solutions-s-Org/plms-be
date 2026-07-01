"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetMail = void 0;
const core_1 = require("../lib/mail/core");
const template_1 = require("../lib/mail/template");
const sendPasswordResetMail = async ({ to, name, resetUrl, }) => {
    try {
        console.log("PASSWORD RESET MAIL CALLED FOR:", to);
        const content = `
<p style="margin:0 0 8px; font-weight:600;">Dear ${name},</p>

<p style="margin:0 0 8px;">
  We received a request to reset your password for your
  <strong>PLMS account</strong>.
</p>

<p style="margin:0 0 12px;">
  Click the button below to set a new password:
</p>

<p style="text-align:center; margin:20px 0;">
  <a
    href="${resetUrl}"
    target="_blank"
    style="
      background-color:#2563eb;
      color:#ffffff;
      padding:12px 26px;
      border-radius:6px;
      text-decoration:none;
      font-weight:600;
      display:inline-block;
      font-size:15px;
    "
  >
    Reset Password
  </a>
</p>

<p style="margin:0 0 8px;">
  This link expires in 30 minutes and can be used only once.
</p>

<p style="margin:0 0 8px;">
  If you did not request a password reset, please ignore this email.
  Your account remains secure.
</p>

<p style="margin:0 0 10px;">
  If you experience any issues or did not request this password reset,
  please contact your system administrator.
</p>

<p style="margin:0 0 10px;">
  If the button above does not work, copy and paste this link into your browser:
</p>

<p style="word-break:break-all;">
  <a href="${resetUrl}" style="color:#2563eb;">
    ${resetUrl}
  </a>
</p>

<p style="margin:12px 0 0;">
  Best regards,<br/>
  <strong>PLMS Admin Team</strong>
</p>
`;
        const html = (0, template_1.plmsBaseEmailTemplate)({
            title: "Password Reset Request",
            content,
        });
        await (0, core_1.sendMailCore)({
            to,
            subject: "Reset your PLMS password",
            html,
        });
        console.log("PASSWORD RESET MAIL SENT:", to);
    }
    catch (err) {
        console.error("PASSWORD RESET MAIL ERROR:", err);
        throw err;
    }
};
exports.sendPasswordResetMail = sendPasswordResetMail;
