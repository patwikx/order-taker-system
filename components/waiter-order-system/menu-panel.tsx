/* eslint-disable @next/next/no-img-element */
"use client"

import { memo, useCallback, useState } from "react"
import { 
  BookOpen, 
  Search, 
  Filter, 
  Coffee, 
  Utensils, 
  Timer, 
  AlertCircle, 
  Loader2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ItemType } from "@prisma/client"
import type { MenuItemWithCategory } from "@/lib/actions/menu-actions"

interface MenuPanelProps {
  categories: Array<{
    id: string
    name: string
    description?: string
    sortOrder: number
    isActive: boolean
  }>
  menuItems: MenuItemWithCategory[]
  selectedCategory: string
  searchQuery: string
  addingItemId: string | null
  onCategorySelect: (category: string) => void
  onSearchChange: (query: string) => void
  onAddToOrder: (menuItem: MenuItemWithCategory, quantity: number, notes?: string) => void
}

const ImageWithFallback = memo(({ 
  src, 
  alt, 
  className, 
  itemType, 
  size = "default",
  onLoad,
  onError,
  onLoadStart
}: { 
  src?: string
  alt: string
  className?: string
  itemType: ItemType
  size?: "small" | "default"
  onLoad?: () => void
  onError?: () => void
  onLoadStart?: () => void
}) => {
  const [hasError, setHasError] = useState(false)
  const iconSize = size === "small" ? "w-5 h-5" : "w-8 h-8"
  
  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true)
    onError?.()
    // Prevent the error from bubbling up to avoid console errors
    e.preventDefault()
  }, [onError])

  const handleLoad = useCallback(() => {
    setHasError(false)
    onLoad?.()
  }, [onLoad])

  if (!src || hasError) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        {itemType === ItemType.DRINK ? (
          <Coffee className={`${iconSize} text-gray-400`} />
        ) : (
          <Utensils className={`${iconSize} text-gray-400`} />
        )}
      </div>
    )
  }

  return (
    <div className={`${className} relative`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-opacity duration-200"
        onLoad={handleLoad}
        onError={handleError}
        onLoadStart={onLoadStart}
      />
    </div>
  )
})

ImageWithFallback.displayName = "ImageWithFallback"

const MenuItem = memo(({ 
  item, 
  isAdding, 
  onAddToOrder 
}: { 
  item: MenuItemWithCategory
  isAdding: boolean
  onAddToOrder: (item: MenuItemWithCategory, quantity: number, notes?: string) => void
}) => {
  const formatPrice = useCallback((price: number) => `₱${price.toFixed(2)}`, [])
  const [showDialog, setShowDialog] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")

  const handleClick = () => {
    if (item.isAvailable && !isAdding) {
      setShowDialog(true)
      setQuantity(1)
      setNotes("")
    }
  }

  const handleAddToOrder = () => {
    onAddToOrder(item, quantity, notes)
    setShowDialog(false)
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`aspect-square p-2 bg-white border rounded-lg transition-all duration-200 relative flex flex-col ${
          item.isAvailable && !isAdding
            ? "hover:shadow-md hover:border-blue-200 cursor-pointer hover:scale-[1.02]"
            : "opacity-60 cursor-not-allowed bg-gray-50"
        } ${isAdding ? "scale-[0.98] shadow-lg border-blue-300" : ""}`}
      >
      {isAdding && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center rounded-lg z-10">
          <div className="flex items-center gap-1 text-blue-600 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs">Adding...</span>
          </div>
        </div>
      )}
      
      <div className="h-16 bg-gray-100 rounded-md flex items-center justify-center mb-2 overflow-hidden">
        <ImageWithFallback
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full"
          itemType={item.type}
        />
      </div>

      <div className="flex flex-col justify-between flex-1 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 line-clamp-2">{item.name}</h3>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {item.type === ItemType.DRINK && <Coffee className="w-3 h-3 text-blue-500" />}
            {!item.isAvailable && <AlertCircle className="w-3 h-3 text-red-500" />}
          </div>
        </div>

        <div className="flex-1">
          {item.description && (
            <p className="text-xs text-gray-600 leading-tight line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 mt-auto">
          <div className="text-sm font-bold text-green-600">{formatPrice(item.price)}</div>
          {item.prepTime && (
            <div className="flex items-center gap-0.5 text-xs text-gray-500 flex-shrink-0">
              <Timer className="w-3 h-3" />
              <span>{item.prepTime}m</span>
            </div>
          )}
        </div>
      </div>
    </div>

    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.type === ItemType.DRINK ? (
              <Coffee className="w-5 h-5 text-blue-500" />
            ) : (
              <Utensils className="w-5 h-5 text-gray-600" />
            )}
            {item.name}
          </DialogTitle>
          <DialogDescription>
            {item.description || "Add this item to your order"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full"
                itemType={item.type}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Price:</span>
              <span className="text-lg font-bold text-green-600">{formatPrice(item.price)}</span>
            </div>
            {item.prepTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Prep Time:</span>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Timer className="w-4 h-4" />
                  <span>{item.prepTime} minutes</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                className="w-20 text-center"
                autoFocus={false}
                readOnly
                onFocus={(e) => e.target.blur()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                disabled={quantity >= 99}
              >
                +
              </Button>
              <div className="ml-auto text-sm font-medium">
                Total: <span className="text-green-600">{formatPrice(item.price * quantity)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., No onions, extra sauce, well done..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddToOrder} disabled={isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>Add to Order</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
})

MenuItem.displayName = "MenuItem"

export const MenuPanel = memo(({ 
  categories, 
  menuItems, 
  selectedCategory, 
  searchQuery, 
  addingItemId, 
  onCategorySelect, 
  onSearchChange, 
  onAddToOrder 
}: MenuPanelProps) => {
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      item.category.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    // If searching, show all matching items across all categories
    if (searchQuery !== "") {
      return matchesSearch
    }
    
    // If not searching, filter by selected category
    const matchesCategory = item.category.name === selectedCategory
    return matchesCategory
  })

  return (
    <div className="flex-1 bg-white flex flex-col min-w-0 h-full max-h-screen overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <p className="text-sm text-gray-600">Browse and add items</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-60"
              />
            </div>
            <Button variant='outline' size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category Tabs - Improved Design */}
      <div className="bg-white border-b shadow-sm flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.name)}
                className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200 flex-shrink-0 ${
                  selectedCategory === category.name
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                } ${index === 0 ? "ml-0" : "ml-1"}`}
              >
                <span>{category.name}</span>
                {selectedCategory === category.name && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                    <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Category Indicator Line */}
          <div className="mt-2 h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 rounded-full opacity-30"></div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-4 bg-gray-50 overflow-y-auto overflow-x-hidden min-h-0 max-h-full scrollbar-hide">
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No menu items match "${searchQuery}" in ${selectedCategory}`
                : `No items available in ${selectedCategory} category`}
            </p>
          </div>
        ) : (
          <>
            {/* Items Grid - Responsive: 2 cols mobile, 3 cols small screens, 5 cols tablet (iPad 11"), 6 cols large desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredMenuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isAdding={addingItemId === item.id}
                  onAddToOrder={onAddToOrder}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
})

MenuPanel.displayName = "MenuPanel"