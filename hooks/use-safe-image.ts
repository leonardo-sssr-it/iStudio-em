"use client"

import { useState, useEffect } from "react"
import { BlobUrlHandler } from "@/lib/blob-url-handler"

export function useSafeImage(url: string | undefined | null) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // If the URL is already a placeholder, or no URL is provided, use placeholder.
    if (!url || url.startsWith("/placeholder.svg")) {
      setProcessedUrl(url || BlobUrlHandler.getPlaceholderImage())
      setIsLoading(false)
      // Consider it an error if no URL was provided or it was already a placeholder from a previous failure.
      setHasError(!url || url.startsWith("/placeholder.svg"))
      return
    }

    setIsLoading(true)
    setHasError(false) // Reset error state for new URL

    const img = new window.Image()
    img.src = url

    img.onload = () => {
      setProcessedUrl(url)
      setIsLoading(false)
      setHasError(false)
    }

    img.onerror = () => {
      console.warn(`useSafeImage: Failed to load image ${url}`)
      // Extract a file name or a short part of the URL for the placeholder text
      let nameForPlaceholder = "source"
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split("/")
        nameForPlaceholder = pathParts.pop() || pathParts.pop() || "source" // Get last part
        if (nameForPlaceholder.length > 30) {
          nameForPlaceholder = "..." + nameForPlaceholder.slice(-27)
        }
      } catch (e) {
        /* ignore if URL parsing fails */
      }

      setProcessedUrl(BlobUrlHandler.getPlaceholderImage(undefined, undefined, `Error loading: ${nameForPlaceholder}`))
      setIsLoading(false)
      setHasError(true)
      // Optionally, you could add the failed URL to BlobUrlHandler's list
      // BlobUrlHandler.addFailedUrl(url);
    }

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [url]) // Dependency array ensures this runs when the URL changes

  return { safeUrl: processedUrl, isLoading, hasError }
}
