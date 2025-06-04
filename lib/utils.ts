import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string for use as an identifier or URL slug
 * @param input The string to sanitize
 * @returns A sanitized string safe for use in URLs and IDs
 */
export function sanitizeIdentifier(input: string): string {
  if (!input) return ""

  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/_{2,}/g, "_") // Replace multiple consecutive underscores with a single one
    .replace(/-{2,}/g, "-") // Replace multiple consecutive hyphens with a single one
    .replace(/^[_-]+|[_-]+$/g, "") // Remove leading and trailing underscores/hyphens
}
