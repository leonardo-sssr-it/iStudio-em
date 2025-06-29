import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface SummaryCardProps {
  title: string
  value: string | number
  isLoading: boolean
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {isLoading ? <Skeleton className="h-4 w-16" /> : <div className="text-muted-foreground text-sm"></div>}
      </CardHeader>
      <CardContent className="space-y-1 pt-2">
        {isLoading ? <Skeleton className="h-6 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  )
}

interface UserSummaryProps {
  totalOrders: number
  totalRevenue: number
  newCustomers: number
  isLoading: boolean
}

const UserSummary: React.FC<UserSummaryProps> = ({ totalOrders, totalRevenue, newCustomers, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
      <SummaryCard title="Total Orders" value={totalOrders} isLoading={isLoading} />
      <SummaryCard title="Total Revenue" value={totalRevenue} isLoading={isLoading} />
      <SummaryCard title="New Customers" value={newCustomers} isLoading={isLoading} />
    </div>
  )
}

export default UserSummary
