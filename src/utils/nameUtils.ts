/**
 * Name display utilities for backward-compatible fullName → firstName/lastName migration.
 *
 * All display components should use getDisplayName() instead of accessing personalInfo.fullName directly.
 * This ensures compatibility during the migration period where some data may still have fullName.
 */

interface PersonalInfoLike {
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

/**
 * Get display name from personalInfo, with backward compatibility.
 * Tries firstName + lastName first, falls back to fullName.
 */
export function getDisplayName(personalInfo: PersonalInfoLike | null | undefined): string {
  if (!personalInfo) return '';

  if (personalInfo.firstName || personalInfo.lastName) {
    return `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim();
  }

  return personalInfo.fullName || '';
}

/**
 * Get initials from personalInfo for avatar displays.
 * Tries firstName + lastName initials first, falls back to fullName word initials.
 */
export function getInitials(personalInfo: PersonalInfoLike | null | undefined): string {
  if (!personalInfo) return '';

  const first = personalInfo.firstName?.[0] || '';
  const last = personalInfo.lastName?.[0] || '';
  if (first || last) return `${first}${last}`;

  const full = personalInfo.fullName || '';
  const parts = full.trim().split(' ');
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0]?.[0] || '';
}

/**
 * Get last name for sorting purposes.
 * Falls back to full name if lastName not available.
 */
/**
 * Safely format an address value for display.
 * Handles both string addresses and legacy object addresses ({city, street}).
 * Returns a plain string safe for React rendering.
 */
export function formatAddress(address: unknown): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const addr = address as Record<string, unknown>;
    const parts = [addr.street, addr.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }
  return String(address);
}

export function getSortableName(personalInfo: PersonalInfoLike | null | undefined): string {
  if (!personalInfo) return '';

  if (personalInfo.lastName) {
    return `${personalInfo.lastName} ${personalInfo.firstName || ''}`.trim();
  }

  return personalInfo.fullName || '';
}
