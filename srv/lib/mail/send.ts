import { sendMailCore } from "./core";
import { plmsBaseEmailTemplate } from "./template";

export async function sendMail({
  to,
  subject,
  title,
  content,
}: {
  to: string;
  subject: string;
  title: string;
  content: string;
}) {
  const html = plmsBaseEmailTemplate({
    title,
    content,
  });

  await sendMailCore({
    to,
    subject,
    html,
  });
}
