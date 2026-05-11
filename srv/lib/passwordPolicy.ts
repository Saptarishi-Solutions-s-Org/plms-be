export function validatePasswordPolicy(password: string) {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Minimum 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Must contain 1 capital letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain 1 number");
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Must contain 1 special character");
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors[0] || "",
  };
}
