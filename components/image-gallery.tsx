"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Array di immagini personalizzate
const GALLERY_IMAGES = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/x.jpg-XOiK6xtrpfrACfJ1tpOu7243XAV8Pr.jpeg",
    alt: "Arte digitale creata da mani robotiche",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG3.jpg-in3EFYtEhe5JjvJ0KNkEZ0Yb4HjLJb.jpeg",
    alt: "Professionista in ufficio moderno con grafici analitici",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG1.jpg-H2DuXCHMM87aAIV3vz39CMfQB5O1gq.jpeg",
    alt: "Illustrazione di multitasking e gestione dello stress lavorativo",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG4.jpg-VgxWj7w218JlNDMAhpLjrqA4ykPs3A.jpeg",
    alt: "Team di lavoro collaborativo in ambiente moderno",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/OIG2.rAe.jpg-JO4CqjqquIJZQm7Jchtkv24VyJU4Yh.jpeg",
    alt: "Pianista che si esibisce in un teatro vuoto",
  },
]

interface ImageGalleryProps {
  className?: string
  autoplayInterval?: number
}

export const ImageGallery = memo(function ImageGallery({ className, autoplayInterval = 5000 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoaded, setIsLoaded] = useState<boolean[]>(Array(GALLERY_IMAGES.length).fill(false))

  // Funzione per passare all'immagine successiva
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % GALLERY_IMAGES.length)
  }, [])

  // Funzione per passare all'immagine precedente
  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length)
  }, [])

  // Funzione per impostare un'immagine specifica
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    // Quando l'utente cambia manualmente l'immagine, interrompiamo l'autoplay
    setIsAutoPlaying(false)
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current)
      autoplayTimerRef.current = null
    }
  }, [])

  // Gestione dell'autoplay
  useEffect(() => {
    if (isAutoPlaying) {
      autoplayTimerRef.current = setInterval(nextSlide, autoplayInterval)
    }

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current)
      }
    }
  }, [isAutoPlaying, nextSlide, autoplayInterval])

  // Ripristina l'autoplay dopo un periodo di inattività
  useEffect(() => {
    const resumeAutoplay = () => {
      setIsAutoPlaying(true)
    }

    const timeoutId = setTimeout(resumeAutoplay, autoplayInterval * 2)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [currentIndex, autoplayInterval])

  // Funzione per gestire il caricamento delle immagini
  const handleImageLoad = useCallback((index: number) => {
    setIsLoaded((prev) => {
      const newState = [...prev]
      newState[index] = true
      return newState
    })
  }, [])

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-xl", className)}>
      {/* Immagini */}
      <div className="relative w-full h-full">
        {GALLERY_IMAGES.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              currentIndex === index ? "opacity-100 z-10" : "opacity-0 z-0",
            )}
          >
            <div className={cn("absolute inset-0 bg-gray-200", isLoaded[index] ? "hidden" : "block")} />
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={index === 0}
              className="object-cover"
              onLoad={() => handleImageLoad(index)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-sm">{image.alt}</div>
          </div>
        ))}
      </div>

      {/* Controlli di navigazione */}
      <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center space-x-2">
        {GALLERY_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentIndex === index ? "bg-white w-4" : "bg-white/50 hover:bg-white/80",
            )}
            aria-label={`Vai all'immagine ${index + 1}`}
          />
        ))}
      </div>

      {/* Frecce di navigazione */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 hidden sm:flex"
        onClick={prevSlide}
        aria-label="Immagine precedente"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 hidden sm:flex"
        onClick={nextSlide}
        aria-label="Immagine successiva"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Thumbnails - solo su desktop */}
      <div className="absolute bottom-4 right-4 z-20 hidden lg:flex space-x-2">
        {GALLERY_IMAGES.map((image, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-12 h-8 rounded overflow-hidden border-2 transition-all",
              currentIndex === index ? "border-white" : "border-transparent hover:border-white/50",
            )}
            aria-label={`Vai all'immagine ${index + 1}`}
          >
            <div className="relative w-full h-full">
              <Image src={image.src || "/placeholder.svg"} alt={image.alt} fill sizes="48px" className="object-cover" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
})
