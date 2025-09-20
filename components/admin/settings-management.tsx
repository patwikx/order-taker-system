"use client"

import type React from "react"
import { useState, useTransition, useEffect } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Settings,
  Key,
  Loader2,
  Filter,
  X,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Hash,
  RefreshCw,
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
import { Separator } from "@/components/ui/separator"
import {
  getSettings,
  createSetting,
  updateSetting,
  deleteSetting,
  type CreateSettingInput,
  type UpdateSettingInput,
  type SettingEntry,
} from "@/lib/actions/settings-actions"
import { toast } from "sonner"


interface SettingFormData {
  key: string
  value: string
  description: string
}

const SettingForm = ({
  setting,
  onSubmit,
  onCancel,
  isLoading,
}: {
  setting?: SettingEntry
  onSubmit: (data: SettingFormData) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<SettingFormData>({
    key: setting?.key || "",
    value: setting?.value || "",
    description: setting?.description || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="key">Setting Key *</Label>
        <Input
          id="key"
          value={formData.key}
          onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
          placeholder="e.g., default_tax_rate, max_table_capacity"
          required
          disabled={isLoading || !!setting} // Disable editing key for existing settings
        />
        <p className="text-xs text-gray-500">
          {setting ? "Setting key cannot be changed" : "Use lowercase with underscores (snake_case)"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Value *</Label>
        <Input
          id="value"
          value={formData.value}
          onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
          placeholder="Enter setting value"
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
          placeholder="Describe what this setting controls"
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
              {setting ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{setting ? "Update Setting" : "Create Setting"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function SettingsManagement({}) {
  const [settings, setSettings] = useState<SettingEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSetting, setSelectedSetting] = useState<SettingEntry | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Load settings
  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const settingsData = await getSettings()
      setSettings(settingsData)
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Filter settings
  const filteredSettings = settings.filter((setting) => {
    const matchesSearch =
      setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (setting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    return matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredSettings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSettings = filteredSettings.slice(startIndex, endIndex)

  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreateSetting = (formData: SettingFormData) => {
    startTransition(async () => {
      const settingData: CreateSettingInput = {
        key: formData.key,
        value: formData.value,
        description: formData.description || undefined,
      }

      const result = await createSetting(settingData)

      if (result.success && result.setting) {
        setSettings((prev) => [result.setting!, ...prev])
        setIsCreateDialogOpen(false)
        toast.success("Setting created successfully")
      } else {
        toast.error(result.error || "Failed to create setting")
      }
    })
  }

  const handleUpdateSetting = (formData: SettingFormData) => {
    if (!selectedSetting) return

    startTransition(async () => {
      const updateData: UpdateSettingInput = {
        value: formData.value,
        description: formData.description || undefined,
      }

      const result = await updateSetting(selectedSetting.id, updateData)

      if (result.success && result.setting) {
        setSettings((prev) =>
          prev.map((setting) => (setting.id === selectedSetting.id ? result.setting! : setting))
        )
        setIsEditDialogOpen(false)
        setSelectedSetting(null)
        toast.success("Setting updated successfully")
      } else {
        toast.error(result.error || "Failed to update setting")
      }
    })
  }

  const handleDeleteSetting = () => {
    if (!selectedSetting) return

    startTransition(async () => {
      const result = await deleteSetting(selectedSetting.id)

      if (result.success) {
        setSettings((prev) => prev.filter((setting) => setting.id !== selectedSetting.id))
        setIsDeleteDialogOpen(false)
        setSelectedSetting(null)
        toast.success("Setting deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete setting")
      }
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setCurrentPage(1)
  }

  const statsData = {
    totalSettings: settings.length,
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
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full"
              disabled={searchQuery === ""}
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
                    Total Settings:
                  </span>
                  <span className="font-medium">{statsData.totalSettings}</span>
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
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Manage global system configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadSettings} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Setting
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Setting</DialogTitle>
                    <DialogDescription>Add a new system configuration setting</DialogDescription>
                  </DialogHeader>
                  <SettingForm
                    onSubmit={handleCreateSetting}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    isLoading={isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredSettings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No settings found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery
                  ? "No settings match your search criteria."
                  : "Get started by creating your first system setting."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Setting
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Key</TableHead>
                      <TableHead className="font-semibold">Value</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSettings.map((setting) => (
                      <TableRow key={setting.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Key className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900 font-mono text-sm">
                                {setting.key}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {setting.value}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-gray-600" title={setting.description}>
                            {setting.description || (
                              <span className="text-gray-400 italic">No description</span>
                            )}
                          </div>
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
                                  setSelectedSetting(setting)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSetting(setting)
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredSettings.length > 0 && totalPages > 1 && (
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>Update the setting value and description</DialogDescription>
          </DialogHeader>
          {selectedSetting && (
            <SettingForm
              setting={selectedSetting}
              onSubmit={handleUpdateSetting}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedSetting(null)
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
            <DialogTitle>Delete Setting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the setting &quot;{selectedSetting?.key}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedSetting(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSetting} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Setting"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}