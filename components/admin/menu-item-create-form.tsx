"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUpload, UploadedFileDisplay } from "@/components/file-upload"
import { Loader2, Utensils, Coffee, Save } from "lucide-react"
import { ItemType } from "@prisma/client"
import { createMenuItem, type CreateMenuItemInput } from "@/lib/actions/menu-actions"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface MenuItemCreateFormProps {
  businessUnitId: string
  categories: Category[]
}

interface FormData {
  name: string
  description: string
  price: string
  categoryId: string
  type: ItemType
  prepTime: string
  imageUrl: string
  uploadedFileName: string
}

export function MenuItemCreateForm({ businessUnitId, categories }: MenuItemCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    type: ItemType.FOOD,
    prepTime: "15",
    imageUrl: "",
    uploadedFileName: "",
  })

  const handleUploadComplete = (result: { fileName: string; name: string; fileUrl: string }) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: result.fileUrl,
      uploadedFileName: result.name,
    }))
    toast.success("Image uploaded successfully")
  }

  const handleUploadError = (error: string) => {
    toast.error(error)
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageUrl: "",
      uploadedFileName: "",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.categoryId || !formData.price) {
      toast.error("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      const menuItemData: CreateMenuItemInput = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        categoryId: formData.categoryId,
        type: formData.type,
        prepTime: parseInt(formData.prepTime) || undefined,
        imageUrl: formData.imageUrl || undefined,
      }

      const result = await createMenuItem(businessUnitId, menuItemData)

      if (result.success && result.menuItem) {
        toast.success("Menu item created successfully")
        router.push(`/${businessUnitId}/menu/menu-items`)
      } else {
        toast.error(result.error || "Failed to create menu item")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Menu Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
                required
                disabled={isPending}
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
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter item description (optional)"
              rows={3}
              disabled={isPending}
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                disabled={isPending}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ItemType }))}
                disabled={isPending}
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

          {/* Prep Time */}
          <div className="space-y-2">
            <Label htmlFor="prepTime">Prep Time (minutes)</Label>
            <Input
              id="prepTime"
              type="number"
              min="1"
              value={formData.prepTime}
              onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
              placeholder="15"
              disabled={isPending}
              className="w-32"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Menu Item Image</Label>
            {formData.imageUrl ? (
              <UploadedFileDisplay
                fileName={formData.uploadedFileName}
                name={formData.uploadedFileName}
                fileUrl={formData.imageUrl}
                onRemove={handleRemoveImage}
                disabled={isPending}
              />
            ) : (
              <FileUpload
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                disabled={isPending}
                maxSize={5}
                accept=".jpg,.jpeg,.png,.gif,.webp"
                multiple={false}
              />
            )}
            <p className="text-xs text-gray-500">
              Upload an image for your menu item. Recommended size: 800x800px
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !formData.name || !formData.categoryId || !formData.price}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Menu Item
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
