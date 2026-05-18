const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const generateOfferCode = (
  length: number = 5
): string => {
  let code = "";

  for (let i = 0; i < length; i++) {
    code += CHARS.charAt(
      Math.floor(Math.random() * CHARS.length)
    );
  }

  return code;
};