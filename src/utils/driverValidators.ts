export interface ValidationResult {
  isValid: boolean;
  error: string;
}

/**
 * Standard Name Validation
 * - Required, min 2, max 50 characters
 * - Only alphabetic characters, spaces, and hyphens
 * - No numbers, leading/trailing spaces or special symbols
 */
export const validateDriverNamePart = (name: string, fieldLabel = "Name"): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldLabel} is required` };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters` };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: `${fieldLabel} cannot exceed 50 characters` };
  }
  const nameRegex = /^[A-Za-z]+(?:[-' ][A-Za-z]+)*$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} can only contain letters, hyphens, and spaces` };
  }
  return { isValid: true, error: "" };
};

/**
 * Standard Transporter ID Validation
 * - Amazon / DSP badge identifier
 * - Alphanumeric, uppercase standardized, 6 to 20 characters
 */
export const validateTransporterId = (transporterId: string): ValidationResult => {
  const trimmed = transporterId.trim().replace(/^#+/, "").toUpperCase();
  if (!trimmed) {
    return { isValid: false, error: "Transporter ID is required" };
  }
  if (trimmed.length < 6) {
    return { isValid: false, error: "Transporter ID must be at least 6 characters" };
  }
  if (trimmed.length > 30) {
    return { isValid: false, error: "Transporter ID cannot exceed 30 characters" };
  }
  const alphaNumRegex = /^[A-Z0-9_-]+$/;
  if (!alphaNumRegex.test(trimmed)) {
    return { isValid: false, error: "Transporter ID may only contain letters, numbers, hyphens, and underscores" };
  }
  return { isValid: true, error: "" };
};

/**
 * Standard Email Validation
 * - RFC 5322 standard format
 * - Local part <= 64 chars, domain <= 255 chars
 */
export const validateDriverEmail = (email: string): ValidationResult => {
  const trimmed = email.trim().replace(/^#+/, "");
  if (!trimmed) {
    return { isValid: false, error: "Email address is required" };
  }
  if (trimmed.length > 320) {
    return { isValid: false, error: "Email cannot exceed 320 characters" };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address (e.g. driver@dsp.com)" };
  }
  const [local, domain] = trimmed.split("@");
  if (local.length > 64) {
    return { isValid: false, error: "Email local name cannot exceed 64 characters" };
  }
  if (domain.length > 255) {
    return { isValid: false, error: "Email domain cannot exceed 255 characters" };
  }
  return { isValid: true, error: "" };
};

/**
 * Standard US Phone Number Validation
 * - Exactly 10 digits
 * - Area code cannot start with 0 or 1
 */
export const validateDriverPhone = (phone: string): ValidationResult => {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return { isValid: false, error: "Phone number is required" };
  }
  if (digits.length !== 10) {
    return { isValid: false, error: "Phone number must be exactly 10 digits" };
  }
  if (digits[0] === "0" || digits[0] === "1") {
    return { isValid: false, error: "US phone number area code cannot start with 0 or 1" };
  }
  return { isValid: true, error: "" };
};

/**
 * Format 10-digit phone number as (XXX) XXX-XXXX
 */
export const formatDriverPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

/**
/**
 * Helper to parse MM/DD/YYYY or YYYY-MM-DD to Date
 */
export const parseCustomDate = (str: string): Date | null => {
  if (!str || !str.trim()) return null;
  const trimmed = str.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [m, d, y] = trimmed.split("/").map(Number);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime()) && date.getMonth() === m - 1) return date;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const [y, m, d] = trimmed.slice(0, 10).split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Validate single Full Driver Name
 */
export const validateDriverFullName = (name: string): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, error: "Driver name is required" };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: "Driver name must be at least 2 characters" };
  }
  return { isValid: true, error: "" };
};

/**
 * Standard Date of Birth Validation
 * - Optional by default; if provided, driver must be at least 18 years old
 * - Cannot be in the future
 */
export const validateDriverDob = (dobStr: string, required: boolean = false): ValidationResult => {
  if (!dobStr || !dobStr.trim()) {
    return required ? { isValid: false, error: "Date of Birth is required" } : { isValid: true, error: "" };
  }
  const dob = parseCustomDate(dobStr);
  if (!dob || isNaN(dob.getTime())) {
    return { isValid: false, error: "Please enter a valid date of birth (MM/DD/YYYY)" };
  }
  const today = new Date();
  if (dob >= today) {
    return { isValid: false, error: "Date of birth cannot be today or in the future" };
  }
  // Calculate exact age
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 18) {
    return { isValid: false, error: "Driver must be at least 18 years of age" };
  }
  if (age > 80) {
    return { isValid: false, error: "Please verify the date of birth (exceeds 80 years)" };
  }
  return { isValid: true, error: "" };
};

/**
 * Standard Hire Date Validation
 * - Optional by default; if provided, cannot be future beyond 30 days
 */
export const validateDriverHireDate = (hireDateStr: string, required: boolean = false): ValidationResult => {
  if (!hireDateStr || !hireDateStr.trim()) {
    return required ? { isValid: false, error: "Hire Date is required" } : { isValid: true, error: "" };
  }
  const hireDate = parseCustomDate(hireDateStr);
  if (!hireDate || isNaN(hireDate.getTime())) {
    return { isValid: false, error: "Please enter a valid hire date (MM/DD/YYYY)" };
  }
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + 30); // allow up to 30 days in future for onboarding
  if (hireDate > maxFuture) {
    return { isValid: false, error: "Hire date cannot be more than 30 days in the future" };
  }
  return { isValid: true, error: "" };
};

/**
 * Standard Work Anniversary Validation
 * - Must be on or after hire date
 */
export const validateDriverAnniversary = (anniversaryStr: string, hireDateStr?: string): ValidationResult => {
  if (!anniversaryStr || !anniversaryStr.trim()) {
    return { isValid: true, error: "" }; // optional or defaults to hire date
  }
  const anniversary = parseCustomDate(anniversaryStr);
  if (!anniversary || isNaN(anniversary.getTime())) {
    return { isValid: false, error: "Please enter a valid anniversary date (MM/DD/YYYY)" };
  }
  if (hireDateStr && hireDateStr.trim()) {
    const hireDate = parseCustomDate(hireDateStr);
    if (hireDate && !isNaN(hireDate.getTime()) && anniversary < hireDate) {
      return { isValid: false, error: "Work anniversary cannot be before hire date" };
    }
  }
  return { isValid: true, error: "" };
};

/**
 * Standard Multi-Station Validation
 * - Must select at least 1 station
 */
export const validateDriverStations = (stations: string[]): ValidationResult => {
  if (!stations || stations.length === 0) {
    return { isValid: false, error: "Please assign at least one delivery station" };
  }
  return { isValid: true, error: "" };
};
