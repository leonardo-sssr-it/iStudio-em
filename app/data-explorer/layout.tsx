import type React from "react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function DataExplorerLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Skeleton className="h-screen w-full" />}>{children}</Suspense>
}
