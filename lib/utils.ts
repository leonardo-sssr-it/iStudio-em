import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes an identifier for safe use in URLs, IDs, etc.
 * Removes special characters and spaces.
 */
export function sanitizeIdentifier(value: string): string {
  if (!value) return ""

  // Replace spaces and special characters with underscores
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_{2,}/g, "_") // Replace multiple underscores with a single one
    .replace(/^_|_$/g, "") // Remove leading and trailing underscores
}
