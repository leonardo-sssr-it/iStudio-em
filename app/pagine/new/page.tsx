"use client"

import { createPage } from "@/app/pagine/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useFormState, useFormStatus } from "react-dom"
import { toast } from "sonner"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creazione in corso..." : "Crea Pagina"}
    </Button>
  )
}

export default function NewPage() {
  const initialState = { message: "", errors: {}, success: false }
  const [state, dispatch] = useFormState(createPage, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        router.push("/pagine") // O dove vuoi reindirizzare
      } else {
        toast.error(state.message)
      }
    }
  }, [state, router])

  return (
    <div className="container mx-auto py-10">
      <form action={dispatch}>
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Crea una nuova pagina</CardTitle>
            <CardDescription>Compila i campi sottostanti per pubblicare un nuovo articolo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="titolo">Titolo</Label>
              <Input id="titolo" name="titolo" placeholder="Il mio fantastico articolo" required />
              {state.errors?.titolo && <p className="text-sm text-red-500">{state.errors.titolo[0]}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contenuto">Contenuto</Label>
              <Textarea
                id="contenuto"
                name="contenuto"
                placeholder="Scrivi qui il contenuto del tuo articolo..."
                rows={10}
                required
              />
              {state.errors?.contenuto && <p className="text-sm text-red-500">{state.errors.contenuto[0]}</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="estratto">Estratto (Opzionale)</Label>
                <Textarea id="estratto" name="estratto" placeholder="Una breve anteprima dell'articolo" rows={3} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoria (Opzionale)</Label>
                <Input id="categoria" name="categoria" placeholder="Es. Tecnologia" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (Opzionali, separati da virgola)</Label>
                <Input id="tags" name="tags" placeholder="nextjs, supabase, react" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="immagine">URL Immagine di Copertina (Opzionale)</Label>
                <Input id="immagine" name="immagine" type="url" placeholder="https://..." />
                {state.errors?.immagine && <p className="text-sm text-red-500">{state.errors.immagine[0]}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch id="attivo" name="attivo" defaultChecked />
                <Label htmlFor="attivo">Attivo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="privato" name="privato" />
                <Label htmlFor="privato">Privato</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
