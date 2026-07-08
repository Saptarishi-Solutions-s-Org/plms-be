"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUserCreationMail = void 0;
const core_1 = require("../lib/mail/core");
const template_1 = require("../lib/mail/template");
const sendUserCreationMail = async ({ to, name, orgName, orgCode, email, password, }) => {
    try {
        const frontendUrl = process.env.ALLOWED_ORIGINS?.split(",")[0]?.trim();
        const appUrl = process.env.APP_URL || frontendUrl || "";
        if (!appUrl) {
            throw new Error("APP_URL or ALLOWED_ORIGINS is missing");
        }
        const dashboardUrl = `${appUrl.replace(/\/$/, "")}/${encodeURIComponent(orgCode)}/dashboard`;
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
  <a href="${dashboardUrl}">
    Login to Dashboard
  </a>
</p>

<p>Regards,<br/>PLMS Team</p>
`;
        const html = (0, template_1.plmsBaseEmailTemplate)({
            title: "Welcome to PLMS",
            content,
        });
        await (0, core_1.sendMailCore)({
            to,
            subject: "Your Account Created",
            html,
        });
        console.log("USER MAIL SENT:", to);
    }
    catch (err) {
        console.error("USER MAIL ERROR:", err);
        throw err;
    }
};
exports.sendUserCreationMail = sendUserCreationMail;
