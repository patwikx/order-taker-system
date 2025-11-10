import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { MenuItemCreatePage } from "@/components/admin/menu-item-create-page"
import { getAllCategories } from "@/lib/actions/menu-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"

interface CreateMenuItemPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function CreateMenuItemPage({ params }: CreateMenuItemPageProps) {
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
  
  const [businessUnit, categories] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getAllCategories(businessUnitId),
  ])
  
  if (!businessUnit) {
    redirect("/select-unit")
  }
  
  return (
    <MenuItemCreatePage
      businessUnitId={businessUnitId}
      categories={categories.filter((c) => c.isActive)}
    />
  )
}
