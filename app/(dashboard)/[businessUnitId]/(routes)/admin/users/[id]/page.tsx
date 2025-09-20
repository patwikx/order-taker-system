import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { UserPermissionManagement } from "@/components/admin/user-permission-management"
import { getUserById } from "@/lib/actions/user-management-actions"
import { getAllPermissions } from "@/lib/actions/user-management-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface UserPermissionPageProps {
  params: Promise<{
    businessUnitId: string
    id: string
  }>
}

export default async function UserPermissionPage({ params }: UserPermissionPageProps) {
  const { businessUnitId, id: userId } = await params
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
  
  const [businessUnit, userResult, permissions] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getUserById(userId),
    getAllPermissions(),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }

  if (!userResult.success || !userResult.user) {
    redirect(`/${businessUnitId}/admin/users`)
  }
  
  return (
    <div className="w-full bg-gray-50">
      <UserPermissionManagement 
        businessUnitId={businessUnitId}
        user={userResult.user}
        permissions={permissions}
      />
    </div>
  )
}