import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { UserManagement } from "@/components/admin/user-management"
import { getAllUsers, getAllRoles, getAllPermissions } from "@/lib/actions/user-management-actions"
import { getBusinessUnit, getAllBusinessUnits } from "@/lib/actions/business-unit-actions"

interface UsersPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function UsersPage({ params }: UsersPageProps) {
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

  const [businessUnit, users, businessUnits, roles, permissions] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getAllUsers(),
    getAllBusinessUnits(),
    getAllRoles(),
    getAllPermissions(),
  ])

  if (!businessUnit) {
    redirect("/select-unit")
  }

  return (
    <div className="w-full bg-gray-50">
      <UserManagement
        businessUnitId={businessUnitId}
        initialUsers={users}
        businessUnits={businessUnits}
        roles={roles}
        permissions={permissions}
      />
    </div>
  )
}
