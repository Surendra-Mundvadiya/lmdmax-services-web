// Avatar utilities with distinct, vibrant colors for drivers and deep jewel tones for admins

export const DRIVER_AVATAR_COLORS = [
  "#2563EB", // Vibrant Royal Blue
  "#059669", // Emerald Green
  "#D97706", // Warm Amber
  "#7C3AED", // Vivid Purple
  "#E11D48", // Rose Red
  "#0891B2", // Cyan Teal
  "#4F46E5", // Indigo
  "#0D9488", // Dark Teal
  "#EA580C", // Vibrant Orange
  "#9333EA", // Bright Violet
  "#2DD4BF", // Aqua Mint
  "#F59E0B", // Golden Amber
];

export const ADMIN_AVATAR_COLORS = [
  "#1E3A8A", // Deep Navy Blue
  "#4338CA", // Deep Indigo
  "#6D28D9", // Deep Royal Purple
  "#0F766E", // Deep Teal Pine
  "#831843", // Deep Crimson Rose
  "#1E293B", // Dark Slate
  "#3730A3", // Midnight Indigo
  "#7C2D12", // Deep Rust Terracotta
  "#134E4A", // Dark Forest
  "#4C1D95", // Imperial Purple
];

/**
 * Deterministically generates an avatar color from a person's name and user type.
 */
export function getAvatarColor(name: string, type: "driver" | "admin" = "driver"): string {
  if (!name || typeof name !== "string") {
    return type === "admin" ? "#1E3A8A" : "#2563EB";
  }
  const palette = type === "admin" ? ADMIN_AVATAR_COLORS : DRIVER_AVATAR_COLORS;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

/**
 * Extracts 1-2 uppercase characters from a person's name with strict truncation to prevent text overflow.
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== "string") return "U";
  const trimmed = name.trim();
  if (!trimmed) return "U";
  
  // Split on whitespace or dashes
  const parts = trimmed.split(/[\s-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  // Single word: take first 1 or 2 letters
  return trimmed.slice(0, 2).toUpperCase();
}
