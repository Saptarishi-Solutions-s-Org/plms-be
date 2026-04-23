export function plmsBaseEmailTemplate({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0">

<tr>
<td align="center" style="padding:22px 0 8px;">
<img src="https://dmdfe.vercel.app/saptarishi.png" width="160" style="display:block;" />
</td>
</tr>

<tr>
<td align="center" style="padding:8px 0 10px;">
<h2 style="margin:0; color:#111827;">${title}</h2>
</td>
</tr>

<tr>
<td style="border-top:6px solid #7c83ff;"></td>
</tr>

<tr>
<td align="center" style="padding:22px 0;">
<img src="https://dmdfe.vercel.app/security.png" width="110" style="display:block;" />
</td>
</tr>

<tr>
<td style="padding:0 32px 28px; color:#374151; font-size:15px; line-height:1.55;">
${content}
</td>
</tr>

<tr>
<td align="center" style="background-color:#7c83ff; padding:14px; color:#ffffff; font-size:13px;">
© ${new Date().getFullYear()} PLMS · Saptarishi Solutions PVT LTD. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>
</body>
</html>
`;
}
