import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { CategoryManagement } from "@/components/admin/category-management"
import { MenuItemManagement } from "@/components/admin/menu-item-management"
import { TableManagement } from "@/components/admin/table-management"
import { CustomerManagement } from "@/components/admin/customer-management"
import { AuditLogManagement } from "@/components/admin/audit-log-management"
import { SettingsManagement } from "@/components/admin/settings-management"
import { getAllCategories, getAllMenuItems } from "@/lib/actions/menu-actions"
import { getAllTables } from "@/lib/actions/table-actions"
import { getAllCustomers } from "@/lib/actions/customer-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, Package, Users, Shield, Clock, TrendingUp, Database, Settings as SettingsIcon } from "lucide-react"

interface AdminPageProps {
  params: Promise<{
    businessUnitId: string
  }>
}

export default async function AdminPage({ params }: AdminPageProps) {
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

  // Fetch all data needed for admin dashboard
  const [businessUnit, categories, menuItems, tables, customers] = await Promise.all([
    getBusinessUnit(businessUnitId),
    getAllCategories(businessUnitId),
    getAllMenuItems(businessUnitId),
    getAllTables(businessUnitId),
    getAllCustomers(businessUnitId),
  ])

  if (!businessUnit) {
    redirect("/select-unit")
  }

  // Calculate stats
  const activeCategories = categories.filter((c) => c.isActive).length
  const availableMenuItems = menuItems.filter((m) => m.isAvailable).length
  const activeTables = tables.filter((t) => t.isActive).length
  const occupiedTables = tables.filter((t) => t.status === "OCCUPIED" && t.isActive).length
  const totalCapacity = tables.filter((t) => t.isActive).reduce((sum, table) => sum + table.capacity, 0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const activeCustomers = customers.filter((c) => c.isActive).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage {businessUnit.name} - {businessUnit.code}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                Administrator
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleTimeString("en-PH", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: businessUnit.timezone,
                })}
              </Badge>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCategories}</div>
              <p className="text-xs text-muted-foreground">{categories.length - activeCategories} inactive</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableMenuItems}</div>
              <p className="text-xs text-muted-foreground">{menuItems.length - availableMenuItems} unavailable</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tables</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTables}</div>
              <p className="text-xs text-muted-foreground">
                {occupiedTables} occupied • {totalCapacity} capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeTables > 0 ? Math.round((occupiedTables / activeTables) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {occupiedTables} of {activeTables} tables
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="menu-items" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManagement businessUnitId={businessUnitId} initialCategories={categories} />
          </TabsContent>

          <TabsContent value="menu-items" className="space-y-6">
            <MenuItemManagement
              businessUnitId={businessUnitId}
              initialMenuItems={menuItems}
              categories={categories.filter((c) => c.isActive)}
            />
          </TabsContent>

          <TabsContent value="tables" className="space-y-6">
            <TableManagement businessUnitId={businessUnitId} initialTables={tables} />
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerManagement businessUnitId={businessUnitId} initialCustomers={customers} />
          </TabsContent>

          <TabsContent value="audit-logs" className="space-y-6">
            <AuditLogManagement businessUnitId={businessUnitId} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}