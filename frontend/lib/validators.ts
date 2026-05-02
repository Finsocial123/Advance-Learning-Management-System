export const PASSWORD_RULE_TEXT =
  "Password must be at least 8 characters and include one capital letter and one special character.";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SPECIAL_CHARACTER_REGEX = /[!@#$%^&*()\-_=+\[\]{}|;:'",.<>?/`~\\]/;

export function validateEmailAddress(email: string): string | undefined {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) return "Email is required";
  if (!EMAIL_REGEX.test(normalizedEmail)) return "Enter a valid email address";

  return undefined;
}

export function validateStrongPassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one capital letter";
  if (!SPECIAL_CHARACTER_REGEX.test(password)) return "Password must contain at least one special character";

  return undefined;
}
