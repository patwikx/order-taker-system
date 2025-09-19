import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { TableManagement } from "@/components/admin/table-management"
import { getAllTables } from "@/lib/actions/table-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface TablesPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function TablesPage({ params }: TablesPageProps) {
  const { businessUnitId } = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/sign-in")
  }
  
  // Check if user has admin access
  const isAdmin = session.user.assignments.some(
    (assignment) =>
      assignment.businessUnitId === businessUnitId &&
      assignment.isActive &&
      (assignment.role.name === "admin" || assignment.role.name === "ADMIN" || assignment.role.name === "MANAGER"),
  )
  
  if (!isAdmin) {
    redirect(`/${businessUnitId}`)
  }
  
  const [businessUnit, tables] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getAllTables(businessUnitId),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }
  
  return (
    <div className="w-full bg-gray-50">
        <TableManagement businessUnitId={businessUnitId} initialTables={tables} />
    </div>
  )
}