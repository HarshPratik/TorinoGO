
import { StyleSheet } from 'react-native';

// Translated from HSL in globals.css to hex/rgb for React Native
// Note: React Native doesn't support CSS variables directly in StyleSheet.
// These are approximations. For dynamic themes, a theme provider context would be better.

export const colors = {
  background: '#F0F0F0', // Light Gray (approx from 0 0% 94.1%)
  foreground: '#0A0A0A', // (approx from 0 0% 3.9%)
  card: '#FFFFFF', // White card
  primary: '#008080', // Teal (approx from 180 100% 25.1%)
  primaryForeground: '#FAFAFA', // White text on Teal
  secondary: '#F0F0F0', // Light Gray
  secondaryForeground: '#171717',
  muted: '#E6E6E6', // Slightly darker gray
  mutedForeground: '#737373',
  accent: '#D97706', // Burnt Orange (approx from 20 60% 50%) - Tailwind orange-600
  accentForeground: '#FAFAFA', // White text on Orange
  destructive: '#DC2626', // Tailwind red-600
  border: '#D4D4D4', // Slightly darker border
  input: '#FFFFFF',
  ring: '#D97706', // Burnt Orange for ring
  text: '#0A0A0A',
  buttonText: '#FFFFFF',
  sheetBackground: '#FFFFFF', // For modal/sheet like components
  iconColor: '#333333',
};

export const nativeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.foreground,
    fontSize: 16,
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  buttonTextOutline: {
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.input,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: colors.foreground,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sheetContent: {
    backgroundColor: colors.sheetBackground,
    padding: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.primaryForeground,
    fontSize: 12,
    fontWeight: 'bold',
  },
  skeleton: {
    backgroundColor: colors.muted,
    borderRadius: 4,
  },
  errorMessage: {
    color: colors.destructive,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  loadingMessage: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginVertical: 10,
  },
  iconWrapper: {
    padding: 8,
  }
});

export const iconSizes = {
  small: 18,
  medium: 24,
  large: 30,
};

