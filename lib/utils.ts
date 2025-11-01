import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes " - New Digitization" suffix from fund names for display purposes
 * @param fundName - The original fund name
 * @returns The cleaned fund name
 */
export function cleanFundName(fundName: string | null | undefined): string {
  if (!fundName) return '';

  const suffix = ' - New Digitization';

  // If the fund name ends with the suffix, remove it
  if (fundName.endsWith(suffix)) {
    const cleaned = fundName.slice(0, -suffix.length).trim();
    // If after removing suffix the name is empty, return the original
    return cleaned || fundName;
  }

  return fundName;
}

/**
 * Converts text to title case (capitalize first letter of each word)
 * Preserves all-caps acronyms and handles special cases
 * @param text - The text to convert
 * @returns The title-cased text
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .split(' ')
    .map((word) => {
      // Preserve all-caps words (likely acronyms like UI, CL, BP, ASA)
      if (word === word.toUpperCase() && word.length <= 4) {
        return word;
      }

      // Preserve words with special patterns like "item1", "testing1"
      if (/^[a-z]+\d+$/i.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      // Standard title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
