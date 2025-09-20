import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { CustomerManagement } from "@/components/admin/customer-management"
import { getAllCustomers } from "@/lib/actions/customer-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface CustomersPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function CustomersPage({ params }: CustomersPageProps) {
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
  
  const [businessUnit, customers] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getAllCustomers(businessUnitId),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }
  
  return (
    <div className="w-full bg-gray-50">
      <CustomerManagement businessUnitId={businessUnitId} initialCustomers={customers} />
    </div>
  )
}