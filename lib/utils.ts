import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeIdentifier(input: string): string {
  if (!input || typeof input !== "string") {
    return ""
  }

  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "") // Remove special characters except spaces, hyphens, and underscores
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[-_]+/g, "_") // Replace multiple consecutive hyphens/underscores with single underscore
    .replace(/^_+|_+$/g, "") // Remove leading and trailing underscores
}
