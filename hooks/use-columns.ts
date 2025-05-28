"use client"

import { useState, useEffect, useCallback } from "react"
import type { ColumnInfo } from "@/lib/repositories/tables-repository"
import { toast } from "@/components/ui/use-toast"

/**
 * Hook per la gestione delle colonne di una tabella
 * @param repository Repository delle tabelle
 * @param tableName Nome della tabella
 * @returns Stato e funzioni per la gestione delle colonne
 */
export function useColumns(repository: any, tableName: string | null) {
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Funzione per recuperare le colonne
  const fetchColumns = useCallback(async () => {
    if (!repository || !tableName) {
      setColumns([])
      setSelectedColumns({})
      return
    }

    setIsLoading(true)
    try {
      const columnsList = await repository.getColumns(tableName)
      setColumns(columnsList)

      // Inizializza tutti i checkbox come selezionati
      const initialSelectedColumns: Record<string, boolean> = {}
      columnsList.forEach((col: ColumnInfo) => {
        initialSelectedColumns[col.name] = true
      })
      setSelectedColumns(initialSelectedColumns)

      if (columnsList.length === 0) {
        toast({
          title: "Informazione",
          description: "Nessuna colonna trovata. Potrebbe essere necessario creare una funzione RPC 'get_columns'.",
        })
      }
    } catch (error) {
      console.error("Errore nel recupero delle colonne:", error)
      toast({
        title: "Errore",
        description: "Impossibile recuperare le colonne della tabella",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [repository, tableName])

  // Carica le colonne quando cambia la tabella
  useEffect(() => {
    fetchColumns()
  }, [fetchColumns])

  // Funzione per gestire il cambio di stato di un checkbox
  const handleColumnToggle = useCallback((columnName: string) => {
    setSelectedColumns((prev) => ({
      ...prev,
      [columnName]: !prev[columnName],
    }))
  }, [])

  // Funzione per selezionare/deselezionare tutte le colonne
  const toggleAllColumns = useCallback(
    (selected: boolean) => {
      const updatedColumns: Record<string, boolean> = {}
      columns.forEach((col) => {
        updatedColumns[col.name] = selected
      })
      setSelectedColumns(updatedColumns)
    },
    [columns],
  )

  // Ottieni le colonne selezionate come array
  const getSelectedColumnsArray = useCallback(() => {
    return Object.entries(selectedColumns)
      .filter(([_, isSelected]) => isSelected)
      .map(([columnName]) => columnName)
  }, [selectedColumns])

  return {
    columns,
    selectedColumns,
    isLoading,
    fetchColumns,
    handleColumnToggle,
    toggleAllColumns,
    getSelectedColumnsArray,
  }
}
