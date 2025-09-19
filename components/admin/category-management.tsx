"use client"

import type React from "react"

import { useState, useTransition } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  FolderOpen,
  Package,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type AdminCategoryData,
} from "@/lib/actions/menu-actions"
import { toast } from "sonner"

interface CategoryManagementProps {
  businessUnitId: string
  initialCategories: AdminCategoryData[]
}

interface CategoryFormData {
  name: string
  description: string
  sortOrder: number
}

const CategoryForm = ({
  category,
  onSubmit,
  onCancel,
  isLoading,
}: {
  category?: AdminCategoryData
  onSubmit: (data: CategoryFormData) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || "",
    description: category?.description || "",
    sortOrder: category?.sortOrder || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter category name"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Enter category description (optional)"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">Sort Order</Label>
        <Input
          id="sortOrder"
          type="number"
          value={formData.sortOrder}
          onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: Number.parseInt(e.target.value) || 0 }))}
          placeholder="0"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">Lower numbers appear first in the menu</p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {category ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{category ? "Update Category" : "Create Category"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CategoryManagement({ businessUnitId, initialCategories }: CategoryManagementProps) {
  const [categories, setCategories] = useState<AdminCategoryData[]>(initialCategories)
  const [searchQuery, setSearchQuery] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryData | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Filter categories based on search and active status
  const filteredCategories = categories.filter((category) => {
    const matchesSearch =
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesStatus = showInactive || category.isActive
    return matchesSearch && matchesStatus
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreateCategory = (formData: CategoryFormData) => {
    startTransition(async () => {
      const categoryData: CreateCategoryInput = {
        name: formData.name,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder,
      }

      const result = await createCategory(businessUnitId, categoryData)

      if (result.success && result.category) {
        setCategories((prev) => [
          ...prev,
          {
            id: result.category.id,
            name: result.category.name,
            description: result.category.description,
            sortOrder: result.category.sortOrder,
            isActive: result.category.isActive,
            itemCount: 0,
          },
        ])
        setIsCreateDialogOpen(false)
        toast.success("Category created successfully") 
      } else {
        toast.error(result.error || "Failed to create category") 
      }
    })
  }

  const handleUpdateCategory = (formData: CategoryFormData) => {
    if (!selectedCategory) return

    startTransition(async () => {
      const updateData: UpdateCategoryInput = {
        name: formData.name,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder,
      }

      const result = await updateCategory(businessUnitId, selectedCategory.id, updateData)

      if (result.success && result.category) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === selectedCategory.id 
              ? { 
                  ...cat, 
                  name: result.category.name,
                  description: result.category.description,
                  sortOrder: result.category.sortOrder,
                  isActive: result.category.isActive,
                } 
              : cat,
          ),
        )
        setIsEditDialogOpen(false)
        setSelectedCategory(null)
        toast.success("Category updated successfully")
      } else {
        toast.error(result.error || "Failed to update category")
      }
    })
  }

  const handleDeleteCategory = () => {
    if (!selectedCategory) return

    startTransition(async () => {
      const result = await deleteCategory(businessUnitId, selectedCategory.id)

      if (result.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === selectedCategory.id ? { ...cat, isActive: false } : cat,
          ),
        )
        setIsDeleteDialogOpen(false)
        setSelectedCategory(null)
        toast.success("Category deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete category")
      }
    })
  }

  const handleToggleStatus = (category: AdminCategoryData) => {
    startTransition(async () => {
      const result = await updateCategory(businessUnitId, category.id, {
        isActive: !category.isActive,
      })

      if (result.success) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === category.id ? { ...cat, isActive: !cat.isActive } : cat,
          ),
        )
        toast.success(`Category ${!category.isActive ? "enabled" : "disabled"} successfully`)
      } else {
        toast.error(result.error || "Failed to update category status")
      }
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setShowInactive(false)
    setCurrentPage(1)
  }

  const statsData = {
    totalCategories: categories.length,
    activeCategories: categories.filter((c) => c.isActive).length,
    totalMenuItems: categories.reduce((sum, cat) => sum + cat.itemCount, 0),
    avgItemsPerCategory: categories.length > 0 
      ? Math.round(categories.reduce((sum, cat) => sum + cat.itemCount, 0) / categories.length)
      : 0,
    categoriesWithItems: categories.filter((c) => c.itemCount > 0).length,
    emptyCategoriesCount: categories.filter((c) => c.itemCount === 0).length,
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
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
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
                  Show disabled menu categories
                </Label>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
              disabled={searchQuery === "" && !showInactive}
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
                  <span className="text-gray-600">Total Categories:</span>
                  <span className="font-medium">{statsData.totalCategories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Enabled:</span>
                  <span className="font-medium text-green-600">{statsData.activeCategories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Items:</span>
                  <span className="font-medium">{statsData.totalMenuItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Items/Cat:</span>
                  <span className="font-medium">{statsData.avgItemsPerCategory}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">With Items:</span>
                  <span className="font-medium text-blue-600">{statsData.categoriesWithItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Empty:</span>
                  <span className="font-medium text-gray-500">{statsData.emptyCategoriesCount}</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600 mt-1">Manage your menu categories and organization</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>Add a new category to organize your menu items</DialogDescription>
                </DialogHeader>
                <CategoryForm
                  onSubmit={handleCreateCategory}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-2">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery || showInactive
                  ? "No categories match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first category to organize your menu items."}
              </p>
              {!searchQuery && !showInactive && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Category
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Sort Order</TableHead>
                      <TableHead className="font-semibold">Items</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.map((category) => (
                      <TableRow key={category.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FolderOpen className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{category.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-gray-600" title={category.description}>
                            {category.description || <span className="text-gray-400">No description</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {category.sortOrder}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4 text-gray-400" />
                            <Badge variant={category.itemCount > 0 ? "secondary" : "outline"} className="font-normal">
                              {category.itemCount}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? "default" : "secondary"} className="font-normal">
                            {category.isActive ? (
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
                                  setSelectedCategory(category)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(category)}>
                                {category.isActive ? (
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
                                  setSelectedCategory(category)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                                disabled={category.itemCount > 0}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredCategories.length > 0 && totalPages > 1 && (
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
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update the category information</DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <CategoryForm
              category={selectedCategory}
              onSubmit={handleUpdateCategory}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedCategory(null)
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
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name}&quot;? This action cannot be undone.
              {selectedCategory?.itemCount && selectedCategory.itemCount > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-600 text-sm">
                    This category has {selectedCategory.itemCount} menu items and cannot be deleted. Please move the items to another category first.
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
                setSelectedCategory(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={isPending || (selectedCategory?.itemCount ?? 0) > 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Category"
              )}
            </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}