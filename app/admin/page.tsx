"use client"

import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Role } from "@prisma/client"
import UsersTable from "@/components/admin/users-table"
import { Suspense } from "react"
import Loading from "@/app/loading"

async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/")
  }

  return (
    <div className="min-h-screen">
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <Suspense fallback={<Loading />}>
          <UsersTable />
        </Suspense>
      </div>
    </div>
  )
}

export default AdminPage
