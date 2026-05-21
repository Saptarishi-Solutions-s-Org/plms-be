"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrganizationCreationMail = void 0;
const core_1 = require("../lib/mail/core");
const template_1 = require("../lib/mail/template");
const sendOrganizationCreationMail = async ({ to, name, orgName, orgCode, }) => {
    try {
        const content = `
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
    href="http://localhost:3000/${orgCode}/dashboard/"
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
`;
        const html = (0, template_1.plmsBaseEmailTemplate)({
            title: "Organization Created",
            content,
        });
        await (0, core_1.sendMailCore)({
            to,
            subject: "Organization Created Successfully",
            html,
        });
        console.log("ORG MAIL SENT:", to);
    }
    catch (err) {
        console.error("ORG MAIL ERROR:", err);
        throw err;
    }
};
exports.sendOrganizationCreationMail = sendOrganizationCreationMail;
