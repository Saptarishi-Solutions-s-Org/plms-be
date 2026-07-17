const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const generateSegmentCode = (): string => {
  let code = "SEG";
  for (let i = 0; i < 12; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
};
