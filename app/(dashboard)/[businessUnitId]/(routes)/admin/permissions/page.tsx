import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PermissionManagement } from "@/components/admin/permission-management"
import { getPermissions } from "@/lib/actions/permission-management-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface PermissionsPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function PermissionsPage({ params }: PermissionsPageProps) {
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
  
  const [businessUnit, permissionsResult] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getPermissions(),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }

  if (!permissionsResult.success) {
    redirect(`/${businessUnitId}`)
  }
  
  return (
    <div className="w-full bg-gray-50">
      <PermissionManagement initialPermissions={permissionsResult.permissions || []} />
    </div>
  )
}