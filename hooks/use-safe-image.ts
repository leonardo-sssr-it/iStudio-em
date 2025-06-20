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
      setHasError(!url || url.startsWith("/placeholder.svg"))
      return
    }

    // Skip blob URLs that might be invalid
    if (url.startsWith("blob:") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
      console.warn(`useSafeImage: Skipping potentially invalid blob URL ${url}`)
      setProcessedUrl(BlobUrlHandler.getPlaceholderImage(undefined, undefined, "Invalid blob URL"))
      setIsLoading(false)
      setHasError(true)
      return
    }

    setIsLoading(true)
    setHasError(false)

    const img = new window.Image()
    img.crossOrigin = "anonymous" // Add CORS handling

    const timeoutId = setTimeout(() => {
      console.warn(`useSafeImage: Timeout loading image ${url}`)
      img.onload = null
      img.onerror = null
      setProcessedUrl(BlobUrlHandler.getPlaceholderImage(undefined, undefined, "Timeout loading image"))
      setIsLoading(false)
      setHasError(true)
    }, 10000) // 10 second timeout

    img.onload = () => {
      clearTimeout(timeoutId)
      setProcessedUrl(url)
      setIsLoading(false)
      setHasError(false)
    }

    img.onerror = () => {
      clearTimeout(timeoutId)
      console.warn(`useSafeImage: Failed to load image ${url}`)

      let nameForPlaceholder = "source"
      try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split("/")
        nameForPlaceholder = pathParts.pop() || pathParts.pop() || "source"
        if (nameForPlaceholder.length > 30) {
          nameForPlaceholder = "..." + nameForPlaceholder.slice(-27)
        }
      } catch (e) {
        nameForPlaceholder = "invalid-url"
      }

      setProcessedUrl(BlobUrlHandler.getPlaceholderImage(undefined, undefined, `Error loading: ${nameForPlaceholder}`))
      setIsLoading(false)
      setHasError(true)
      BlobUrlHandler.addFailedExternalUrl(url)
    }

    img.src = url

    return () => {
      clearTimeout(timeoutId)
      img.onload = null
      img.onerror = null
    }
  }, [url]) // Dependency array ensures this runs when the URL changes

  return { safeUrl: processedUrl, isLoading, hasError }
}
