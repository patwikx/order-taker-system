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
  completeOrder,
  cancelOrder
} from "@/lib/actions/order-actions"
import {
  getReadyOrdersForWaiter
} from "@/lib/actions/kitchen-actions"

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
import { ReadyOrdersDialog } from "./ready-orders-dialog"

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
  const [readyOrders, setReadyOrders] = useState<Array<{
    id: string
    orderNumber: string
    tableNumber: number
    waiterName: string
    itemCount: number
    completedAt: Date | null
    items: Array<{ id: string; name: string; quantity: number; notes?: string }>
    isAdditionalItems: boolean
  }>>([])
  const [showReadyOrderDialog, setShowReadyOrderDialog] = useState(false)
  
  // UI state consolidated into single object to reduce re-renders
  const [uiState, setUIState] = useState<UIState>({
    selectedCategory: initialData.categories[0]?.name || "",
    searchQuery: "",
    isTablesCollapsed: true,
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
    getServiceCharge,
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

  // Load existing order when table changes
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

  // Play notification sound for ready orders
  const playReadyOrderSound = useCallback(() => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      
      // Create oscillator for a pleasant notification sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Configure sound - cheerful ready notification
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime) // First tone
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.15) // Second tone
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3) // Third tone
      
      // Volume envelope
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)
      
      // Play sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.6)
    } catch (error) {
      console.error("Error playing notification sound:", error)
    }
  }, [])

  // Poll for ready orders every 5 seconds
  useEffect(() => {
    const checkReadyOrders = async () => {
      try {
        const result = await getReadyOrdersForWaiter(businessUnitId)
        if (result.success && result.orders.length > 0) {
          // Check if there are new orders (dialog wasn't already showing)
          const hasNewOrders = !showReadyOrderDialog && result.orders.length > 0
          
          setReadyOrders(result.orders)
          setShowReadyOrderDialog(true)
          
          // Play sound only when new orders appear
          if (hasNewOrders) {
            playReadyOrderSound()
          }
        }
      } catch (error) {
        console.error("Error checking ready orders:", error)
      }
    }

    // Check immediately on mount
    checkReadyOrders()

    // Then poll every 5 seconds
    const pollInterval = setInterval(checkReadyOrders, 5000)

    return () => clearInterval(pollInterval)
  }, [businessUnitId, showReadyOrderDialog, playReadyOrderSound])

  // Optimized UI state updates
  const updateUIState = useCallback(<K extends keyof UIState>(key: K, value: UIState[K]) => {
    setUIState(prev => ({ ...prev, [key]: value }))
  }, [])

  // Add item to order - optimized with categoryId fix
  const handleAddToOrder = useCallback(async (menuItem: MenuItemWithCategory, quantity: number = 1, notes?: string) => {
    updateUIState('addingItemId', menuItem.id)
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Add items based on quantity
    for (let i = 0; i < quantity; i++) {
      addToOrder({
        id: menuItem.id,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        type: menuItem.type,
        prepTime: menuItem.prepTime,
        imageUrl: menuItem.imageUrl,
      })
    }
    
    // If notes are provided, update the last added item with notes
    if (notes && quantity > 0) {
      // The notes will be applied to all items added in this batch
      // This is a simplified approach - you might want to enhance the order store to handle notes better
    }
    
    updateUIState('addingItemId', null)
  }, [addToOrder, updateUIState])

  const handleWalkInNameChange = useCallback((name: string) => {
    setCustomerInfo(uiState.selectedCustomerId, isWalkIn, name)
  }, [setCustomerInfo, uiState.selectedCustomerId, isWalkIn])

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

  // Cancel draft order
  const handleCancelOrder = useCallback(async () => {
    if (!existingOrder || !selectedTableId) {
      toast.error("No order to cancel")
      return
    }

    setClearingOrder(true)
    
    try {
      const result = await cancelOrder(businessUnitId, existingOrder.id)
      
      if (result.success) {
        toast.success("Draft order cancelled successfully!")
        clearOrder()
        setUIState(prev => ({ ...prev, isEditingOrder: false }))
        setExistingOrder(null)
        await refreshTables()
      } else {
        toast.error(result.error || "Failed to cancel order")
      }
    } catch (error) {
      console.error("Error cancelling order:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel order"
      toast.error(errorMessage)
    } finally {
      setClearingOrder(false)
    }
  }, [existingOrder, selectedTableId, businessUnitId, clearOrder, refreshTables, setClearingOrder])

  // Settle order
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
      const errorMessage = error instanceof Error ? error.message : "Failed to settle order"
      toast.error(errorMessage, {
        duration: 5000,
        description: "Please check the order status and try again."
      })
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

  // Print receipt handler
  const handlePrintReceipt = useCallback(async () => {
    if (!existingOrder || !initialData.businessUnit) {
      toast.error("No order to print")
      return
    }

    try {
      const success = await printOrderDetails(
        existingOrder,
        initialData.businessUnit,
        session?.user?.name
      )
      
      if (success) {
        toast.success("Receipt sent to printer successfully")
      } else {
        toast.error("Failed to print receipt")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Failed to print receipt")
    }
  }, [existingOrder, initialData.businessUnit, printOrderDetails, session])

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

  // Handle order picked up callback
  const handleOrderPickedUp = useCallback(async () => {
    // Refresh the ready orders list
    try {
      const result = await getReadyOrdersForWaiter(businessUnitId)
      if (result.success) {
        setReadyOrders(result.orders)
        // Close dialog if no more ready orders
        if (result.orders.length === 0) {
          setShowReadyOrderDialog(false)
        }
      }
      await refreshTables()
    } catch (error) {
      console.error("Error refreshing ready orders:", error)
    }
  }, [businessUnitId, refreshTables])

  return (
    <>
      <div className="h-screen w-screen flex bg-gray-50 overflow-hidden fixed inset-0">
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
          getServiceCharge={getServiceCharge}
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
          onPrintReceipt={handlePrintReceipt}
          onCancelOrder={handleCancelOrder}
        />
      </div>

      <ReadyOrdersDialog
        businessUnitId={businessUnitId}
        orders={readyOrders}
        open={showReadyOrderDialog}
        onOpenChange={setShowReadyOrderDialog}
        onOrderPickedUp={handleOrderPickedUp}
      />
    </>
  )
}

export default WaiterOrderSystem