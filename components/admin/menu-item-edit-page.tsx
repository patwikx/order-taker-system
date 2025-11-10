"use client"

import Link from "next/link"
import { ArrowLeft, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MenuItemEditForm } from "./menu-item-edit-form"
import type { MenuItemWithCategory } from "@/lib/actions/menu-actions"

interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface MenuItemEditPageProps {
  businessUnitId: string
  menuItem: MenuItemWithCategory
  categories: Category[]
}

function ImageGallery({ menuItem }: { menuItem: MenuItemWithCategory }) {
  // For now showing the main image, can be extended to support multiple images
  const images = menuItem.imageUrl ? [menuItem.imageUrl] : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Images</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {/* Main Image */}
          {images.map((image, index) => (
            <div
              key={index}
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`${menuItem.name} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 4 - images.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center"
            >
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No image</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MenuItemEditPage({ businessUnitId, menuItem, categories }: MenuItemEditPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center gap-4">
              <Link href={`/${businessUnitId}/menu/menu-items`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Menu Item</h1>
                <p className="text-sm text-gray-500">
                  Update the details of {menuItem.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-6">
            {/* Left Column - Form */}
            <div className="flex-1 max-w-2xl">
              <MenuItemEditForm
                businessUnitId={businessUnitId}
                menuItem={menuItem}
                categories={categories}
              />
            </div>

            {/* Right Column - Image Gallery */}
            <div className="w-80 flex-shrink-0">
              <div className="sticky top-24">
                <ImageGallery menuItem={menuItem} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
