// app/data-explorer/[table]/[id]/page.tsx

import type React from "react"

interface Props {
  params: {
    table: string
    id: string
  }
}

const DataExplorerIdPage: React.FC<Props> = ({ params }) => {
  const { table, id } = params

  return (
    <div>
      <h1>
        Data Explorer - Table: {table}, ID: {id}
      </h1>
      <p>
        This page displays details for a specific entry in the <code>{table}</code> table with ID <code>{id}</code>.
      </p>
      {/* Add your data fetching and display logic here */}
    </div>
  )
}

export default DataExplorerIdPage
