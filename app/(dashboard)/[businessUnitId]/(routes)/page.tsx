/* eslint-disable @next/next/no-img-element */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  BookOpen,
  ShoppingCart,
  Send,
  Coffee,
  Save,
  Plus,
  Minus,
  Trash2,
  Users,
  Clock,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Timer,
  Search,
  Filter,
  Utensils,
  Loader2,
  TableCellsMergeIcon,
  Hexagon,
  Edit3,
  UserCheck,
  UserX,
} from "lucide-react"

import { ItemType, OrderItemStatus, TableStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

// Server actions
import { getTables } from "@/lib/actions/table-actions"
import { getCategories, getMenuItems } from "@/lib/actions/menu-actions"
import { getBusinessUnit } from "@/lib/actions/business-unit-actions"
import { createOrder, getOrder, updateOrder } from "@/lib/actions/order-actions"

// Types
import type { TableWithCurrentOrder } from "@/lib/actions/table-actions"
import type { MenuItemWithCategory } from "@/lib/actions/menu-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import { useOrderStore } from "@/hooks/order-store"

interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface ImageLoadState {
  [key: string]: {
    loaded: boolean
    error: boolean
    loading: boolean
  }
}

const WaiterOrderSystem = () => {
  const params = useParams()
  const businessUnitId = params.businessUnitId as string

  // Data state
  const [tables, setTables] = useState<TableWithCurrentOrder[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([])
  const [businessUnit, setBusinessUnit] = useState<BusinessUnitDetails | null>(null)
  const [existingOrder, setExistingOrder] = useState<OrderWithDetails | null>(null)
  
  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isTablesCollapsed, setIsTablesCollapsed] = useState(false)
  const [imageLoadStates, setImageLoadStates] = useState<ImageLoadState>({})
  const [currentTime, setCurrentTime] = useState(new Date())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingOrder, setIsEditingOrder] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined)

  // Order store
  const {
    selectedTableId,
    orderItems,
    isWalkIn,
    walkInName,
    customerCount,
    orderNotes,
    isSubmittingOrder,
    isClearingOrder,
    addingItemId,
    setSelectedTable,
    addToOrder,
    updateQuantity,
    removeFromOrder,
    setCustomerCount,
    setOrderNotes,
    setCustomerInfo,
    clearOrder,
    setSubmittingOrder,
    setClearingOrder,
    setAddingItemId,
    getSubtotal,
    getTax,
    getTotal,
  } = useOrderStore()

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        const [tablesData, categoriesData, menuItemsData, businessUnitData] = await Promise.all([
          getTables(businessUnitId),
          getCategories(businessUnitId),
          getMenuItems(businessUnitId),
          getBusinessUnit(businessUnitId)
        ])

        setTables(tablesData)
        setCategories(categoriesData)
        setMenuItems(menuItemsData)
        setBusinessUnit(businessUnitData)

        // Set first available table as selected if none selected
        if (!selectedTableId && tablesData.length > 0) {
          const availableTable = tablesData.find(t => t.status === TableStatus.AVAILABLE)
          if (availableTable) {
            setSelectedTable(availableTable.id)
          }
        }

        // Set first category as selected if none selected
        if (!selectedCategory && categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].name)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [businessUnitId, selectedTableId, selectedCategory, setSelectedTable])

  // Load existing order when table is selected
  useEffect(() => {
    const loadExistingOrder = async () => {
      if (!selectedTableId) return

      const selectedTable = tables.find(t => t.id === selectedTableId)
      if (selectedTable?.currentOrder) {
        try {
          setIsLoadingOrder(true)
          const orderData = await getOrder(businessUnitId, selectedTable.currentOrder.id)
          if (orderData) {
            setExistingOrder(orderData)
            setIsEditingOrder(true)
            
            // Load existing order items into the store
            clearOrder()
            orderData.orderItems.forEach(item => {
              for (let i = 0; i < item.quantity; i++) {
                addToOrder(item.menuItem)
              }
            })
            
            // Set customer info
            setCustomerInfo(
              orderData.customerId || undefined,
              orderData.isWalkIn,
              orderData.walkInName || undefined
            )
            setSelectedCustomerId(orderData.customerId || undefined)
            setCustomerCount(orderData.customerCount || 1)
            setOrderNotes(orderData.notes || "")
          }
        } catch (error) {
          console.error("Error loading existing order:", error)
          toast.error("Failed to load existing order")
        } finally {
          setIsLoadingOrder(false)
        }
      } else {
        setExistingOrder(null)
        setIsEditingOrder(false)
        clearOrder()
        setCustomerInfo(undefined, true, undefined)
        setSelectedCustomerId(undefined)
        setCustomerCount(1)
        setOrderNotes("")
      }
    }

    if (tables.length > 0) {
      loadExistingOrder()
    }
  }, [selectedTableId, tables, businessUnitId, clearOrder, addToOrder, setCustomerInfo, setCustomerCount, setOrderNotes])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Image loading handlers
  const handleImageLoad = useCallback((imageUrl: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [imageUrl]: { loaded: true, error: false, loading: false }
    }))
  }, [])

  const handleImageError = useCallback((imageUrl: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [imageUrl]: { loaded: false, error: true, loading: false }
    }))
  }, [])

  const handleImageLoadStart = useCallback((imageUrl: string) => {
    setImageLoadStates(prev => ({
      ...prev,
      [imageUrl]: { loaded: false, error: false, loading: true }
    }))
  }, [])

  // Add item to order
  const handleAddToOrder = async (menuItem: MenuItemWithCategory) => {
    setAddingItemId(menuItem.id)
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 150))
    
    addToOrder({
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      type: menuItem.type,
      prepTime: menuItem.prepTime,
      imageUrl: menuItem.imageUrl,
    })
    
    setAddingItemId(null)
  }

  // Refresh tables data
  const refreshTables = async () => {
    try {
      const updatedTables = await getTables(businessUnitId)
      setTables(updatedTables)
    } catch (error) {
      console.error("Error refreshing tables:", error)
    }
  }

  // Submit order
  const handleSubmitOrder = async () => {
    if (!selectedTableId || orderItems.length === 0) {
      toast.error("Please select a table and add items to the order")
      return
    }

    setSubmittingOrder(true)
    
    try {
      const orderData = {
        tableId: selectedTableId,
        customerId: selectedCustomerId,
        isWalkIn,
        walkInName: isWalkIn ? walkInName : undefined,
        customerCount,
        notes: orderNotes,
        items: orderItems.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes
        }))
      }

      let result
      if (isEditingOrder && existingOrder) {
        // Update existing order
        result = await updateOrder(businessUnitId, existingOrder.id, orderData)
      } else {
        // Create new order
        result = await createOrder(businessUnitId, orderData, false)
      }
      
      if (result.success) {
        toast.success(isEditingOrder ? "Order updated successfully!" : "Order sent to kitchen/bar successfully!")
        clearOrder()
        setIsEditingOrder(false)
        setExistingOrder(null)
        
        // Refresh tables data to update status
        await refreshTables()
      } else {
        toast.error(result.error || "Failed to submit order")
      }
    } catch (error) {
      console.error("Error submitting order:", error)
      toast.error("Failed to submit order")
    } finally {
      setSubmittingOrder(false)
    }
  }

  // Save as draft
  const handleSaveAsDraft = async () => {
    if (!selectedTableId || orderItems.length === 0) {
      toast.error("Please select a table and add items to save as draft")
      return
    }

    try {
      const orderData = {
        tableId: selectedTableId,
        customerId: selectedCustomerId,
        isWalkIn,
        walkInName: isWalkIn ? walkInName : undefined,
        customerCount,
        notes: orderNotes,
        items: orderItems.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          notes: item.notes
        }))
      }

      const result = await createOrder(businessUnitId, orderData, true)
      
      if (result.success) {
        toast.success("Order saved as draft!")
        clearOrder()
        setIsEditingOrder(false)
        setExistingOrder(null)
        
        // Refresh tables data
        await refreshTables()
      } else {
        toast.error(result.error || "Failed to save draft")
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    }
  }

  // Clear order
  const handleClearAll = async () => {
    setClearingOrder(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    clearOrder()
    setIsEditingOrder(false)
    setExistingOrder(null)
    setClearingOrder(false)
  }

  // Handle table selection
  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId)
  }

  // Handle customer type change
  const handleCustomerTypeChange = (isWalkInCustomer: boolean) => {
    if (isWalkInCustomer) {
      setCustomerInfo(undefined, true, undefined)
      setSelectedCustomerId(undefined)
    } else {
      setCustomerInfo(undefined, false, undefined)
      setSelectedCustomerId(undefined)
    }
  }

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = item.category.name === selectedCategory
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Get selected table info
  const selectedTableInfo = tables.find((table) => table.id === selectedTableId)

  // Calculate totals
  const subtotal = getSubtotal()
  const tax = businessUnit ? getTax(businessUnit.taxRate) : 0
  const total = businessUnit ? getTotal(businessUnit.taxRate) : subtotal

  const formatPrice = (price: number) => `₱${price.toFixed(2)}`

  // Table status helpers - Updated to handle tables with orders
  const getTableStatusInfo = (status: TableStatus, hasCurrentOrder: boolean) => {
    // If table has a current order, it should show as occupied regardless of its status
    if (hasCurrentOrder) {
      return { color: "border-orange-400 bg-orange-50 text-orange-700", text: "Has Order", icon: Edit3 }
    }

    switch (status) {
      case TableStatus.OCCUPIED:
        return { color: "border-red-400 bg-red-50 text-red-700", text: "Occupied", icon: Users }
      case TableStatus.AVAILABLE:
        return {
          color: "border-green-400 bg-green-50 text-green-700 hover:bg-green-100",
          text: "Available",
          icon: CheckCircle2,
        }
      case TableStatus.RESERVED:
        return { color: "border-blue-400 bg-blue-50 text-blue-700", text: "Reserved", icon: Clock }
      case TableStatus.OUT_OF_ORDER:
        return { color: "border-gray-400 bg-gray-50 text-gray-700", text: "Out of Order", icon: AlertCircle }
      default:
        return { color: " bg-white text-gray-700", text: "Unknown", icon: AlertCircle }
    }
  }

  const getTableStatusDot = (status: TableStatus, hasCurrentOrder: boolean) => {
    // If table has a current order, show orange dot
    if (hasCurrentOrder) {
      return "bg-orange-500"
    }

    switch (status) {
      case TableStatus.OCCUPIED:
        return "bg-red-500"
      case TableStatus.AVAILABLE:
        return "bg-green-500"
      case TableStatus.RESERVED:
        return "bg-blue-500"
      case TableStatus.OUT_OF_ORDER:
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const getItemStatusInfo = (status: OrderItemStatus) => {
    switch (status) {
      case OrderItemStatus.PENDING:
        return { color: "bg-yellow-100 text-yellow-800", text: "Pending", icon: Clock }
      case OrderItemStatus.PREPARING:
        return { color: "bg-blue-100 text-blue-800", text: "Preparing", icon: Timer }
      case OrderItemStatus.READY:
        return { color: "bg-green-100 text-green-800", text: "Ready", icon: CheckCircle2 }
      case OrderItemStatus.SERVED:
        return { color: "bg-gray-100 text-gray-800", text: "Served", icon: CheckCircle2 }
      default:
        return { color: "bg-gray-100 text-gray-800", text: "Unknown", icon: AlertCircle }
    }
  }

  // Image Component with proper fallbacks and loading states
  const ImageWithFallback = ({ 
    src, 
    alt, 
    className, 
    itemType, 
    size = "default" 
  }: { 
    src?: string, 
    alt: string, 
    className?: string, 
    itemType: ItemType,
    size?: "small" | "default"
  }) => {
    const imageState = src ? imageLoadStates[src] : null
    const iconSize = size === "small" ? "w-5 h-5" : "w-8 h-8"
    
    if (!src || imageState?.error) {
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
        {imageState?.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className={`${iconSize} text-gray-400 animate-spin`} />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${imageState?.loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          onLoad={() => handleImageLoad(src)}
          onError={() => handleImageError(src)}
          onLoadStart={() => handleImageLoadStart(src)}
        />
      </div>
    )
  }


  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-gray-50">
      {/* Tables Panel */}
      <div className={`${isTablesCollapsed ? 'w-24' : 'w-80'} border-r flex flex-col transition-all duration-300`}>
        {!isTablesCollapsed ? (
          // Expanded View
          <>
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Hexagon className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Tables</h2>
                    <p className="text-sm text-gray-600">
                      {tables.length} total • {tables.filter((t) => t.status === TableStatus.OCCUPIED || t.currentOrder).length} occupied
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant='outline' size="sm" onClick={() => setIsTablesCollapsed(true)}>
                    <TableCellsMergeIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                {tables.map((table) => {
                  const statusInfo = getTableStatusInfo(table.status, !!table.currentOrder)
                  const StatusIcon = statusInfo.icon
                  const isSelected = selectedTableId === table.id

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableSelect(table.id)}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${statusInfo.color} ${
                        isSelected ? "ring-2 ring-blue-400 ring-offset-2" : ""
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xl font-bold mb-1">T{table.number}</div>
                        <div className="flex items-center justify-center gap-1 text-xs mb-2">
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.text}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-1 text-xs">
                            <Users className="w-3 h-3" />
                            <span>{table.capacity} seats</span>
                          </div>
                          {table.location && <div className="text-xs opacity-75">{table.location}</div>}
                          {table.currentOrder && (
                            <div className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1">
                              <Edit3 className="w-3 h-3" />
                              {table.currentOrder.orderNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          // Collapsed View
          <>
            <div className="p-2 border-b bg-white flex justify-center">
              <Button variant='outline' size="sm" onClick={() => setIsTablesCollapsed(false)}>
                <TableCellsMergeIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 bg-gray-50">
              <div className="space-y-2">
                {tables.map((table) => {
                  const statusDot = getTableStatusDot(table.status, !!table.currentOrder)
                  const isSelected = selectedTableId === table.id

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableSelect(table.id)}
                      className={`relative p-3 rounded-lg bg-white border cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected ? "ring-2 ring-blue-400 ring-offset-1 shadow-md border-blue-200" : "border-gray-200 hover:border-gray-300"
                      }`}
                      title={`Table ${table.number} - ${getTableStatusInfo(table.status, !!table.currentOrder).text} - ${table.capacity} seats`}
                    >
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusDot} border-2 border-white`} />
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 mb-1">T{table.number}</div>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity}</span>
                        </div>
                        {table.currentOrder && (
                          <div className="mt-1">
                            <Edit3 className="w-3 h-3 text-blue-500 mx-auto" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Menu Panel */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-60"
                />
              </div>
              <Button variant='outline' size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                size="sm"
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.name
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-3">
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => item.isAvailable && !addingItemId && handleAddToOrder(item)}
                className={`p-3 bg-white border rounded-lg transition-all duration-200 relative ${
                  item.isAvailable && !addingItemId
                    ? "hover:shadow-md hover:border-blue-200 cursor-pointer hover:scale-[1.02]"
                    : "opacity-60 cursor-not-allowed bg-gray-50"
                } ${addingItemId === item.id ? "scale-[0.98] shadow-lg border-blue-300" : ""}`}
              >
                {addingItemId === item.id && (
                  <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Adding...</span>
                    </div>
                  </div>
                )}
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full"
                    itemType={item.type}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h3>
                    <div className="flex items-center gap-1">
                      {item.type === ItemType.DRINK && <Coffee className="w-3 h-3 text-blue-500" />}
                      {!item.isAvailable && <AlertCircle className="w-3 h-3 text-red-500" />}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-green-600">{formatPrice(item.price)}</div>
                    {item.prepTime && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Timer className="w-3 h-3" />
                        <span>{item.prepTime}m</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Summary Panel */}
      <div className="w-96 bg-white border-l shadow-sm flex flex-col h-full relative">
        {/* Loading Overlay for Order Summary Panel */}
        {(isSubmittingOrder || isClearingOrder || isLoadingOrder) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {isLoadingOrder 
                  ? "Loading order data..." 
                  : isSubmittingOrder 
                  ? (isEditingOrder ? "Updating Order..." : "Sending Order...") 
                  : "Clearing Order..."}
              </span>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="p-3 border-b bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">
                  {isEditingOrder ? "Edit Order" : "Order Summary"}
                </h2>
                <p className="text-xs text-gray-600">{orderItems.length} items selected</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-green-600">{formatPrice(total)}</div>
              <div className="text-xs text-gray-500">Total Amount</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                Table {selectedTableInfo?.number}
              </span>
              {existingOrder && (
                <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                  {existingOrder.orderNumber}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{currentTime.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
            <Button 
              onClick={handleClearAll}
              disabled={isClearingOrder || isSubmittingOrder}
              variant='outline' 
              size='sm' 
              className="text-xs h-6 px-2 flex items-center gap-1"
            >
              {isClearingOrder ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Clear All"
              )}
            </Button>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-3 border-b bg-gray-50">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Customer Type:</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant={isWalkIn ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCustomerTypeChange(true)}
                  className="h-8 px-3 text-xs"
                >
                  <UserX className="w-3 h-3 mr-1" />
                  Walk-in
                </Button>
                <Button
                  variant={!isWalkIn ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCustomerTypeChange(false)}
                  className="h-8 px-3 text-xs"
                >
                  <UserCheck className="w-3 h-3 mr-1" />
                  Regular
                </Button>
              </div>
            </div>

            {!isWalkIn && (
              <div>
                <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                  Customer Name
                </Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Enter or select customer name"
                  value={selectedCustomerId ? "Selected Customer" : ""}
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  onChange={(e) => {
                    // This would be connected to a customer search/select component
                    // For now, just storing the value
                  }}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            )}

            <div>
              <Label htmlFor="customerCount" className="text-sm font-medium text-gray-700">
                Number of Customers
              </Label>
              <Input
                id="customerCount"
                type="number"
                min="1"
                max="20"
                value={customerCount || 1}
                onChange={(e) => setCustomerCount(parseInt(e.target.value) || 1)}
                className="mt-1 h-8 text-sm w-20"
              />
            </div>

            <div>
              <Label htmlFor="orderNotes" className="text-sm font-medium text-gray-700">
                Order Notes (Optional)
              </Label>
              <Input
                id="orderNotes"
                type="text"
                placeholder="Special instructions..."
                value={orderNotes || ""}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {orderItems.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-1">No items in order</p>
              <p className="text-xs text-gray-400">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orderItems.map((item) => {
                const statusInfo = getItemStatusInfo(item.status)
                const StatusIcon = statusInfo.icon

                return (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-2.5 border">
                    <div className="flex gap-2.5 mb-2">
                      {/* Item Image */}
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <ImageWithFallback
                          src={item.menuItem.imageUrl}
                          alt={item.menuItem.name}
                          className="w-full h-full"
                          itemType={item.menuItem.type}
                          size="small"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{item.menuItem.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}
                              >
                                <StatusIcon className="w-2.5 h-2.5" />
                                {statusInfo.text}
                              </span>
                              {item.estimatedTime && (
                                <div className="flex items-center gap-1 text-xs text-blue-500">
                                  <Clock className="h-3 w-3" />
                                  <span>{item.estimatedTime}m</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="font-semibold text-gray-900 text-sm">
                              {formatPrice(item.menuItem.price * item.quantity)}
                            </div>
                            <div className="text-xs text-gray-500">{formatPrice(item.menuItem.price)} each</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromOrder(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order Totals and Actions */}
        {orderItems.length > 0 && (
          <div className="border-t bg-white p-3 flex-shrink-0">
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({businessUnit ? (businessUnit.taxRate * 100).toFixed(0) : '12'}%)</span>
                <span className="text-gray-900 font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-1.5">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={handleSubmitOrder}
                disabled={isSubmittingOrder || isClearingOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditingOrder ? "Updating Order..." : "Sending Order..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isEditingOrder ? "Update Order" : "Send to Kitchen"}
                  </>
                )}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleSaveAsDraft}
                  disabled={isSubmittingOrder || isClearingOrder}
                  variant="outline" 
                  className="py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Draft
                </Button>
                <Button 
                  disabled={isSubmittingOrder || isClearingOrder}
                  variant="outline" 
                  className="py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                >
                  <Coffee className="w-4 h-4" />
                  Bar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WaiterOrderSystem