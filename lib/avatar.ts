/**
 * Avatar utilities - deterministic colors and initials
 */

const COLORS = [
  "#0e7c86",
  "#3b6ea5",
  "#8a5712",
  "#7a4ea8",
  "#1f7a4d",
  "#b04a6a",
  "#2a7d8c",
  "#986a1f",
  "#4a63b0",
  "#607080",
];

/**
 * Get deterministic color for a name
 */
export function getAvatarColor(name: string): string {
  // Simple hash from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

/**
 * Get initials from name (first 2 words, uppercase)
 */
export function getInitials(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
