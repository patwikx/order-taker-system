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

  const IconComponent = getAppTypeIcon(currentBusinessUnit?.name || '')

  // Static compact display for single unit users
  if (!isSwitcherActive) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 border rounded-md",
          className
        )}
      >
        <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {currentBusinessUnit?.name || "No Unit"}
          </div>
        </div>
      </div>
    )
  }

  // Compact interactive dropdown
  return (
    <div className={cn("w-full", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between gap-2 px-2.5 h-9 font-normal"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <IconComponent className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">
                {currentBusinessUnit?.name || "Select Unit"}
              </span>
            </div>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[280px] max-h-[400px] overflow-y-auto"
          align="start"
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
            Production
          </DropdownMenuLabel>

          {/* Current/Selected item */}
          {currentBusinessUnit && (
            <DropdownMenuItem
              onClick={() => onBusinessUnitSelect(currentBusinessUnit.id)}
              className="mx-1 mb-1 gap-2 rounded-sm bg-accent/50"
            >
              <IconComponent className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {currentBusinessUnit.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {getAppTypeLabel(currentBusinessUnit.name)}
                </div>
              </div>
              <Check className="h-4 w-4 shrink-0" />
            </DropdownMenuItem>
          )}

          {/* Other business units */}
          {items
            .filter(item => item.id !== currentBusinessUnit?.id)
            .slice(0, 3)
            .map((item) => {
              const Icon = getAppTypeIcon(item.name)
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onBusinessUnitSelect(item.id)}
                  className="mx-1 gap-2 rounded-sm"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getAppTypeLabel(item.name)}
                    </div>
                  </div>
                </DropdownMenuItem>
              )
            })}

          {/* Development Section */}
          {items.length > 4 && (
            <>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
                Development
              </DropdownMenuLabel>

              {items
                .filter(item => item.id !== currentBusinessUnit?.id)
                .slice(3)
                .map((item) => {
                  const Icon = getAppTypeIcon(item.name)
                  return (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onBusinessUnitSelect(item.id)}
                      className="mx-1 gap-2 rounded-sm"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getAppTypeLabel(item.name)}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
            </>
          )}

          <DropdownMenuSeparator className="my-1" />

          {/* Add Business Unit */}
          <DropdownMenuItem
            onClick={handleAddProduct}
            className="mx-1 gap-2 rounded-sm"
          >
            <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Add Business Unit</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}