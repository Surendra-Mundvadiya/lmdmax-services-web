/**
 * Standard Validation Engine for LMDmax Unified App
 * Ensures consistent field validation across Login, Registration, Profile, and Company Settings.
 */

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const DIGIT_REGEX = /\d+/;
export const SPECIAL_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/;
export const LETTER_REGEX = /[a-zA-Z]/;
export const PHONE_DIGITS_REGEX = /^\d{10}$/;

export interface ValidationResult {
  isValid: boolean;
  error: string;
}

export interface PasswordCriteria {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasLetter: boolean;
  isValid: boolean;
}

/**
 * Standard Email Validator
 */
export function validateEmail(val: string): ValidationResult {
  const trimmed = val ? val.trim() : "";
  if (!trimmed) {
    return { isValid: false, error: "Please enter your email address" };
  }
  if (trimmed.length > 320) {
    return { isValid: false, error: "Email must be at most 320 characters long" };
  }
  const parts = trimmed.split("@");
  if (parts.length === 2) {
    if (parts[0].length > 64) {
      return { isValid: false, error: "The local-address must not exceed 64 characters" };
    }
    if (parts[1].length > 255) {
      return { isValid: false, error: "The domain name must not exceed 255 characters" };
    }
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  return { isValid: true, error: "" };
}

/**
 * Standard Password Validator & Rule Inspector
 */
export function validatePasswordCriteria(val: string): PasswordCriteria {
  const minLength = val.length >= 6;
  const hasNumber = DIGIT_REGEX.test(val);
  const hasSpecial = SPECIAL_REGEX.test(val);
  const hasLetter = LETTER_REGEX.test(val);
  const isValid = minLength && hasNumber && hasSpecial && hasLetter;

  return {
    minLength,
    hasNumber,
    hasSpecial,
    hasLetter,
    isValid,
  };
}

export function validatePassword(val: string): ValidationResult {
  if (!val) {
    return { isValid: false, error: "Please enter your password" };
  }
  if (val.length < 6) {
    return { isValid: false, error: "Password must be at least 6 characters long" };
  }
  const criteria = validatePasswordCriteria(val);
  if (!criteria.isValid) {
    return { isValid: false, error: "Password must contain a letter, a number, and a special character" };
  }
  return { isValid: true, error: "" };
}

/**
 * Password Confirmation Validator
 */
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }
  return { isValid: true, error: "" };
}

/**
 * Standard Phone Number Validator (10 digits)
 */
export function validatePhoneNumber(val: string): ValidationResult {
  const cleaned = val ? val.replace(/\D/g, "") : "";
  if (!cleaned) {
    return { isValid: false, error: "Phone number is required" };
  }
  if (cleaned.length !== 10) {
    return { isValid: false, error: "Phone number must be exactly 10 digits" };
  }
  return { isValid: true, error: "" };
}

/**
 * Standard Name Validator
 */
export function validateName(val: string, fieldLabel = "Name", minLength = 3, maxLength = 50): ValidationResult {
  const trimmed = val ? val.trim() : "";
  if (!trimmed) {
    return { isValid: false, error: `${fieldLabel} is required` };
  }
  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldLabel} must be at least ${minLength} characters long` };
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldLabel} must be at most ${maxLength} characters long` };
  }
  return { isValid: true, error: "" };
}

/**
 * Station Code Validator (e.g. DDF4, 3-6 uppercase alphanumeric chars)
 */
export function validateStationCode(val: string): ValidationResult {
  const trimmed = val ? val.trim().toUpperCase() : "";
  if (!trimmed) {
    return { isValid: false, error: "Station code is required" };
  }
  if (trimmed.length < 2 || trimmed.length > 10) {
    return { isValid: false, error: "Station code must be between 2 and 10 characters" };
  }
  return { isValid: true, error: "" };
}

/**
 * Zipcode Validator
 */
export function validateZipCode(val: string): ValidationResult {
  const trimmed = val ? val.trim() : "";
  if (!trimmed) {
    return { isValid: false, error: "Zip code is required" };
  }
  if (trimmed.length < 3 || trimmed.length > 10) {
    return { isValid: false, error: "Please provide a valid zip code" };
  }
  return { isValid: true, error: "" };
}

/**
 * Generic Required Field Validator
 */
export function validateRequired(val: string, fieldLabel = "This field"): ValidationResult {
  const trimmed = val ? val.trim() : "";
  if (!trimmed) {
    return { isValid: false, error: `${fieldLabel} is required` };
  }
  return { isValid: true, error: "" };
}

/**
 * Clean and format 10-digit phone number
 */
export function formatPhoneNumber(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
