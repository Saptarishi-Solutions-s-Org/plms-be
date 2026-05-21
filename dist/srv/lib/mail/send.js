"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const core_1 = require("./core");
const template_1 = require("./template");
async function sendMail({ to, subject, title, content, }) {
    const html = (0, template_1.plmsBaseEmailTemplate)({
        title,
        content,
    });
    await (0, core_1.sendMailCore)({
        to,
        subject,
        html,
    });
}
