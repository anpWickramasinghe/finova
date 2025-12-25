import { Platform } from 'react-native';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const lightColors = {
  // Base colors
  background: '#ffffff',
  foreground: '#090909',

  // Card colors
  card: '#ffffff',
  cardForeground: '#090909',

  // Popover colors
  popover: '#ffffff',
  popoverForeground: '#090909',

  // Primary colors
  primary: '#2a3c97',
  primaryForeground: '#f9f9f9',

  // Secondary colors
  secondary: '#f5f5f5',
  secondaryForeground: '#161616',

  // Muted colors
  muted: '#f5f5f5',
  mutedForeground: '#737373',

  // Accent colors
  accent: '#f5f5f5',
  accentForeground: '#161616',

  // Destructive colors
  destructive: '#ee4444',
  destructiveForeground: '#f9f9f9',

  // Border and input
  border: '#e4e4e4',
  input: '#e4e4e4',
  ring: '#090909',

  // Text colors
  text: '#090909',
  textMuted: '#737373',

  // Legacy support for existing components
  tint: '#2a3c97',
  icon: '#737373',
  tabIconDefault: '#737373',
  tabIconSelected: '#2a3c97',

  // Default buttons, links, Send button, selected tabs
  blue: '#007AFF',

  // Success states, FaceTime buttons, completed tasks
  green: '#34C759',

  // Delete buttons, error states, critical alerts
  red: '#FF3B30',

  // VoiceOver highlights, warning states
  orange: '#FF9500',

  // Notes app accent, Reminders highlights
  yellow: '#FFCC00',

  // Pink accent color for various UI elements
  pink: '#FF2D92',

  // Purple accent for creative apps and features
  purple: '#AF52DE',

  // Teal accent for communication features
  teal: '#5AC8FA',

  // Indigo accent for system features
  indigo: '#5856D6',
};

export const darkColors = {
  // Base colors
  background: '#090909',
  foreground: '#f9f9f9',

  // Card colors
  card: '#090909',
  cardForeground: '#f9f9f9',

  // Popover colors
  popover: '#090909',
  popoverForeground: '#f9f9f9',

  // Primary colors
  primary: '#f9f9f9',
  primaryForeground: '#161616',

  // Secondary colors
  secondary: '#252525',
  secondaryForeground: '#f9f9f9',

  // Muted colors
  muted: '#252525',
  mutedForeground: '#a2a2a2',

  // Accent colors
  accent: '#252525',
  accentForeground: '#f9f9f9',

  // Destructive colors
  destructive: '#7f1d1d',
  destructiveForeground: '#f9f9f9',

  // Border and input
  border: '#252525',
  input: '#252525',
  ring: '#d3d3d3',

  // Text colors
  text: '#f9f9f9',
  textMuted: '#a2a2a2',

  // Legacy support for existing components
  tint: '#f9f9f9',
  icon: '#a2a2a2',
  tabIconDefault: '#a2a2a2',
  tabIconSelected: '#f9f9f9',

  // Default buttons, links, Send button, selected tabs
  blue: '#0A84FF',

  // Success states, FaceTime buttons, completed tasks
  green: '#30D158',

  // Delete buttons, error states, critical alerts
  red: '#FF453A',

  // VoiceOver highlights, warning states
  orange: '#FF9F0A',

  // Notes app accent, Reminders highlights
  yellow: '#FFD60A',

  // Pink accent color for various UI elements
  pink: '#FF375F',

  // Purple accent for creative apps and features
  purple: '#BF5AF2',

  // Teal accent for communication features
  teal: '#64D2FF',

  // Indigo accent for system features
  indigo: '#5E5CE6',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};
