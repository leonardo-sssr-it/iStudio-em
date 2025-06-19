import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StickyNote, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <StickyNote className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Nota non trovata</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            La nota che stai cercando non esiste o non hai i permessi per visualizzarla.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="default">
              <Link href="/note">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Torna alle note
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Vai alla home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
