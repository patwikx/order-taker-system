import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { RolePermissionManagement } from "@/components/admin/role-permission-management"
import { getRoleById } from "@/lib/actions/role-management-actions"
import { getAllPermissions } from "@/lib/actions/user-management-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface RolePermissionPageProps {
  params: Promise<{
    businessUnitId: string
    id: string
  }>
}

export default async function RolePermissionPage({ params }: RolePermissionPageProps) {
  const { businessUnitId, id: roleId } = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/sign-in")
  }
  
  // Check if user has admin access
  const isAdmin = session.user.assignments.some(
    (assignment) =>
      assignment.businessUnitId === businessUnitId &&
      assignment.isActive &&
      (assignment.role.name === "admin" || assignment.role.name === "ADMIN" || assignment.role.name === "manager"),
  )
  
  if (!isAdmin) {
    redirect(`/${businessUnitId}`)
  }
  
  const [businessUnit, roleResult, permissions] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getRoleById(roleId),
    getAllPermissions(),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }

  if (!roleResult.success || !roleResult.role) {
    redirect(`/${businessUnitId}/admin/roles`)
  }
  
  return (
    <div className="w-full bg-gray-50">
      <RolePermissionManagement 
        businessUnitId={businessUnitId}
        role={roleResult.role}
        permissions={permissions}
      />
    </div>
  )
}