import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string to be used as a safe identifier.
 * Replaces spaces and most non-alphanumeric characters with underscores.
 * @param input The string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeIdentifier(input: string): string {
  if (!input) return ""

  // Replace spaces and non-alphanumeric (excluding underscore) with a single underscore
  let sanitized = input.replace(/[^a-zA-Z0-9_]+/g, "_")

  // Remove leading or trailing underscores that might result from the replacement
  sanitized = sanitized.replace(/^_+|_+$/g, "")

  // Ensure it's not empty after sanitization, return a default if it is
  if (sanitized === "") return "_"

  return sanitized
}

// You might have other utility functions here, ensure they are preserved.
// For example, if you had a formatDate function, it would remain:
/*
export function formatDate(date: Date): string {
  // ... implementation ...
}
*/
