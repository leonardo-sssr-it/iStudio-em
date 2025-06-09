"use client"

import { useState } from "react"
import type { Database } from "@/types/supabase"
import type { Session } from "@supabase/supabase-js"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { CalendarIcon, TagIcon, UserIcon, Trash2 } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import EditableField from "./editable-field"
import { deletePage, updatePageField } from "@/app/pagine/actions"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"

type Page = Database["public"]["Tables"]["pagine"]["Row"]
type User = Database["public"]["Tables"]["utenti"]["Row"]

interface PageViewerProps {
  initialPage: Page & { utente: Pick<User, "username"> | null }
  session: Session | null
}

export default function PageViewer({ initialPage, session }: PageViewerProps) {
  const [page, setPage] = useState(initialPage)
  const router = useRouter()

  const user = session?.user
  const userRoles = user?.user_metadata?.roles || []
  const canEdit = user && (page.id_utente === user.id || userRoles.includes("admin") || userRoles.includes("editor"))
  const canDelete = user && (page.id_utente === user.id || userRoles.includes("admin"))

  const handleUpdate = async (field: keyof Page, value: any) => {
    const oldValue = page[field]
    // Optimistic update
    setPage((prev) => ({ ...prev, [field]: value }))

    const result = await updatePageField(page.id, field, value)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
      // Revert on failure
      setPage((prev) => ({ ...prev, [field]: oldValue }))
    }
  }

  const handleDelete = async () => {
    const result = await deletePage(page.id)
    if (result.success) {
      toast.success(result.message)
      router.push("/pagine") // o un'altra pagina di elenco
    } else {
      toast.error(result.message)
    }
  }

  return (
    <article className="container mx-auto max-w-4xl py-8 px-4">
      {page.immagine && (
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          <EditableField
            pageId={page.id}
            fieldName="immagine"
            value={page.immagine}
            canEdit={canEdit}
            onUpdate={handleUpdate}
            label="URL Immagine"
            className="w-full h-full"
            displayComponent={
              <Image
                src={page.immagine || "/placeholder.svg"}
                alt={page.titolo}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-105"
              />
            }
          />
        </div>
      )}

      <header className="mb-8">
        <EditableField
          pageId={page.id}
          fieldName="titolo"
          value={page.titolo}
          canEdit={canEdit}
          onUpdate={handleUpdate}
          label="Titolo"
          className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100"
          as="h1"
        />
        {page.estratto && (
          <EditableField
            pageId={page.id}
            fieldName="estratto"
            value={page.estratto}
            canEdit={canEdit}
            onUpdate={handleUpdate}
            label="Estratto"
            className="mt-4 text-lg text-gray-500 dark:text-gray-400"
            as="p"
            isTextarea
          />
        )}
      </header>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4" />
          <span>{page.utente?.username || "Utente Sconosciuto"}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <time dateTime={page.pubblicato}>
            Pubblicato il {format(new Date(page.pubblicato), "d MMMM yyyy", { locale: it })}
          </time>
        </div>
        {page.categoria && (
          <div className="flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            <EditableField
              pageId={page.id}
              fieldName="categoria"
              value={page.categoria}
              canEdit={canEdit}
              onUpdate={handleUpdate}
              label="Categoria"
            />
          </div>
        )}
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
        <EditableField
          pageId={page.id}
          fieldName="contenuto"
          value={page.contenuto}
          canEdit={canEdit}
          onUpdate={handleUpdate}
          label="Contenuto"
          isTextarea
        />
      </div>

      <footer className="border-t pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold mb-2">Tags</h3>
            <EditableField
              pageId={page.id}
              fieldName="tags"
              value={Array.isArray(page.tags) ? page.tags.join(", ") : ""}
              canEdit={canEdit}
              onUpdate={(field, value) =>
                handleUpdate(
                  field,
                  value.split(",").map((t: string) => t.trim()),
                )
              }
              label="Tags (separati da virgola)"
              displayComponent={
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(page.tags) &&
                    page.tags.map((tag: any) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                </div>
              }
            />
          </div>
          {canEdit && (
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Attivo:</span>
                <EditableField
                  pageId={page.id}
                  fieldName="attivo"
                  value={page.attivo}
                  canEdit={canEdit}
                  onUpdate={handleUpdate}
                  label="Attivo"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Privato:</span>
                <EditableField
                  pageId={page.id}
                  fieldName="privato"
                  value={!!page.privato}
                  canEdit={canEdit}
                  onUpdate={handleUpdate}
                  label="Privato"
                />
              </div>
            </div>
          )}
        </div>
        {canDelete && (
          <div className="mt-8 text-right">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Elimina Pagina
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione non può essere annullata. Eliminerà permanentemente la pagina dal server.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Sì, elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </footer>
    </article>
  )
}
