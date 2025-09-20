import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { AuditLogManagement } from "@/components/admin/audit-log-management"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface AuditLogsPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function AuditLogsPage({ params }: AuditLogsPageProps) {
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
  
  const businessUnit = await getBusinessUnit(businessUnitId)
  
  if (!businessUnit) {
    redirect("/select-unit")
  }
  
  return (
    <div className="w-full bg-gray-50">
      <AuditLogManagement businessUnitId={businessUnitId} />
    </div>
  )
}