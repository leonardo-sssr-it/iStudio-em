import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import UserProfile from "@/components/UserProfile"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/profile")
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-screen py-2">
      {/* Rimuovi qualsiasi background fisso */}
      {/* Usa solo bg-card per i componenti Card se necessario */}
      <UserProfile session={session} />
    </main>
  )
}
