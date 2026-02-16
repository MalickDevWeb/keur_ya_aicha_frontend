/**
 * Theme Colors Constants
 *
 * Centralized color palette to ensure consistency across the application.
 * Use these constants instead of hardcoded color values.
 */

// ==========================================
// Primary Colors
// ==========================================

export const COLORS = {
  // Primary brand colors
  NAVY: '#0F2854',
  NAVY_MID: '#162d5e',
  ACCENT: '#4a7cff',

  // Background colors
  BACKGROUND: {
    PRIMARY: '#ffffff',
    SECONDARY: '#f8fafc',
    DARK: '#0F2854',
  },

  // Text colors
  TEXT: {
    PRIMARY: '#000000',
    SECONDARY: '#64748b',
    MUTED: '#94a3b8',
    INVERSE: '#ffffff',
  },

  // Status colors
  STATUS: {
    SUCCESS: '#22c55e',
    SUCCESS_DARK: '#16a34a',
    WARNING: '#f59e0b',
    WARNING_DARK: '#d97706',
    ERROR: '#ef4444',
    ERROR_DARK: '#dc2626',
    INFO: '#3b82f6',
  },

  // Border colors
  BORDER: {
    LIGHT: '#e2e8f0',
    MEDIUM: '#cbd5e1',
    DARK: '#94a3b8',
  },
} as const

// ==========================================
// Semantic Color Aliases
// ==========================================

export const SEMANTIC = {
  // Common UI colors
  PRIMARY: COLORS.NAVY,
  SECONDARY: COLORS.NAVY_MID,
  ACCENT: COLORS.ACCENT,

  // Text aliases
  TEXT: {
    DEFAULT: COLORS.TEXT.PRIMARY,
    MUTED: COLORS.TEXT.MUTED,
    INVERSE: COLORS.TEXT.INVERSE,
  },

  // Feedback aliases
  SUCCESS: COLORS.STATUS.SUCCESS,
  WARNING: COLORS.STATUS.WARNING,
  ERROR: COLORS.STATUS.ERROR,

  // Surface aliases
  SURFACE: {
    DEFAULT: COLORS.BACKGROUND.PRIMARY,
    ELEVATED: '#ffffff',
  },
} as const

// ==========================================
// Component-specific Colors
// ==========================================

export const COMPONENT_COLORS = {
  // Badge variants
  BADGE: {
    SUCCESS: '#dcfce7',
    SUCCESS_TEXT: '#166534',
    WARNING: '#fef3c7',
    WARNING_TEXT: '#92400e',
    ERROR: '#fee2e2',
    ERROR_TEXT: '#991b1b',
    INFO: '#dbeafe',
    INFO_TEXT: '#1e40af',
    DEFAULT: '#f1f5f9',
    DEFAULT_TEXT: '#475569',
  },

  // Button colors
  BUTTON: {
    PRIMARY_BG: COLORS.NAVY,
    PRIMARY_BG_HOVER: COLORS.NAVY_MID,
    SECONDARY_BG: '#f1f5f9',
    SECONDARY_TEXT: COLORS.TEXT.PRIMARY,
  },

  // Input colors
  INPUT: {
    BORDER_DEFAULT: COLORS.BORDER.LIGHT,
    BORDER_FOCUS: COLORS.ACCENT,
    BORDER_ERROR: COLORS.STATUS.ERROR,
    BG_DEFAULT: '#ffffff',
    BG_DISABLED: '#f8fafc',
  },
} as const

// ==========================================
// Helper function for CSS
// ==========================================

/**
 * Get a color value from the palette
 */
export function getColor(path: string): string {
  const keys = path.split('.')
  let value: unknown = COLORS

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key]
    } else {
      return path // Return original path if not found
    }
  }

  return typeof value === 'string' ? value : path
}

export default COLORS
