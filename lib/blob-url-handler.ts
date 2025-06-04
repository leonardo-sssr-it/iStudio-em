// Utility for handling blob URLs safely
export class BlobUrlHandler {
  private static failedUrls = new Set<string>()

  static async validateBlobUrl(url: string): Promise<boolean> {
    if (this.failedUrls.has(url)) {
      return false
    }

    try {
      if (!url.startsWith("blob:")) {
        return true // Not a blob URL, assume it's valid
      }

      const response = await fetch(url, { method: "HEAD" })
      if (!response.ok) {
        this.failedUrls.add(url)
        return false
      }

      return true
    } catch (error) {
      console.warn(`Blob URL validation failed for ${url}:`, error)
      this.failedUrls.add(url)
      return false
    }
  }

  static async safeLoadImage(url: string): Promise<string | null> {
    const isValid = await this.validateBlobUrl(url)
    return isValid ? url : null
  }

  static getPlaceholderImage(width = 400, height = 300): string {
    return `/placeholder.svg?height=${height}&width=${width}&text=Image+Not+Available`
  }

  static clearFailedUrls(): void {
    this.failedUrls.clear()
  }
}
