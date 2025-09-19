/* eslint-disable @next/next/no-img-element */
"use client"

import type React from "react"

import { useState, useTransition } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Coffee,
  Utensils,
  Eye,
  EyeOff,
  Filter,
  X,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Equal,
  HashIcon,
  XCircle,
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
import { ItemType } from "@prisma/client"
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  type CreateMenuItemInput,
  type UpdateMenuItemInput,
  type MenuItemWithCategory,
} from "@/lib/actions/menu-actions"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface MenuItemManagementProps {
  businessUnitId: string
  initialMenuItems: MenuItemWithCategory[]
  categories: Category[]
}

interface MenuItemFormData {
  name: string
  description: string
  price: number
  categoryId: string
  type: ItemType
  prepTime: number
  imageUrl: string
}

const getTypeIcon = (type: ItemType) => {
  switch (type) {
    case ItemType.FOOD:
      return Utensils
    case ItemType.DRINK:
      return Coffee
    default:
      return Package
  }
}

const getTypeColor = (type: ItemType) => {
  switch (type) {
    case ItemType.FOOD:
      return "bg-orange-100 text-orange-800"
    case ItemType.DRINK:
      return "bg-cyan-100 text-cyan-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const MenuItemForm = ({
  menuItem,
  categories,
  onSubmit,
  onCancel,
  isLoading,
}: {
  menuItem?: MenuItemWithCategory
  categories: Category[]
  onSubmit: (data: MenuItemFormData) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: menuItem?.name || "",
    description: menuItem?.description || "",
    price: menuItem?.price || 0,
    categoryId: menuItem?.categoryId || "",
    type: menuItem?.type || ItemType.FOOD,
    prepTime: menuItem?.prepTime || 15,
    imageUrl: menuItem?.imageUrl || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter item name"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter item description (optional)"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as ItemType }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ItemType.FOOD}>
                <div className="flex items-center">
                  <Utensils className="w-4 h-4 mr-2" />
                  Food
                </div>
              </SelectItem>
              <SelectItem value={ItemType.DRINK}>
                <div className="flex items-center">
                  <Coffee className="w-4 h-4 mr-2" />
                  Drink
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prepTime">Prep Time (minutes)</Label>
          <Input
            id="prepTime"
            type="number"
            min="1"
            value={formData.prepTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, prepTime: Number.parseInt(e.target.value) || 15 }))}
            placeholder="15"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://example.com/image.jpg"
            disabled={isLoading}
          />
        </div>
      </div>

      {formData.imageUrl && (
        <div className="space-y-2">
          <Label>Image Preview</Label>
          <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={formData.imageUrl || "/placeholder.svg"}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
          </div>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.categoryId}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {menuItem ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{menuItem ? "Update Item" : "Create Item"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function MenuItemManagement({ businessUnitId, initialMenuItems, categories }: MenuItemManagementProps) {
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>(initialMenuItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showUnavailable, setShowUnavailable] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemWithCategory | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Filter menu items based on search, category, type, and availability
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      item.category.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory
    const matchesType = selectedType === "all" || item.type === selectedType
    const matchesAvailability = showUnavailable || item.isAvailable
    return matchesSearch && matchesCategory && matchesType && matchesAvailability
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredMenuItems.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreateMenuItem = (formData: MenuItemFormData) => {
    startTransition(async () => {
      const menuItemData: CreateMenuItemInput = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        categoryId: formData.categoryId,
        type: formData.type,
        prepTime: formData.prepTime || undefined,
        imageUrl: formData.imageUrl || undefined,
      }

      const result = await createMenuItem(businessUnitId, menuItemData)

      if (result.success && result.menuItem) {
        setMenuItems((prev) => [...prev, result.menuItem])
        setIsCreateDialogOpen(false)
        toast.success("Menu item created successfully.")
      } else {
        toast.error("Failed to create menu item.")
      }
    })
  }

  const handleUpdateMenuItem = (formData: MenuItemFormData) => {
    if (!selectedMenuItem) return

    startTransition(async () => {
      const updateData: UpdateMenuItemInput = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        categoryId: formData.categoryId,
        type: formData.type,
        prepTime: formData.prepTime || undefined,
        imageUrl: formData.imageUrl || undefined,
      }

      const result = await updateMenuItem(businessUnitId, selectedMenuItem.id, updateData)

      if (result.success && result.menuItem) {
        setMenuItems((prev) => prev.map((item) => (item.id === selectedMenuItem.id ? result.menuItem : item)))
        setIsEditDialogOpen(false)
        setSelectedMenuItem(null)
        toast.success("Menu item updated successfully.")
      } else {
        toast.error("Failed to update menu item.")
      }
    })
  }

  const handleDeleteMenuItem = () => {
    if (!selectedMenuItem) return

    startTransition(async () => {
      const result = await deleteMenuItem(businessUnitId, selectedMenuItem.id)

      if (result.success) {
        setMenuItems((prev) => prev.filter((item) => item.id !== selectedMenuItem.id))
        setIsDeleteDialogOpen(false)
        setSelectedMenuItem(null)
        toast.success("Menu item deleted successfully.")
      } else {
        toast.error("Failed to delete menu item.")
      }
    })
  }

  const handleToggleAvailability = (menuItem: MenuItemWithCategory) => {
    startTransition(async () => {
      const result = await updateMenuItem(businessUnitId, menuItem.id, {
        isAvailable: !menuItem.isAvailable,
      })

      if (result.success) {
        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === menuItem.id ? { ...item, isAvailable: !item.isAvailable, updatedAt: new Date() } : item,
          ),
        )
        toast.success(`Menu item ${!menuItem.isAvailable ? "Enabled" : "Disabled"} successfully.`)
      } else {
        toast.error(`${result.error}` || "Failed to update menu item availability.")
      }
    })
  }

  const formatPrice = (price: number) => `₱${price.toFixed(2)}`

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedType("all")
    setShowUnavailable(false)
    setCurrentPage(1)
  }

  const statsData = {
    totalItems: menuItems.length,
    availableItems: menuItems.filter((i) => i.isAvailable).length,
    unavailableItems: menuItems.filter((i) => !i.isAvailable).length,
    foodItems: menuItems.filter((i) => i.type === ItemType.FOOD && i.isAvailable).length,
    drinkItems: menuItems.filter((i) => i.type === ItemType.DRINK && i.isAvailable).length,
    avgPrice: menuItems.length > 0 ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length : 0,
    highestPrice: menuItems.length > 0 ? Math.max(...menuItems.map(item => item.price)) : 0,
    lowestPrice: menuItems.length > 0 ? Math.min(...menuItems.map(item => item.price)) : 0,
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
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Category</Label>
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value)
                resetToFirstPage()
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Type</Label>
              <Select value={selectedType} onValueChange={(value) => {
                setSelectedType(value)
                resetToFirstPage()
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={ItemType.FOOD}>
                    <div className="flex items-center">
                      <Utensils className="w-4 h-4 mr-2 text-orange-500" />
                      Food
                    </div>
                  </SelectItem>
                  <SelectItem value={ItemType.DRINK}>
                    <div className="flex items-center">
                      <Coffee className="w-4 h-4 mr-2 text-cyan-500" />
                      Drinks
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability Toggle */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Availability</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Switch id="show-unavailable" checked={showUnavailable} onCheckedChange={(checked) => {
                  setShowUnavailable(checked)
                  resetToFirstPage()
                }} />
                <Label htmlFor="show-unavailable" className="text-sm text-gray-600">
                  Show disabled menu items
                </Label>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
              disabled={searchQuery === "" && selectedCategory === "all" && selectedType === "all" && !showUnavailable}
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
              
              <div className="space-y-3 text-sm">
                {/* Basic counts */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <HashIcon className="w-3 h-3 mr-1 text-blue-500" />
                      <span className="text-gray-600">Total Items:</span>
                    </div>
                    <span className="font-medium">{statsData.totalItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                                   <div className="flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-gray-600">Enabled:</span>
                    </div>
                    <span className="font-medium text-green-600">{statsData.availableItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                                       <div className="flex items-center">
                      <XCircle className="w-3 h-3 mr-1 text-red-500" />
                      <span className="text-gray-600">Disabled:</span>
                    </div>
                    <span className="font-medium text-red-600">{statsData.unavailableItems}</span>
                  </div>
                </div>

                <Separator />

                {/* Type breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Utensils className="w-3 h-3 mr-1 text-orange-500" />
                      <span className="text-gray-600">Food Items:</span>
                    </div>
                    <span className="font-medium">{statsData.foodItems}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Coffee className="w-3 h-3 mr-1 text-cyan-500" />
                      <span className="text-gray-600">Drinks:</span>
                    </div>
                    <span className="font-medium">{statsData.drinkItems}</span>
                  </div>
                </div>

                <Separator />

                {/* Pricing info */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                   <div className="flex items-center">
                      <Equal className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-gray-600">Avg Price:</span>
                    </div>
                    <span className="font-medium">{formatPrice(statsData.avgPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                      <span className="text-gray-600">Highest:</span>
                    </div>
                    <span className="font-medium">{formatPrice(statsData.highestPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                      <span className="text-gray-600">Lowest:</span>
                    </div>
                    <span className="font-medium">{formatPrice(statsData.lowestPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
              <p className="text-gray-600 mt-1">Manage your menu items and pricing</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Menu Item</DialogTitle>
                  <DialogDescription>Add a new item to your menu</DialogDescription>
                </DialogHeader>
                <MenuItemForm
                  categories={categories.filter((c) => c.isActive)}
                  onSubmit={handleCreateMenuItem}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 p-2">
          {filteredMenuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery || selectedCategory !== "all" || selectedType !== "all" || showUnavailable
                  ? "No items match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first menu item to build your menu."}
              </p>
              {!searchQuery && selectedCategory === "all" && selectedType === "all" && !showUnavailable && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Menu Item
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Item</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold">Prep Time</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Last Updated</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => {
                      const TypeIcon = getTypeIcon(item.type)
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <TypeIcon className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 truncate">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs" title={item.description}>
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              <Package className="w-3 h-3 mr-1" />
                              {item.category.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(item.type)}>
                              <TypeIcon className="w-3 h-3 mr-1" />
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-gray-900">{formatPrice(item.price)}</div>
                          </TableCell>
                          <TableCell>
                            {item.prepTime ? (
                              <div className="flex items-center space-x-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{item.prepTime}m</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.isAvailable ? "default" : "secondary"} className="font-normal">
                              {item.isAvailable ? (
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
                          <TableCell className="text-sm text-gray-500">
                            {item.updatedAt.toLocaleDateString()}
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
                                    setSelectedMenuItem(item)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleAvailability(item)}>
                                  {item.isAvailable ? (
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
                                    setSelectedMenuItem(item)
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
          {filteredMenuItems.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredMenuItems.length} items)
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>Update the menu item information</DialogDescription>
          </DialogHeader>
          {selectedMenuItem && (
            <MenuItemForm
              menuItem={selectedMenuItem}
              categories={categories.filter((c) => c.isActive)}
              onSubmit={handleUpdateMenuItem}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedMenuItem(null)
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
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedMenuItem?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedMenuItem(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMenuItem} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}