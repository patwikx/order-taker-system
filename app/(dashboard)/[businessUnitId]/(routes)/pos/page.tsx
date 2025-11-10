// app/(dashboard)/[businessUnitId]/(routes)/pos/page.tsx
import { getTables } from "@/lib/actions/table-actions"
import { getCategories, getMenuItems } from "@/lib/actions/menu-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"
import WaiterOrderSystem from "@/components/waiter-order-system/waiter-order-system-page"

interface Props {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function POSPage({ params }: Props) {
  const { businessUnitId } = await params

  try {
    // Fetch all data in parallel on the server
    const [tablesData, categoriesData, menuItemsData, businessUnitData] = await Promise.all([
      getTables(businessUnitId),
      getCategories(businessUnitId),
      getMenuItems(businessUnitId),
      getBusinessUnit(businessUnitId)
    ])

    return (
      <WaiterOrderSystem
        businessUnitId={businessUnitId}
        initialData={{
          tables: tablesData,
          categories: categoriesData,
          menuItems: menuItemsData,
          businessUnit: businessUnitData
        }}
      />
    )
  } catch (error) {
    console.error("Error loading POS page data:", error)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Data</h1>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    )
  }
}