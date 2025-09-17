"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Store, 
  Plus, 
  Check, 
  Monitor, 
  Smartphone, 
  Code, 
  Settings, 
  ChevronDown 
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


import { useBusinessUnitModal } from "@/hooks/use-bu-modal"
import { BusinessUnitItem } from "@/types/business-unit-types"

interface BusinessUnitSwitcherProps {
  items: BusinessUnitItem[]
  className?: string
}

// Icon mapping based on display name
const getAppTypeIcon = (name?: string): React.ComponentType<{ className?: string }> => {
  if (!name) return Monitor
  
  const lowerName = name.toLowerCase()
  if (lowerName.includes('mobile') || lowerName.includes('app')) {
    return Smartphone
  }
  if (lowerName.includes('admin') || lowerName.includes('settings')) {
    return Settings
  }
  if (lowerName.includes('store') || lowerName.includes('shop')) {
    return Store
  }
  if (lowerName.includes('dev') || lowerName.includes('code')) {
    return Code
  }
  return Monitor
}

const getAppTypeLabel = (name?: string): string => {
  if (!name) return 'Business Unit'
  
  const lowerName = name.toLowerCase()
  if (lowerName.includes('mobile') || lowerName.includes('app')) {
    return 'Mobile application'
  }
  if (lowerName.includes('admin')) {
    return 'Business Unit'
  }
  if (lowerName.includes('dev')) {
    return 'Business Unit'
  }
  return 'Business Unit'
}

export default function BusinessUnitSwitcher({ 
  className, 
  items = [] 
}: BusinessUnitSwitcherProps) {
  const businessUnitModal = useBusinessUnitModal()
  const params = useParams()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const isSwitcherActive = items.length > 1
  const currentBusinessUnit = items.find((item) => item.id === params.businessUnitId)

  const onBusinessUnitSelect = (businessUnitId: string) => {
    setOpen(false)
    router.push(`/${businessUnitId}`)
    router.refresh()
  }

  const handleAddProduct = () => {
    setOpen(false)
    businessUnitModal.onOpen()
  }

  // Static display for single unit users
  if (!isSwitcherActive) {
    const IconComponent = getAppTypeIcon(currentBusinessUnit?.name || '')
    
    return (
      <div
        className={cn(
          "flex items-center justify-start px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm",
          className
        )}
      >
        <IconComponent className="mr-3 h-4 w-4 text-gray-500" />
        <div>
          <div className="text-sm font-semibold text-gray-900 leading-tight">
            {currentBusinessUnit?.name || "No Unit Assigned"}
          </div>
          <div className="text-xs text-gray-500 leading-tight">
            {getAppTypeLabel(currentBusinessUnit?.name || '')}
          </div>
        </div>
      </div>
    )
  }

  // Interactive dropdown for multi-unit users
  const CurrentIcon = getAppTypeIcon(currentBusinessUnit?.name || '')

  return (
    <div className={className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start px-3 py-2 h-auto bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300 text-gray-900 shadow-sm"
          >
            <CurrentIcon className="mr-3 h-4 w-4 text-gray-500" />
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-gray-900 leading-tight truncate">
                {currentBusinessUnit?.name || "Select Unit"}
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                {getAppTypeLabel(currentBusinessUnit?.name || '')}
              </div>
            </div>
            <ChevronDown className={cn(
              "ml-2 h-4 w-4 text-gray-500 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 max-h-96 bg-white border-gray-200 shadow-xl"
          align="start"
        >
          {/* Production Section */}
          <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Production
          </DropdownMenuLabel>

          {/* Current/Selected item */}
          {currentBusinessUnit && (
            <DropdownMenuItem
              onClick={() => onBusinessUnitSelect(currentBusinessUnit.id)}
              className="mx-2 mb-2 p-3 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-50 cursor-pointer"
            >
              <CurrentIcon className="mr-3 h-4 w-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 leading-tight">
                  {currentBusinessUnit.name}
                </div>
                <div className="text-xs text-gray-500 leading-tight">
                  {getAppTypeLabel(currentBusinessUnit.name)}
                </div>
              </div>
              <Check className="ml-2 h-4 w-4 text-blue-600" />
            </DropdownMenuItem>
          )}

          {/* Other business units */}
          {items
            .filter(item => item.id !== currentBusinessUnit?.id)
            .slice(0, 3)
            .map((item) => {
              const IconComponent = getAppTypeIcon(item.name)
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onBusinessUnitSelect(item.id)}
                  className="mx-2 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <IconComponent className="mr-3 h-4 w-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 leading-tight">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 leading-tight">
                      {getAppTypeLabel(item.name)}
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })}

          {/* Development Section (if more items) */}
          {items.length > 4 && (
            <>
              <div className="px-3 py-2 mt-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Development
                </div>
              </div>

              {items
                .filter(item => item.id !== currentBusinessUnit?.id)
                .slice(3)
                .map((item) => {
                  const IconComponent = getAppTypeIcon(item.name)
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onBusinessUnitSelect(item.id)}
                      className="mx-2 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <IconComponent className="mr-3 h-4 w-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-500 leading-tight">
                          {getAppTypeLabel(item.name)}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
            </>
          )}

          <DropdownMenuSeparator className="my-2 mx-2 border-gray-200" />

          {/* Add Product Option */}
          <DropdownMenuItem
            onClick={handleAddProduct}
            className="mx-2 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <Plus className="mr-3 h-4 w-4 text-gray-500" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 leading-tight">
                Add Business Unit
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                Business Unit
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}