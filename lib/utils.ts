import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a string to be used as a safe identifier
 * Removes special characters and ensures it's a valid identifier
 */
export function sanitizeIdentifier(str: string): string {
  if (!str || typeof str !== "string") return ""

  return str
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_") // Replace non-alphanumeric chars with underscore
    .replace(/^[0-9]/, "_$&") // Prefix with underscore if starts with number
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, "") // Remove leading/trailing underscores
    .substring(0, 50) // Limit length
}
