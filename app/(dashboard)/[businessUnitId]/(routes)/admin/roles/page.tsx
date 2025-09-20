import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { RoleManagement } from "@/components/admin/role-management"
import { getRoles } from "@/lib/actions/role-management-actions"
import { getAllPermissions } from "@/lib/actions/user-management-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface RolesPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function RolesPage({ params }: RolesPageProps) {
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
  
  const [businessUnit, rolesResult, permissions] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getRoles(),
    getAllPermissions(),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }

  if (!rolesResult.success) {
    redirect(`/${businessUnitId}`)
  }
  
  return (
    <div className="w-full bg-gray-50">
      <RoleManagement 
        initialRoles={rolesResult.roles || []} 
        permissions={permissions}
      />
    </div>
  )
}