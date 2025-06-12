// Utility for handling blob URLs safely and providing placeholders
export class BlobUrlHandler {
  // This Set can be used to keep track of URLs that have definitively failed to load,
  // potentially to avoid retrying them immediately.
  private static failedExternalUrls = new Set<string>()

  /**
   * Returns a placeholder image URL.
   * @param width Width of the placeholder image.
   * @param height Height of the placeholder image.
   * @param text Text to display on the placeholder image.
   * @returns A string representing the placeholder image URL.
   */
  static getPlaceholderImage(width = 400, height = 300, text = "Image Not Available"): string {
    const query = encodeURIComponent(text)
    // Ensure placeholder.svg is in the public directory
    return `/placeholder.svg?width=${width}&height=${height}&text=${query}`
  }

  /**
   * Adds a URL to a list of known failed external URLs.
   * This can be used by `useSafeImage` or other components to mark a URL as problematic.
   * @param url The URL that failed to load.
   */
  static addFailedExternalUrl(url: string): void {
    if (!url.startsWith("blob:") && !url.startsWith("data:")) {
      this.failedExternalUrls.add(url)
    }
  }

  /**
   * Checks if a URL is in the list of known failed external URLs.
   * @param url The URL to check.
   * @returns True if the URL is known to have failed, false otherwise.
   */
  static isFailedExternalUrl(url: string): boolean {
    return this.failedExternalUrls.has(url)
  }

  /**
   * Clears the list of known failed external URLs.
   */
  static clearFailedExternalUrls(): void {
    this.failedExternalUrls.clear()
  }

  // The previous `validateBlobUrl` and `safeLoadImage` methods that attempted to `fetch`
  // blob URLs or external URLs with HEAD requests have been removed.
  // The responsibility of checking image load status is now primarily within `useSafeImage`
  // using the native Image object's onload/onerror events, which is more reliable
  // for client-side image validation across different URL types.
}
