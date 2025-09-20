import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { SettingsManagement } from "@/components/admin/settings-management"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface SettingsPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
      <SettingsManagement />
    </div>
  )
}