import { redirect } from "next/navigation"

// Reindirizza alla pagina di creazione
export default function NewItemPage() {
  redirect("/data-explorer")
  return null
}
