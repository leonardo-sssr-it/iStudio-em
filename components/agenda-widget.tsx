"use client"

import type React from "react"
import { useEffect } from "react"
import { useAgenda } from "../hooks/useAgenda"
import { useDeadlines } from "../hooks/useDeadlines"
import { useUser } from "@auth0/nextjs-auth0/client"

const AgendaWidget: React.FC = () => {
  const { user } = useUser()
  const { agendaItems, loading: agendaLoading } = useAgenda()
  const { deadlines: generalDeadlines, loading: deadlinesLoading } = useDeadlines()

  useEffect(() => {
    if (user?.id && !agendaLoading && !deadlinesLoading) {
      // Carica solo se necessario
      if (!agendaItems.length && !generalDeadlines.length) {
        // I dati verranno caricati dai rispettivi hook
      }
    }
  }, [user?.id, agendaLoading, deadlinesLoading, agendaItems.length, generalDeadlines.length])

  if (agendaLoading || deadlinesLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2>Agenda</h2>
      {agendaItems.length > 0 ? (
        <ul>
          {agendaItems.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      ) : (
        <p>No agenda items.</p>
      )}

      <h2>Deadlines</h2>
      {generalDeadlines.length > 0 ? (
        <ul>
          {generalDeadlines.map((deadline) => (
            <li key={deadline.id}>
              {deadline.title} - {deadline.dueDate}
            </li>
          ))}
        </ul>
      ) : (
        <p>No deadlines.</p>
      )}
    </div>
  )
}

export default AgendaWidget
