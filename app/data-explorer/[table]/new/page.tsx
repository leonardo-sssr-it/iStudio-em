"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewTablePage({ params }: { params: { table: string } }) {
  const [tableName, setTableName] = useState("")
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // Basic validation
    if (!tableName) {
      alert("Table name is required.")
      return
    }

    try {
      // Simulate creating a new table (replace with actual API call)
      console.log(`Creating table: ${tableName}`)
      // Redirect to the data explorer page for the new table
      router.push(`/data-explorer?table=${tableName}`)
    } catch (error) {
      console.error("Error creating table:", error)
      alert("Failed to create table.")
    }
  }

  return (
    <div>
      <h1>Create New Table</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="tableName">Table Name:</label>
        <input type="text" id="tableName" value={tableName} onChange={(e) => setTableName(e.target.value)} required />
        <button type="submit">Create Table</button>
      </form>
    </div>
  )
}
