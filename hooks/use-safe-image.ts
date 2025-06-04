"use client"

import { useState, useEffect } from "react"
import { BlobUrlHandler } from "@/lib/blob-url-handler"

export function useSafeImage(url: string | undefined) {
  const [safeUrl, setSafeUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!url) {
      setSafeUrl(null)
      setIsLoading(false)
      setHasError(false)
      return
    }

    setIsLoading(true)
    setHasError(false)

    BlobUrlHandler.safeLoadImage(url)
      .then((validUrl) => {
        if (validUrl) {
          setSafeUrl(validUrl)
        } else {
          setHasError(true)
          setSafeUrl(BlobUrlHandler.getPlaceholderImage())
        }
      })
      .catch((error) => {
        console.warn("Image loading error:", error)
        setHasError(true)
        setSafeUrl(BlobUrlHandler.getPlaceholderImage())
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [url])

  return { safeUrl, isLoading, hasError }
}
