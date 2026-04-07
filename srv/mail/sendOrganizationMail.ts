require("dotenv").config();

const { Resend } = require("resend");
import { OrgMailParams } from "../types/mail";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.APP_URL;

module.exports = async function sendOrganizationMail({
  to,
  orgName,
  orgCode,
}: OrgMailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Saptarishi Solutions PVT LTD <noreply@plms.swiftproject.in>",
      to,
      subject: "Your Organization Created Successfully",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Organization Created</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0">

          <tr>
            <td align="center" style="padding:22px 0 8px;">
              <img src="https://dmdfe.vercel.app/saptarishi.png" width="160"/>
            </td>
          </tr>

          <tr>
            <td align="center">
              <h2>Organization Created</h2>
            </td>
          </tr>

          <tr>
            <td style="border-top:6px solid #7c83ff;"></td>
          </tr>

          <tr>
            <td style="padding:24px; font-size:15px; color:#374151;">
              <p><strong>Organization Name:</strong> ${orgName}</p>
              <p><strong>Organization Code:</strong> ${orgCode}</p>

              <p>Your organization has been successfully created in <strong>PLMS</strong>.</p>

              <p>
                Access your dashboard:<br/>
                <a href="${APP_URL}/${orgCode}" target="_blank">
                  ${APP_URL}/${orgCode}
                </a>
              </p>

              <p>
                Regards,<br/>
                <strong>PLMS Team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="background:#7c83ff; color:#fff; padding:12px;">
              © ${new Date().getFullYear()} Saptarishi Solutions
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`,
    });

    if (error) throw error;

    console.log("ORG MAIL SENT:", data.id);
  } catch (err) {
    console.error("MAIL ERROR:", err);
  }
};
