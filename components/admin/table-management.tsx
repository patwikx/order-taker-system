"use client"

import type React from "react"

import { useState, useTransition } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  Filter,
  X,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { TableStatus } from "@prisma/client"
import {
  createTable,
  updateTable,
  deleteTable,
  type CreateTableInput,
  type UpdateTableInput,
} from "@/lib/actions/table-actions"
import { toast } from "sonner"

interface TableWithDetails {
  id: string
  businessUnitId: string
  number: number
  capacity: number
  status: TableStatus
  location?: string
  isActive: boolean
  totalOrders: number
  currentOrder?: {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
    customerCount?: number
    isWalkIn: boolean
    walkInName?: string
    createdAt: Date
    customer?: {
      firstName?: string
      lastName?: string
    }
  }
}

interface TableManagementProps {
  businessUnitId: string
  initialTables: TableWithDetails[]
}

interface TableFormData {
  number: number
  capacity: number
  location: string
}

const getStatusColor = (status: TableStatus) => {
  switch (status) {
    case TableStatus.AVAILABLE:
      return "bg-green-100 text-green-800"
    case TableStatus.OCCUPIED:
      return "bg-blue-100 text-blue-800"
    case TableStatus.RESERVED:
      return "bg-yellow-100 text-yellow-800"
    case TableStatus.OUT_OF_ORDER:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: TableStatus) => {
  switch (status) {
    case TableStatus.AVAILABLE:
      return CheckCircle2
    case TableStatus.OCCUPIED:
      return Users
    case TableStatus.RESERVED:
      return Clock
    case TableStatus.OUT_OF_ORDER:
      return AlertCircle
    default:
      return AlertCircle
  }
}

const TableForm = ({
  table,
  onSubmit,
  onCancel,
  isLoading,
}: {
  table?: TableWithDetails
  onSubmit: (data: TableFormData) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<TableFormData>({
    number: table?.number || 1,
    capacity: table?.capacity || 4,
    location: table?.location || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Table Number *</Label>
          <Input
            id="number"
            type="number"
            min="1"
            value={formData.number}
            onChange={(e) => setFormData((prev) => ({ ...prev, number: Number.parseInt(e.target.value) || 1 }))}
            placeholder="1"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            max="20"
            value={formData.capacity}
            onChange={(e) => setFormData((prev) => ({ ...prev, capacity: Number.parseInt(e.target.value) || 4 }))}
            placeholder="4"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
          placeholder="e.g., Main Floor, Patio, VIP Section"
          disabled={isLoading}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {table ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{table ? "Update Table" : "Create Table"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function TableManagement({ businessUnitId, initialTables }: TableManagementProps) {
  const [tables, setTables] = useState<TableWithDetails[]>(initialTables)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableWithDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Get unique locations for filter
  const locations = Array.from(new Set(tables.map((table) => table.location).filter(Boolean)))

  // Filter tables based on search, status, location, and active status
  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.number.toString().includes(searchQuery) ||
      (table.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = selectedStatus === "all" || table.status === selectedStatus
    const matchesLocation = selectedLocation === "all" || table.location === selectedLocation
    const matchesActive = showInactive || table.isActive
    return matchesSearch && matchesStatus && matchesLocation && matchesActive
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredTables.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTables = filteredTables.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreateTable = (formData: TableFormData) => {
    startTransition(async () => {
      const tableData: CreateTableInput = {
        number: formData.number,
        capacity: formData.capacity,
        location: formData.location || undefined,
      }

      const result = await createTable(businessUnitId, tableData)

      if (result.success && result.table) {
        setTables((prev) => [
          ...prev,
          {
            ...result.table,
            totalOrders: 0,
          },
        ])
        setIsCreateDialogOpen(false)
        toast.success("Table created successfully")
      } else {
        toast.error("Failed to create table.")
      }
    })
  }

  const handleUpdateTable = (formData: TableFormData) => {
    if (!selectedTable) return

    startTransition(async () => {
      const updateData: UpdateTableInput = {
        number: formData.number,
        capacity: formData.capacity,
        location: formData.location || undefined,
      }

      const result = await updateTable(businessUnitId, selectedTable.id, updateData)

      if (result.success && result.table) {
        setTables((prev) =>
          prev.map((table) => (table.id === selectedTable.id ? { ...table, ...result.table } : table)),
        )
        setIsEditDialogOpen(false)
        setSelectedTable(null)
        toast.success("Table updated successfully.")
      } else {
        toast.error("Failed to update table.")
      }
    })
  }

  const handleDeleteTable = () => {
    if (!selectedTable) return

    startTransition(async () => {
      const result = await deleteTable(businessUnitId, selectedTable.id)

      if (result.success) {
        setTables((prev) => prev.filter((table) => table.id !== selectedTable.id))
        setIsDeleteDialogOpen(false)
        setSelectedTable(null)
        toast.success("Table deleted successfully.")
      } else {
        toast.error("Failed to delete table.")
      }
    })
  }

  const handleUpdateStatus = (table: TableWithDetails, newStatus: TableStatus) => {
    startTransition(async () => {
      const result = await updateTable(businessUnitId, table.id, {
        status: newStatus,
      })

      if (result.success) {
        setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, status: newStatus } : t)))
        toast.success(`Table ${table.number} status updated to ${newStatus.toLowerCase()}`)
      } else {
        toast.error(`${result.error}` || "Failed to update table status.")
      }
    })
  }

  const handleToggleActive = (table: TableWithDetails) => {
    startTransition(async () => {
      const result = await updateTable(businessUnitId, table.id, {
        isActive: !table.isActive,
      })

      if (result.success) {
        setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, isActive: !t.isActive } : t)))
        toast.success(`Table ${table.number} ${!table.isActive ? "activated" : "deactivated"} successfully.`)
      } else { 
        toast.error(`${result.error}` || "Failed to update table status.")
      }
    })
  }

  const formatPrice = (price: number) => `₱${price.toFixed(2)}`

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedStatus("all")
    setSelectedLocation("all")
    setShowInactive(false)
    setCurrentPage(1)
  }

  const statsData = {
    totalTables: tables.length,
    activeTables: tables.filter((t) => t.isActive).length,
    availableTables: tables.filter((t) => t.status === TableStatus.AVAILABLE && t.isActive).length,
    occupiedTables: tables.filter((t) => t.status === TableStatus.OCCUPIED && t.isActive).length,
    reservedTables: tables.filter((t) => t.status === TableStatus.RESERVED && t.isActive).length,
    totalCapacity: tables.filter((t) => t.isActive).reduce((sum, table) => sum + table.capacity, 0),
    avgCapacity: tables.length > 0 ? tables.reduce((sum, table) => sum + table.capacity, 0) / tables.length : 0,
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-16'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Filters</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sidebar Content */}
        {isSidebarOpen && (
          <div className="flex-1 p-4 space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tables..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value)
                resetToFirstPage()
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={TableStatus.AVAILABLE}>
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Available
                    </div>
                  </SelectItem>
                  <SelectItem value={TableStatus.OCCUPIED}>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-blue-500" />
                      Occupied
                    </div>
                  </SelectItem>
                  <SelectItem value={TableStatus.RESERVED}>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                      Reserved
                    </div>
                  </SelectItem>
                  <SelectItem value={TableStatus.OUT_OF_ORDER}>
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                      Out of Order
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            {locations.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Location</Label>
                <Select value={selectedLocation} onValueChange={(value) => {
                  setSelectedLocation(value)
                  resetToFirstPage()
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location!}>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {location}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Active Status Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <div className="flex items-center space-x-2 p-1 border border-gray-200 rounded-lg">
                <Switch id="show-inactive" checked={showInactive} onCheckedChange={(checked) => {
                  setShowInactive(checked)
                  resetToFirstPage()
                }} />
                <Label htmlFor="show-inactive" className="text-sm text-gray-600">
                  Show disabled tables
                </Label>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
              disabled={searchQuery === "" && selectedStatus === "all" && selectedLocation === "all" && !showInactive}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>

            <Separator />

            {/* Quick Stats */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Quick Stats
              </Label>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Tables:</span>
                  <span className="font-medium">{statsData.totalTables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Enabled:</span>
                  <span className="font-medium text-blue-600">{statsData.activeTables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-green-600">{statsData.availableTables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Occupied:</span>
                  <span className="font-medium text-blue-600">{statsData.occupiedTables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reserved:</span>
                  <span className="font-medium text-yellow-600">{statsData.reservedTables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Capacity:</span>
                  <span className="font-medium">{statsData.totalCapacity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Capacity:</span>
                  <span className="font-medium">{statsData.avgCapacity.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
              <p className="text-gray-600 mt-1">Manage your restaurant tables and seating arrangements</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Table</DialogTitle>
                  <DialogDescription>Add a new table to your restaurant</DialogDescription>
                </DialogHeader>
                <TableForm
                  onSubmit={handleCreateTable}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-2">
          {filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery || selectedStatus !== "all" || selectedLocation !== "all" || showInactive
                  ? "No tables match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first table for your restaurant."}
              </p>
              {!searchQuery && selectedStatus === "all" && selectedLocation === "all" && !showInactive && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Table
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Table</TableHead>
                      <TableHead className="font-semibold">Capacity</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Current Order</TableHead>
                      <TableHead className="font-semibold">Total Orders</TableHead>
                      <TableHead className="font-semibold">Enabled</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTables.map((table) => {
                      const StatusIcon = getStatusIcon(table.status)
                      return (
                        <TableRow key={table.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-blue-600">{table.number}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900">Table {table.number}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-gray-600">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">{table.capacity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {table.location ? (
                              <Badge variant="outline" className="font-normal">
                                {table.location}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(table.status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {table.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {table.currentOrder ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm text-gray-900">{table.currentOrder.orderNumber}</div>
                                <div className="text-xs text-gray-500">
                                  {formatPrice(table.currentOrder.totalAmount)} • {table.currentOrder.customerCount || 1} guests
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">{table.totalOrders}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={table.isActive ? "default" : "secondary"} className="font-normal">
                              {table.isActive ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Disabled
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTable(table)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(table, TableStatus.AVAILABLE)}
                                  disabled={table.status === TableStatus.AVAILABLE}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                  Available
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(table, TableStatus.RESERVED)}
                                  disabled={table.status === TableStatus.RESERVED}
                                >
                                  <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                                  Reserved
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleUpdateStatus(table, TableStatus.OUT_OF_ORDER)}
                                  disabled={table.status === TableStatus.OUT_OF_ORDER}
                                >
                                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                                  Out of Order
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleActive(table)}>
                                  {table.isActive ? (
                                    <>
                                      <EyeOff className="w-4 h-4 mr-2" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Enable
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTable(table)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                  disabled={!!table.currentOrder}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredTables.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNum => {
                      // Show first page, last page, current page, and pages around current
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                      return false;
                    })
                    .map((pageNum, index, arr) => (
                      <div key={pageNum} className="flex items-center">
                        {/* Add ellipsis if there's a gap */}
                        {index > 0 && pageNum > arr[index - 1] + 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      </div>
                    ))
                  }
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update the table information</DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <TableForm
              table={selectedTable}
              onSubmit={handleUpdateTable}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedTable(null)
              }}
              isLoading={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Table {selectedTable?.number}? This action cannot be undone.
              {selectedTable?.currentOrder && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600 text-sm">
                    This table has an active order and cannot be deleted. Please complete or cancel the order first.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedTable(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTable}
              disabled={isPending || !!selectedTable?.currentOrder}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Table"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}