"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSupabase } from "@/lib/supabase-provider"
import { useAuth } from "@/lib/auth-provider"
import type { Pagina } from "@/lib/services/pagine-service"

export default function PaginaDetailPage() {
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState<Pagina | null>(null)
  const [autore, setAutore] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  
  // Carica la pagina
  useEffect(() => {
    async function loadPagina() {
      if (!supabase || !id) return
      
      setLoading(true)
      set
