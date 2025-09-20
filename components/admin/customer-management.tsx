"use client"

import type React from "react"
import { useState, useTransition } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  X,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  Crown,
  Star,
  Calendar,
  DollarSign,
  Hash,
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CustomerType } from "@prisma/client"
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type CustomerWithDetails,
} from "@/lib/actions/customer-actions"
import { toast } from "sonner"

interface CustomerManagementProps {
  businessUnitId: string
  initialCustomers: CustomerWithDetails[]
}

interface CustomerFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  type: CustomerType
  allergies: string
  notes: string
}

const getCustomerTypeColor = (type: CustomerType) => {
  switch (type) {
    case CustomerType.VIP:
      return "bg-purple-100 text-purple-800"
    case CustomerType.REGULAR:
      return "bg-blue-100 text-blue-800"
    case CustomerType.WALK_IN:
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getCustomerTypeIcon = (type: CustomerType) => {
  switch (type) {
    case CustomerType.VIP:
      return Crown
    case CustomerType.REGULAR:
      return Star
    case CustomerType.WALK_IN:
      return User
    default:
      return User
  }
}

const CustomerForm = ({
  customer,
  onSubmit,
  onCancel,
  isLoading,
}: {
  customer?: CustomerWithDetails
  onSubmit: (data: CustomerFormData) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    type: customer?.type || CustomerType.WALK_IN,
    allergies: customer?.allergies || "",
    notes: customer?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
            placeholder="Enter first name"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
            placeholder="Enter last name"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Customer Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as CustomerType }))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CustomerType.WALK_IN}>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                Walk-in Customer
              </div>
            </SelectItem>
            <SelectItem value={CustomerType.REGULAR}>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Regular Customer
              </div>
            </SelectItem>
            <SelectItem value={CustomerType.VIP}>
              <div className="flex items-center">
                <Crown className="w-4 h-4 mr-2" />
                VIP Customer
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">Allergies</Label>
        <Input
          id="allergies"
          value={formData.allergies}
          onChange={(e) => setFormData((prev) => ({ ...prev, allergies: e.target.value }))}
          placeholder="Food allergies or dietary restrictions"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about the customer"
          rows={3}
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
              {customer ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{customer ? "Update Customer" : "Create Customer"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CustomerManagement({ businessUnitId, initialCustomers }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<CustomerWithDetails[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showInactive, setShowInactive] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.customerNumber.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === "all" || customer.type === selectedType
    const matchesActive = showInactive || customer.isActive
    
    return matchesSearch && matchesType && matchesActive
  })

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreateCustomer = (formData: CustomerFormData) => {
    startTransition(async () => {
      const customerData: CreateCustomerInput = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        type: formData.type,
        allergies: formData.allergies || undefined,
        notes: formData.notes || undefined,
      }

      const result = await createCustomer(businessUnitId, customerData)

      if (result.success && result.customer) {
        setCustomers((prev) => [result.customer!, ...prev])
        setIsCreateDialogOpen(false)
        toast.success("Customer created successfully")
      } else {
        toast.error(result.error || "Failed to create customer")
      }
    })
  }

  const handleUpdateCustomer = (formData: CustomerFormData) => {
    if (!selectedCustomer) return

    startTransition(async () => {
      const updateData: UpdateCustomerInput = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        type: formData.type,
        allergies: formData.allergies || undefined,
        notes: formData.notes || undefined,
      }

      const result = await updateCustomer(businessUnitId, selectedCustomer.id, updateData)

      if (result.success && result.customer) {
        setCustomers((prev) =>
          prev.map((customer) => (customer.id === selectedCustomer.id ? result.customer! : customer))
        )
        setIsEditDialogOpen(false)
        setSelectedCustomer(null)
        toast.success("Customer updated successfully")
      } else {
        toast.error(result.error || "Failed to update customer")
      }
    })
  }

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return

    startTransition(async () => {
      const result = await deleteCustomer(businessUnitId, selectedCustomer.id)

      if (result.success) {
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === selectedCustomer.id ? { ...customer, isActive: false } : customer
          )
        )
        setIsDeleteDialogOpen(false)
        setSelectedCustomer(null)
        toast.success("Customer deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete customer")
      }
    })
  }

  const handleToggleActive = (customer: CustomerWithDetails) => {
    startTransition(async () => {
      const result = await updateCustomer(businessUnitId, customer.id, {
        isActive: !customer.isActive,
      })

      if (result.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, isActive: !c.isActive } : c))
        )
        toast.success(`Customer ${!customer.isActive ? "activated" : "deactivated"} successfully`)
      } else {
        toast.error(result.error || "Failed to update customer status")
      }
    })
  }

  const formatPrice = (price: number) => `₱${price.toFixed(2)}`

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedType("all")
    setShowInactive(false)
    setCurrentPage(1)
  }

  const statsData = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((c) => c.isActive).length,
    vipCustomers: customers.filter((c) => c.type === CustomerType.VIP && c.isActive).length,
    regularCustomers: customers.filter((c) => c.type === CustomerType.REGULAR && c.isActive).length,
    walkInCustomers: customers.filter((c) => c.type === CustomerType.WALK_IN && c.isActive).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0
      : 0,
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
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Customer Type</Label>
              <Select value={selectedType} onValueChange={(value) => {
                setSelectedType(value)
                resetToFirstPage()
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={CustomerType.VIP}>
                    <div className="flex items-center">
                      <Crown className="w-4 h-4 mr-2 text-purple-500" />
                      VIP Customers
                    </div>
                  </SelectItem>
                  <SelectItem value={CustomerType.REGULAR}>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-2 text-blue-500" />
                      Regular Customers
                    </div>
                  </SelectItem>
                  <SelectItem value={CustomerType.WALK_IN}>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      Walk-in Customers
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <div className="flex items-center space-x-2 p-1 border border-gray-200 rounded-lg">
                <Switch id="show-inactive" checked={showInactive} onCheckedChange={(checked) => {
                  setShowInactive(checked)
                  resetToFirstPage()
                }} />
                <Label htmlFor="show-inactive" className="text-sm text-gray-600">
                  Show inactive customers
                </Label>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
              disabled={searchQuery === "" && selectedType === "all" && !showInactive}
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
                  <span className="text-gray-600 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-500" />
                    Total:
                  </span>
                  <span className="font-medium">{statsData.totalCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-500" />
                    Active:
                  </span>
                  <span className="font-medium text-green-600">{statsData.activeCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-500" />
                    VIP:
                  </span>
                  <span className="font-medium text-purple-600">{statsData.vipCustomers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-500" />
                    Regular:
                  </span>
                  <span className="font-medium text-blue-600">{statsData.regularCustomers}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    Total Revenue:
                  </span>
                  <span className="font-medium">{formatPrice(statsData.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    Avg Order:
                  </span>
                  <span className="font-medium">{formatPrice(statsData.avgOrderValue)}</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
              <p className="text-gray-600 mt-1">Manage your customer database and relationships</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Customer</DialogTitle>
                  <DialogDescription>Add a new customer to your database</DialogDescription>
                </DialogHeader>
                <CustomerForm
                  onSubmit={handleCreateCustomer}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-2">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery || selectedType !== "all" || showInactive
                  ? "No customers match your current filters. Try adjusting your search criteria."
                  : "Get started by adding your first customer to build your customer database."}
              </p>
              {!searchQuery && selectedType === "all" && !showInactive && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Orders</TableHead>
                      <TableHead className="font-semibold">Total Spent</TableHead>
                      <TableHead className="font-semibold">Last Visit</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => {
                      const TypeIcon = getCustomerTypeIcon(customer.type)
                      return (
                        <TableRow key={customer.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <TypeIcon className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900">
                                  {customer.firstName} {customer.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{customer.customerNumber}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {customer.email}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCustomerTypeColor(customer.type)}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {customer.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{customer.totalOrders}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium text-green-600">
                              {formatPrice(customer.totalSpent)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {customer.lastVisit ? (
                                <div className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {customer.lastVisit.toLocaleDateString()}
                                </div>
                              ) : (
                                <span className="text-gray-400">Never</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={customer.isActive ? "default" : "secondary"} className="font-normal">
                              {customer.isActive ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Inactive
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
                                    setSelectedCustomer(customer)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(customer)}>
                                  {customer.isActive ? (
                                    <>
                                      <EyeOff className="w-4 h-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-4 h-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedCustomer(customer)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600"
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
          {filteredCustomers.length > 0 && totalPages > 1 && (
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
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNum => {
                      if (pageNum === 1 || pageNum === totalPages) return true;
                      if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true;
                      return false;
                    })
                    .map((pageNum, index, arr) => (
                      <div key={pageNum} className="flex items-center">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              customer={selectedCustomer}
              onSubmit={handleUpdateCustomer}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedCustomer(null)
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
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedCustomer?.firstName} {selectedCustomer?.lastName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedCustomer(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Customer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}