import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes an identifier by removing special characters and spaces
 * @param identifier The identifier to sanitize
 * @returns A sanitized string safe for use as an identifier
 */
export function sanitizeIdentifier(identifier: string): string {
  if (!identifier) return ""

  // Replace spaces and special characters with underscores
  // Remove any characters that aren't alphanumeric or underscores
  // Ensure it doesn't start with a number (for HTML IDs)
  const sanitized = identifier
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/^(\d)/, "_$1")

  return sanitized || "id" // Fallback to 'id' if the result is empty
}
