import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes an identifier to make it safe for database operations
 * @param identifier - The identifier to sanitize
 * @returns A sanitized identifier
 */
export function sanitizeIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== "string") {
    return ""
  }

  // Remove special characters and keep only alphanumeric, underscore, and hyphen
  return identifier
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/^[0-9]/, "_$&") // Ensure it doesn't start with a number
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
}
