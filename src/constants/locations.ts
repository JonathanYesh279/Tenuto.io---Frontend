/**
 * Valid room/location options for the conservatory
 * Used across all forms: theory lessons, rehearsals, teacher schedules, etc.
 */
export const VALID_LOCATIONS = [
  'אולם ערן',
  'סטודיו קאמרי 1',
  'סטודיו קאמרי 2',
  'אולפן הקלטות',
  'חדר חזרות 1',
  'חדר חזרות 2',
  'חדר מחשבים',
  'חדר 1',
  'חדר 2',
  'חדר חזרות',
  'חדר 5',
  'חדר 6',
  'חדר 7',
  'חדר 8',
  'חדר 9',
  'חדר 10',
  'חדר 11',
  'חדר 12',
  'חדר 13',
  'חדר 14',
  'חדר 15',
  'חדר 16',
  'חדר 17',
  'חדר 18',
  'חדר 19',
  'חדר 20',
  'חדר 21',
  'חדר 22',
  'חדר 23',
  'חדר 24',
  'חדר 25',
  'חדר 26',
  'חדר תאוריה א',
  'חדר תאוריה ב',
] as const;

// Type for location values
export type Location = typeof VALID_LOCATIONS[number];

// Alias for backward compatibility
export const VALID_THEORY_LOCATIONS = VALID_LOCATIONS;
