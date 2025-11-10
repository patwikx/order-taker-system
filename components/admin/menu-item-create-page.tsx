"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, FileSpreadsheet, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MenuItemCreateForm } from "./menu-item-create-form"
import { MenuItemBulkImport } from "./menu-item-bulk-import"

interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface MenuItemCreatePageProps {
  businessUnitId: string
  categories: Category[]
}

export function MenuItemCreatePage({ businessUnitId, categories }: MenuItemCreatePageProps) {
  const [activeTab, setActiveTab] = useState<string>("single")

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${businessUnitId}/menu/menu-items`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Menu Items</h1>
                <p className="text-sm text-gray-500">
                  Create a single item or import multiple items at once
                </p>
              </div>
            </div>
            
            {/* Mode Tabs in Header */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Single Item
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Bulk Import
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="single" className="m-0 h-full">
            <div className="p-6">
              <MenuItemCreateForm
                businessUnitId={businessUnitId}
                categories={categories}
              />
            </div>
          </TabsContent>

          <TabsContent value="import" className="m-0 h-full">
            <MenuItemBulkImport
              businessUnitId={businessUnitId}
              categories={categories}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
