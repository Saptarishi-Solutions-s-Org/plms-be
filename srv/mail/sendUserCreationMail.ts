import { sendMailCore } from "../lib/mail/core";
import { plmsBaseEmailTemplate } from "../lib/mail/template";

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
    const content = `
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
<b> Please Access the Application here : <br/>
  <a href="http://localhost:3000/${orgCode}/dashboard">
    Login to Dashboard
  </a>
</p>

<p>Regards,<br/>PLMS Team</p>
`;

    const html = plmsBaseEmailTemplate({
      title: "Welcome to PLMS",
      content,
    });

    await sendMailCore({
      to,
      subject: "Your Account Created",
      html,
    });

    console.log("USER MAIL SENT:", to);
  } catch (err) {
    console.error("USER MAIL ERROR:", err);
    throw err;
  }
};
