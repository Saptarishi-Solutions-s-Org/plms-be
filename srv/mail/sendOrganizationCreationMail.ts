import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOrganizationCreationMail = async ({
  to,
  name,
  orgName,
  orgCode,
}: {
  to: string;
  name: string;
  orgName: string;
  orgCode: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "PLMS <noreply@plms.swiftproject.in>",
      to,
      subject: "Organization Created Successfully",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Organization Created</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">

          <tr>
            <td align="center" style="padding:22px 0 8px;">
              <img
                src="https://dmdfe.vercel.app/saptarishi.png"
                alt="PLMS"
                width="160"
                style="display:block;"
              />
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 0 10px;">
              <h2 style="margin:0; color:#111827;">Organization Created</h2>
            </td>
          </tr>

          <tr>
            <td style="border-top:6px solid #7c83ff;"></td>
          </tr>

          <tr>
            <td align="center" style="padding:22px 0;">
              <img
                src="https://dmdfe.vercel.app/security.png"
                alt="Organization Icon"
                width="110"
                style="display:block;"
              />
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px; color:#374151; font-size:15px; line-height:1.55;">
              <p style="margin:0 0 8px; font-weight:600;">
                Dear ${name},
              </p>

              <p style="margin:0 0 8px;">
                Your organization has been successfully created in <strong>PLMS</strong>.
              </p>

              <p style="margin:0 0 10px;">
                <strong>Organization Name:</strong> ${orgName}<br/>
                <strong>Organization Code:</strong>
                <span style="color:#2563eb;">${orgCode}</span>
              </p>

              <p style="margin:0 0 10px;">
                Please use this organization code while accessing your dashboard.
              </p>

              <p style="margin:0 0 10px;">
                <a
                  href="http://localhost:3000/${orgCode}/dashboard/organization"
                  target="_blank"
                  style="color:#2563eb; text-decoration:none; word-break:break-all;"
                >
                  Open Dashboard
                </a>
              </p>

              <p style="margin:0 0 10px;">
                If you need assistance, contact us at
                <a href="mailto:sriramgandrothu@gmail.com" style="color:#2563eb; text-decoration:none;">
                  sriramgandrothu@gmail.com
                </a>.
              </p>

              <p style="margin:0;">
                Best regards,<br/>
                <strong>PLMS Team</strong><br/>
                Saptarishi Solutions PVT LTD
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color:#7c83ff; padding:14px; color:#ffffff; font-size:13px;">
              © ${new Date().getFullYear()} Saptarishi Solutions PVT LTD
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

    console.log("ORG MAIL SENT:", data?.id);
  } catch (err) {
    console.error("ORG MAIL ERROR:", err);
    throw err;
  }
};
