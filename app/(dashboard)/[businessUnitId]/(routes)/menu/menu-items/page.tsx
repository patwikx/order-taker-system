import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { MenuItemManagement } from "@/components/admin/menu-item-management"
import { getAllCategories, getAllMenuItems } from "@/lib/actions/menu-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface MenuItemsPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function MenuItemsPage({ params }: MenuItemsPageProps) {
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
  
  const [businessUnit, categories, menuItems] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getAllCategories(businessUnitId),
    getAllMenuItems(businessUnitId),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }
  
  return (
    <div className="w-full bg-gray-50">
      <MenuItemManagement
        businessUnitId={businessUnitId}
        initialMenuItems={menuItems}
        categories={categories.filter((c) => c.isActive)}
      />
    </div>
  )
}