import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { MenuItemEditPage } from "@/components/admin/menu-item-edit-page"
import { getMenuItemById, getAllCategories } from "@/lib/actions/menu-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface EditMenuItemPageProps {
  params: Promise<{
    businessUnitId: string
    id: string
  }>
}

export default async function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  const { businessUnitId, id } = await params
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
  
  const [businessUnit, menuItem, categories] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getMenuItemById(businessUnitId, id),
    getAllCategories(businessUnitId),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }

  if (!menuItem) {
    redirect(`/${businessUnitId}/menu/menu-items`)
  }
  
  return (
    <MenuItemEditPage
      businessUnitId={businessUnitId}
      menuItem={menuItem}
      categories={categories.filter((c) => c.isActive)}
    />
  )
}
