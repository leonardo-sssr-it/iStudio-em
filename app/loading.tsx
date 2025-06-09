import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <p className="text-muted-foreground">Caricamento in corso...</p>
      </div>
    </div>
  )
}
