import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs Class names to combine
 * @returns Combined class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes an identifier for use in SQL queries to prevent SQL injection
 * @param str String to sanitize
 * @returns Sanitized string or empty string if not valid
 */
export function sanitizeIdentifier(str: string): string {
  if (!str) return ""

  // Remove non-alphanumeric characters and underscores
  return str.replace(/[^a-zA-Z0-9_]/g, "")
}
