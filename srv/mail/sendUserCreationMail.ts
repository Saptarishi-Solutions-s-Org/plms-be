import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendUserCreationMail = async ({
  to,
  name,
  orgName,
  orgCode,
  email,
  password,
}: {
  to: string;
  name: string;
  orgName: string;
  orgCode: string;
  email: string;
  password: string;
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "PLMS <noreply@plms.swiftproject.in>",
      to,
      subject: "Your Account Created",
      html: `
<!DOCTYPE html>
<html>
<body style="font-family:Arial; background:#fff;">
  <table width="100%" align="center">
    <tr>
      <td align="center">

        <table width="600">

          <tr>
            <td align="center" style="padding:20px;">
              <img src="https://dmdfe.vercel.app/saptarishi.png" width="150"/>
            </td>
          </tr>

          <tr>
            <td align="center">
              <h2>Welcome to PLMS</h2>
            </td>
          </tr>

          <tr>
            <td style="border-top:5px solid #7c83ff;"></td>
          </tr>

          <tr>
            <td style="padding:25px;">
              <p><b>Dear ${name},</b></p>

              <p>Your account has been created successfully.</p>

              <p>
                <b>Organization:</b> ${orgName}<br/>
                <b>Org Code:</b> ${orgCode}
              </p>

              <p>
                <b>Email:</b> ${email}<br/>
                <b>Password:</b> ${password}
              </p>

              <p>
                <a href="http://localhost:3000/${orgCode}/dashboard">
                  Login to Dashboard
                </a>
              </p>

              <p>Regards,<br/>PLMS Team</p>
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

    console.log("USER MAIL SENT:", data?.id);
  } catch (err) {
    console.error("USER MAIL ERROR:", err);
    throw err;
  }
};
