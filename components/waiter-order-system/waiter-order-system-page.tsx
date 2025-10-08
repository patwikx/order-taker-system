"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import { OrderStatus, TableStatus } from "@prisma/client"

// Server actions
import { getTables } from "@/lib/actions/table-actions"
import { 
  getOrder, 
  updateOrder, 
  createOrder, 
  sendOrderToKitchenAndBar,
  addItemsToOrder,
  completeOrder
} from "@/lib/actions/order-actions"

// Types
import type { TableWithCurrentOrder } from "@/lib/actions/table-actions"
import type { MenuItemWithCategory } from "@/lib/actions/menu-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import { useOrderStore } from "@/hooks/order-store"
import { usePrinter } from "@/hooks/use-printer"

// Components
import { TableGrid } from "./table-grid"
import { MenuPanel } from "./menu-panel"
import { OrderSummaryPanel } from "./order-summary-panel"

interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface InitialData {
  tables: TableWithCurrentOrder[]
  categories: Category[]
  menuItems: MenuItemWithCategory[]
  businessUnit: BusinessUnitDetails | null
}

interface Props {
  businessUnitId: string
  initialData: InitialData
}

interface UIState {
  selectedCategory: string
  searchQuery: string
  isTablesCollapsed: boolean
  isEditingOrder: boolean
  isLoadingOrder: boolean
  isSettlingOrder: boolean
  selectedCustomerId?: string
  addingItemId: string | null
}

const WaiterOrderSystem = ({ businessUnitId, initialData }: Props) => {
  // Data state - initialized with server data
  const [tables, setTables] = useState<TableWithCurrentOrder[]>(initialData.tables)
  const [existingOrder, setExistingOrder] = useState<OrderWithDetails | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // UI state consolidated into single object to reduce re-renders
  const [uiState, setUIState] = useState<UIState>({
    selectedCategory: initialData.categories[0]?.name || "",
    searchQuery: "",
    isTablesCollapsed: false,
    isEditingOrder: false,
    isLoadingOrder: false,
    isSettlingOrder: false,
    selectedCustomerId: undefined,
    addingItemId: null,
  })

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
    loadExistingOrderItems,
    getSubtotal,
    getTax,
    getTotal,
  } = useOrderStore()

  // Printer hook
  const { printOrderDetails, printNewItems, printError } = usePrinter()

  // Current session
  const { data: session } = useSession()

  // Show print errors
  useEffect(() => {
    if (printError) {
      toast.error(`Printer Error: ${printError}`)
    }
  }, [printError])

  // Memoized selected table info
  const selectedTableInfo = useMemo(() => 
    tables.find((table) => table.id === selectedTableId),
    [tables, selectedTableId]
  )

  // Refresh tables data - moved before its usage
  const refreshTables = useCallback(async () => {
    try {
      const updatedTables = await getTables(businessUnitId)
      setTables(updatedTables)
    } catch (error) {
      console.error("Error refreshing tables:", error)
    }
  }, [businessUnitId])

  // Set initial table selection - only run once
  useEffect(() => {
    if (!selectedTableId && initialData.tables.length > 0) {
      const availableTable = initialData.tables.find(t => t.status === TableStatus.AVAILABLE)
      if (availableTable) {
        setSelectedTable(availableTable.id)
      }
    }
  }, [selectedTableId, setSelectedTable, initialData.tables])

 // Load existing order when table changes - FIXED VERSION
const loadExistingOrder = useCallback(async (tableId: string) => {
  const selectedTable = tables.find(t => t.id === tableId)
  
  // Always clear the order first to prevent stale data
  clearOrder()
  setExistingOrder(null)
  setUIState(prev => ({ ...prev, isEditingOrder: false }))
  
  if (!selectedTable?.currentOrder) {
    // Reset all customer info for available tables
    setCustomerInfo(undefined, true, undefined)
    setUIState(prev => ({ ...prev, selectedCustomerId: undefined }))
    setCustomerCount(1)
    setOrderNotes("")
    return
  }

  try {
    setUIState(prev => ({ ...prev, isLoadingOrder: true }))
    const orderData = await getOrder(businessUnitId, selectedTable.currentOrder.id)
    
    if (orderData) {
      setExistingOrder(orderData)
      setUIState(prev => ({ ...prev, isEditingOrder: true }))
      
      // Convert orderData.orderItems to the format expected by loadExistingOrderItems
      const existingItems = orderData.orderItems.map(item => ({
        menuItem: {
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description,
          price: item.menuItem.price,
          type: item.menuItem.type,
          prepTime: item.menuItem.prepTime,
          imageUrl: item.menuItem.imageUrl,
        },
        quantity: item.quantity,
        status: item.status,
        notes: item.notes
      }))
      
      // Load items directly without triggering addToOrder logic
      loadExistingOrderItems(existingItems)
      
      // Set customer info
      setCustomerInfo(
        orderData.customerId || undefined,
        orderData.isWalkIn,
        orderData.walkInName || undefined
      )
      setUIState(prev => ({ ...prev, selectedCustomerId: orderData.customerId || undefined }))
      setCustomerCount(orderData.customerCount || 1)
      setOrderNotes(orderData.notes || "")
    }
  } catch (error) {
    console.error("Error loading existing order:", error)
    toast.error("Failed to load existing order")
  } finally {
    setUIState(prev => ({ ...prev, isLoadingOrder: false }))
  }
}, [tables, businessUnitId, clearOrder, loadExistingOrderItems, setCustomerInfo, setCustomerCount, setOrderNotes])

  // Effect for loading order when table changes
  useEffect(() => {
    if (selectedTableId && tables.length > 0) {
      loadExistingOrder(selectedTableId)
    }
  }, [selectedTableId, tables.length, loadExistingOrder])

  // Clock timer - optimized with proper cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Optimized UI state updates
  const updateUIState = useCallback(<K extends keyof UIState>(key: K, value: UIState[K]) => {
    setUIState(prev => ({ ...prev, [key]: value }))
  }, [])

  // Add item to order - optimized with categoryId fix
  const handleAddToOrder = useCallback(async (menuItem: MenuItemWithCategory) => {
    updateUIState('addingItemId', menuItem.id)
    
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
    
    updateUIState('addingItemId', null)
  }, [addToOrder, updateUIState])

  // Updated handleAddMoreItems function for waiter-order-system-page.tsx

  const handleWalkInNameChange = useCallback((name: string) => {
  setCustomerInfo(uiState.selectedCustomerId, isWalkIn, name)
}, [setCustomerInfo, uiState.selectedCustomerId, isWalkIn])
// Replace the existing handleAddMoreItems function with this:

const handleAddMoreItems = useCallback(async () => {
  if (!existingOrder || !initialData.businessUnit || !selectedTableInfo) {
    toast.error("No existing order found")
    return
  }

  const newItemsOnly = orderItems.filter(item => !item.isExistingItem)

  if (newItemsOnly.length === 0) {
    toast.error("No new items to add")
    return
  }

  setSubmittingOrder(true)

  try {
    const itemsToAdd = newItemsOnly.map(item => ({
      menuItemId: item.menuItem.id,
      quantity: item.quantity,
      notes: item.notes
    }))

    const result = await addItemsToOrder(businessUnitId, existingOrder.id, itemsToAdd)

    if (result.success) {
      toast.success(`${newItemsOnly.length} new item(s) added to order successfully!`)

      try {
        await printNewItems(
          existingOrder.orderNumber,
          selectedTableInfo.number,
          newItemsOnly.map(item => ({
            name: item.menuItem.name,
            quantity: item.quantity,
            notes: item.notes,
            type: item.menuItem.type
          })),
          initialData.businessUnit,
          session?.user?.name,
          customerCount
        )
        toast.success("Order details sent to printer")
      } catch (printErr) {
        console.error("Print error:", printErr)
        toast.warning("Order added but printing failed. Please print manually if needed.")
      }

      await loadExistingOrder(selectedTableId!)
      await refreshTables()
    } else {
      toast.error(result.error || "Failed to add items to order")
    }
  } catch (error) {
    console.error("Error adding items to order:", error)
    toast.error("Failed to add items to order")
  } finally {
    setSubmittingOrder(false)
  }
}, [existingOrder, orderItems, businessUnitId, loadExistingOrder, selectedTableId, refreshTables, setSubmittingOrder, initialData.businessUnit, selectedTableInfo, printNewItems, session, customerCount])

  const handleSubmitOrder = useCallback(async () => {
    if (!selectedTableId || orderItems.length === 0 || !initialData.businessUnit) {
      toast.error("Please select a table and add items to the order")
      return
    }

    setSubmittingOrder(true)

    try {
      const orderData = {
        tableId: selectedTableId,
        customerId: uiState.selectedCustomerId,
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
      if (uiState.isEditingOrder && existingOrder) {
        result = await updateOrder(businessUnitId, existingOrder.id, orderData)
      } else {
        result = await createOrder(businessUnitId, orderData, false)
      }

      if (result.success && result.order) {
        toast.success(uiState.isEditingOrder ? "Order updated successfully!" : "Order sent to kitchen/bar successfully!")

        try {
          await printOrderDetails(result.order, initialData.businessUnit, session?.user?.name)
          toast.success("Order details sent to printer")
        } catch (printErr) {
          console.error("Print error:", printErr)
          toast.warning("Order created but printing failed. Please print manually if needed.")
        }

        clearOrder()
        setUIState(prev => ({ ...prev, isEditingOrder: false }))
        setExistingOrder(null)
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
  }, [selectedTableId, orderItems, uiState.selectedCustomerId, uiState.isEditingOrder, isWalkIn, walkInName, customerCount, orderNotes, existingOrder, businessUnitId, clearOrder, refreshTables, setSubmittingOrder, initialData.businessUnit, printOrderDetails, session])

  // Save as draft
  const handleSaveAsDraft = useCallback(async () => {
    if (!selectedTableId || orderItems.length === 0) {
      toast.error("Please select a table and add items to save as draft")
      return
    }

    try {
      const orderData = {
        tableId: selectedTableId,
        customerId: uiState.selectedCustomerId,
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
        setUIState(prev => ({ ...prev, isEditingOrder: false }))
        setExistingOrder(null)
        await refreshTables()
      } else {
        toast.error(result.error || "Failed to save draft")
      }
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    }
  }, [selectedTableId, orderItems, uiState.selectedCustomerId, isWalkIn, walkInName, customerCount, orderNotes, businessUnitId, clearOrder, refreshTables])

  // Clear order - optimized
  const handleClearAll = useCallback(async () => {
    setClearingOrder(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    clearOrder()
    setUIState(prev => ({ ...prev, isEditingOrder: false }))
    setExistingOrder(null)
    setClearingOrder(false)
  }, [clearOrder, setClearingOrder])

  // Settle order - Fixed syntax error and duplicate function declaration
  const handleSettleOrder = useCallback(async () => {
    if (!existingOrder || !selectedTableId) {
      toast.error("No order to settle")
      return
    }

    updateUIState('isSettlingOrder', true)
    
    try {
      const result = await completeOrder(businessUnitId, existingOrder.id)
      
      if (result.success) {
        toast.success("Order completed successfully!")
        clearOrder()
        setUIState(prev => ({ ...prev, isEditingOrder: false }))
        setExistingOrder(null)
        await refreshTables()
      } else {
        toast.error(result.error || "Failed to complete order")
      }
    } catch (error) {
      console.error("Error settling order:", error)
      toast.error("Failed to settle order")
    } finally {
      updateUIState('isSettlingOrder', false)
    }
  }, [existingOrder, selectedTableId, businessUnitId, clearOrder, refreshTables, updateUIState])

  const handleSendDraftToKitchen = useCallback(async () => {
    if (!existingOrder || existingOrder.status !== OrderStatus.PENDING || !initialData.businessUnit) {
      toast.error("Order is not a draft")
      return
    }

    setSubmittingOrder(true)

    try {
      const result = await sendOrderToKitchenAndBar(existingOrder.id, businessUnitId)

      if (result.success) {
        toast.success("Draft order sent to kitchen successfully!")

        const updatedOrderData = await getOrder(businessUnitId, existingOrder.id)
        if (updatedOrderData) {
          setExistingOrder(updatedOrderData)

          try {
            await printOrderDetails(updatedOrderData, initialData.businessUnit, session?.user?.name)
            toast.success("Order details sent to printer")
          } catch (printErr) {
            console.error("Print error:", printErr)
            toast.warning("Order sent but printing failed. Please print manually if needed.")
          }
        }

        await refreshTables()
      } else {
        toast.error(result.error || "Failed to send draft order to kitchen")
      }
    } catch (error) {
      console.error("Error sending draft order:", error)
      toast.error("Failed to send draft order")
    } finally {
      setSubmittingOrder(false)
    }
  }, [existingOrder, businessUnitId, refreshTables, setSubmittingOrder, initialData.businessUnit, printOrderDetails, session])

  // Handle table selection
  const handleTableSelect = useCallback((tableId: string) => {
    setSelectedTable(tableId)
  }, [setSelectedTable])

  // Handle customer type change
  const handleCustomerTypeChange = useCallback((isWalkInCustomer: boolean) => {
    if (isWalkInCustomer) {
      setCustomerInfo(undefined, true, undefined)
      updateUIState('selectedCustomerId', undefined)
    } else {
      setCustomerInfo(undefined, false, undefined)
      updateUIState('selectedCustomerId', undefined)
    }
  }, [setCustomerInfo, updateUIState])

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-gray-50">
      <TableGrid
        tables={tables}
        selectedTableId={selectedTableId}
        isCollapsed={uiState.isTablesCollapsed}
        onTableSelect={handleTableSelect}
        onToggleCollapse={() => updateUIState('isTablesCollapsed', !uiState.isTablesCollapsed)}
      />

      <MenuPanel
        categories={initialData.categories}
        menuItems={initialData.menuItems}
        selectedCategory={uiState.selectedCategory}
        searchQuery={uiState.searchQuery}
        addingItemId={uiState.addingItemId}
        onCategorySelect={(category) => updateUIState('selectedCategory', category)}
        onSearchChange={(query) => updateUIState('searchQuery', query)}
        onAddToOrder={handleAddToOrder}
      />

      <OrderSummaryPanel
        selectedTable={selectedTableInfo}
        existingOrder={existingOrder}
        orderItems={orderItems}
        isWalkIn={isWalkIn}
        walkInName={walkInName}
        onWalkInNameChange={handleWalkInNameChange}
        customerCount={customerCount}
        orderNotes={orderNotes}
        isEditingOrder={uiState.isEditingOrder}
        isLoadingOrder={uiState.isLoadingOrder}
        isSettlingOrder={uiState.isSettlingOrder}
        isSubmittingOrder={isSubmittingOrder}
        isClearingOrder={isClearingOrder}
        businessUnit={initialData.businessUnit}
        currentTime={currentTime}
        getSubtotal={getSubtotal}
        getTax={getTax}
        getTotal={getTotal}
        onCustomerTypeChange={handleCustomerTypeChange}
        onCustomerCountChange={setCustomerCount}
        onOrderNotesChange={setOrderNotes}
        onUpdateQuantity={updateQuantity}
        onRemoveFromOrder={removeFromOrder}
        onSubmitOrder={handleSubmitOrder}
        onSaveAsDraft={handleSaveAsDraft}
        onSettleOrder={handleSettleOrder}
        onSendDraftToKitchen={handleSendDraftToKitchen}
        onClearAll={handleClearAll}
        onAddMoreItems={handleAddMoreItems}
      />
    </div>
  )
}

export default WaiterOrderSystem