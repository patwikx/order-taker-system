/* eslint-disable @next/next/no-img-element */
"use client"

import { memo, useCallback, useState } from "react"
import { 
  ShoppingCart, 
  Clock, 
  Receipt, 
  UserX, 
  UserCheck, 
  Plus,  
  Trash2, 
  Send, 
  Save, 
  Coffee, 
  CheckCircle2, 
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Printer,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { OrderStatus, OrderItemStatus, ItemType } from "@prisma/client"
import type { CartItem } from "@/hooks/order-store"
import type { TableWithCurrentOrder } from "@/lib/actions/table-actions"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"

interface OrderSummaryPanelProps {
  selectedTable: TableWithCurrentOrder | undefined
  existingOrder: OrderWithDetails | null
  orderItems: CartItem[]
  isWalkIn: boolean
  walkInName?: string
  customerCount?: number
  orderNotes?: string
  isEditingOrder: boolean
  isLoadingOrder: boolean
  isSettlingOrder: boolean
  isSubmittingOrder: boolean
  isClearingOrder: boolean
  businessUnit: BusinessUnitDetails | null
  currentTime: Date
  getSubtotal: () => number
  getServiceCharge: (serviceChargeRate?: number) => number
  getTax: (taxRate: number) => number
  getTotal: (taxRate: number) => number
  onCustomerTypeChange: (isWalkIn: boolean) => void
  onCustomerCountChange: (count: number) => void
  onOrderNotesChange: (notes: string) => void
  onWalkInNameChange: (name: string) => void
  onUpdateQuantity: (itemId: string, change: number) => void
  onRemoveFromOrder: (itemId: string) => void
  onSubmitOrder: () => void
  onSaveAsDraft: () => void
  onSettleOrder: () => void
  onSendDraftToKitchen: () => void
  onClearAll: () => void
  onAddMoreItems: () => void
  onPrintReceipt: () => void
  onCancelOrder: () => void
}

const ImageWithFallback = memo(({ 
  src, 
  alt, 
  className, 
  itemType, 
  size = "default" 
}: { 
  src?: string
  alt: string
  className?: string
  itemType: ItemType
  size?: "small" | "default"
}) => {
  const iconSize = size === "small" ? "w-5 h-5" : "w-8 h-8"
  
  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        {itemType === ItemType.DRINK ? (
          <Coffee className={`${iconSize} text-gray-400`} />
        ) : (
          <Receipt className={`${iconSize} text-gray-400`} />
        )}
      </div>
    )
  }

  return (
    <div className={`${className} relative`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  )
})

ImageWithFallback.displayName = "ImageWithFallback"

const getItemStatusInfo = (status: OrderItemStatus) => {
  switch (status) {
    case OrderItemStatus.PENDING:
      return { color: "bg-yellow-100 text-yellow-800", text: "Pending", icon: Clock }
    case OrderItemStatus.CONFIRMED:
      return { color: "bg-blue-100 text-blue-800", text: "Confirmed", icon: CheckCircle2 }
    case OrderItemStatus.PREPARING:
      return { color: "bg-blue-100 text-blue-800", text: "Preparing", icon: Clock }
    case OrderItemStatus.READY:
      return { color: "bg-green-100 text-green-800", text: "Ready", icon: CheckCircle2 }
    case OrderItemStatus.SERVED:
      return { color: "bg-gray-100 text-gray-800", text: "Served", icon: CheckCircle2 }
    default:
      return { color: "bg-gray-100 text-gray-800", text: "Unknown", icon: Clock }
  }
}

const OrderItem = memo(({ 
  item, 
  onRemoveFromOrder 
}: { 
  item: CartItem
  onRemoveFromOrder: (itemId: string) => void
}) => {
  const statusInfo = getItemStatusInfo(item.status)
  const StatusIcon = statusInfo.icon
  const formatPrice = useCallback((price: number) => `₱${price.toFixed(2)}`, [])

  return (
    <div className={`rounded p-1.5 border ${
      item.isExistingItem 
        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex gap-1.5 items-center">
        <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
          <ImageWithFallback
            src={item.menuItem.imageUrl}
            alt={item.menuItem.name}
            className="w-full h-full"
            itemType={item.menuItem.type}
            size="small"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="font-medium text-gray-900 text-xs leading-tight truncate">{item.menuItem.name}</h4>
            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium flex-shrink-0">
              x{item.quantity}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <span
              className={`px-1 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 ${statusInfo.color}`}
            >
              <StatusIcon className="w-2 h-2" />
              {statusInfo.text}
            </span>
            <div className="font-semibold text-gray-900 text-xs">
              {formatPrice(item.menuItem.price * item.quantity)}
            </div>
          </div>
        </div>

        <button 
          onClick={() => onRemoveFromOrder(item.id)}
          disabled={item.isExistingItem}
          className={`p-0.5 rounded transition-colors flex-shrink-0 ${
            item.isExistingItem 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-red-500 hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
})

OrderItem.displayName = "OrderItem"

export const OrderSummaryPanel = memo(({ 
  selectedTable,
  existingOrder,
  orderItems,
  isWalkIn,
  walkInName,
  customerCount,
  orderNotes,
  isEditingOrder,
  isLoadingOrder,
  isSettlingOrder,
  isSubmittingOrder,
  isClearingOrder,
  businessUnit,
  currentTime,
  getSubtotal,
  getServiceCharge,
  getTax,
  getTotal,
  onCustomerTypeChange,
  onCustomerCountChange,
  onOrderNotesChange,
  onWalkInNameChange,
  onRemoveFromOrder,
  onSubmitOrder,
  onSaveAsDraft,
  onSettleOrder,
  onSendDraftToKitchen,
  onClearAll,
  onAddMoreItems,
  onPrintReceipt,
  onCancelOrder
}: OrderSummaryPanelProps) => {
  const formatPrice = useCallback((price: number) => `₱${price.toFixed(2)}`, [])
  const [isCustomerInfoCollapsed, setIsCustomerInfoCollapsed] = useState(true)
  const [showSettleDialog, setShowSettleDialog] = useState(false)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showSendToKitchenDialog, setShowSendToKitchenDialog] = useState(false)
  const [showSendDraftDialog, setShowSendDraftDialog] = useState(false)

  const subtotal = getSubtotal()
  const serviceCharge = getServiceCharge()
  const taxRate = businessUnit?.taxRate || 0.12
  const tax = getTax(taxRate)
  const total = getTotal(taxRate)

  const canAddMoreItems = existingOrder && 
    existingOrder.status !== OrderStatus.PENDING && 
    existingOrder.status !== OrderStatus.COMPLETED &&
    existingOrder.status !== OrderStatus.CANCELLED

  const hasNewItems = orderItems.some(item => !item.isExistingItem)

  const handleSettleOrder = () => {
    setShowSettleDialog(false)
    onSettleOrder()
  }

  const handlePrintReceipt = () => {
    setShowPrintDialog(false)
    onPrintReceipt()
  }

  const handleSendToKitchen = () => {
    setShowSendToKitchenDialog(false)
    onSubmitOrder()
  }

  const handleSendDraftToKitchen = () => {
    setShowSendDraftDialog(false)
    onSendDraftToKitchen()
  }

  return (
    <>
      <div className="w-80 md:w-96 lg:w-80 xl:w-96 bg-white border-l shadow-sm flex flex-col h-full max-h-screen min-h-0 overflow-hidden relative">
        {(isSubmittingOrder || isClearingOrder || isLoadingOrder || isSettlingOrder) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {isLoadingOrder 
                  ? "Loading order data..." 
                  : isSettlingOrder
                  ? "Settling order..."
                  : isSubmittingOrder 
                  ? (isEditingOrder ? "Updating Order..." : "Sending Order...") 
                  : "Clearing Order..."}
              </span>
            </div>
          </div>
        )}
        
        <div className="p-1.5 border-b bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0 min-h-0">
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

          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                Table {selectedTable?.number}
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
              onClick={onClearAll}
              disabled={isClearingOrder || isSubmittingOrder || isSettlingOrder}
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

        <div className="border-b bg-gray-50 flex-shrink-0">
          <div 
            className="p-1.5 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setIsCustomerInfoCollapsed(!isCustomerInfoCollapsed)}
          >
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gray-200 rounded">
                {isWalkIn ? (
                  <UserX className="w-3 h-3 text-gray-600" />
                ) : (
                  <UserCheck className="w-3 h-3 text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Customer Info</h3>
                <p className="text-xs text-gray-500">
                  {isWalkIn ? "Walk-in" : "Regular"} • {customerCount || 1} customer{(customerCount || 1) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              {isCustomerInfoCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </div>
          </div>

          {!isCustomerInfoCollapsed && (
            <div className="px-2 pb-1">
              <div className="space-y-1.5">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700">Customer Type:</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant={isWalkIn ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCustomerTypeChange(true)}
                      className="h-8 px-3 text-xs"
                    >
                      <UserX className="w-3 h-3 mr-1" />
                      Walk-in
                    </Button>
                    <Button
                      variant={!isWalkIn ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCustomerTypeChange(false)}
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
                      value={walkInName || ""}
                      onChange={(e) => onWalkInNameChange(e.target.value)}
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
                    onChange={(e) => onCustomerCountChange(parseInt(e.target.value) || 1)}
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
                    onChange={(e) => onOrderNotesChange(e.target.value)}
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-y-auto p-2 scrollbar-hide" style={{ height: 'calc(100vh - 380px)', minHeight: '200px' }}>
          {orderItems.length === 0 ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-1">No items in order</p>
              <p className="text-xs text-gray-400">Add items from the menu</p>
            </div>
          ) : (
            <div className="space-y-1">
              {orderItems.map((item) => (
                <OrderItem
                  key={item.id}
                  item={item}
                  onRemoveFromOrder={onRemoveFromOrder}
                />
              ))}
            </div>
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="border-t bg-white p-1.5 flex-shrink-0 min-h-0">
            <div className="space-y-0.5 mb-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900 font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Service Charge (10%)</span>
                <span className="text-gray-900 font-medium">{formatPrice(serviceCharge)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">VAT ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="text-gray-900 font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-1">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-1">
              {canAddMoreItems && hasNewItems && (
                <Button 
                  onClick={onAddMoreItems}
                  disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all duration-200 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Add More Items
                </Button>
              )}

              {existingOrder?.status === OrderStatus.PENDING ? (
                <>
                  <Button 
                    onClick={() => setShowSendDraftDialog(true)}
                    disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all duration-200 text-xs"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Send Draft to Kitchen
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={onCancelOrder}
                    disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all duration-200 text-xs"
                  >
                    {isClearingOrder ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Cancel Draft
                      </>
                    )}
                  </Button>
                </>
              ) : existingOrder && existingOrder.status !== OrderStatus.IN_PROGRESS ? (
                <Button 
                  onClick={() => setShowSettleDialog(true)}
                  disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all duration-200 text-xs"
                >
                  {isSettlingOrder ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Settling...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Settle Order
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => hasNewItems ? setShowSendToKitchenDialog(true) : undefined}
                  disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder || !hasNewItems}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all duration-200 text-xs"
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      {hasNewItems ? "Send Order" : "No New Items"}
                    </>
                  )}
                </Button>
              )}

              <div className="flex grid grid-cols-2 gap-1">
                {(!existingOrder || existingOrder.status === OrderStatus.PENDING) && hasNewItems && (
                  <Button 
                    onClick={onSaveAsDraft}
                    disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                    variant="outline" 
                    className="py-1 px-2 w-full rounded-lg font-medium flex items-center justify-center gap-1 transition-all duration-200 text-xs"
                  >
                    <Save className="w-3 h-3" />
                    Save Draft
                  </Button>
                )}


                {existingOrder && existingOrder.status !== OrderStatus.PENDING && (
                  <>
                    <Button 
                      onClick={() => setShowPrintDialog(true)}
                      disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                      variant="outline" 
                      className="py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all duration-200 text-xs"
                    >
                      <Printer className="w-3 h-3" />
                      Print
                    </Button>
                    {!orderItems.every(item => item.status === OrderItemStatus.SERVED) && (
                      <Button 
                        disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                        variant="destructive" 
                        className="py-1 px-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-all duration-200 text-xs"
                      >
                        <XCircle className="w-3 h-3" />
                        Cancel
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Confirm Order Settlement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to settle this order?
            </AlertDialogDescription>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Total:</span>
                  <span className="font-bold text-green-600">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Table:</span>
                  <span>#{selectedTable?.number}</span>
                </div>
                {existingOrder && (
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Order Number:</span>
                    <span>{existingOrder.orderNumber}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Once settled, this order will be marked as completed and cannot be modified.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSettleOrder}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Settle Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-500" />
              Print Kitchen Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Print this order to the default printer (Kitchen/Bar)?
            </AlertDialogDescription>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Total:</span>
                  <span className="font-bold text-green-600">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Table:</span>
                  <span>#{selectedTable?.number}</span>
                </div>
                {existingOrder && (
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Order Number:</span>
                    <span>{existingOrder.orderNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Items:</span>
                  <span>{orderItems.length} item{orderItems.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                This will send the kitchen order to your default printer.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePrintReceipt}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSendToKitchenDialog} onOpenChange={setShowSendToKitchenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              Send Order to Kitchen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send this order to the kitchen/bar and print?
            </AlertDialogDescription>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Total:</span>
                  <span className="font-bold text-green-600">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Table:</span>
                  <span>#{selectedTable?.number}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>New Items:</span>
                  <span>{orderItems.filter(item => !item.isExistingItem).length} item{orderItems.filter(item => !item.isExistingItem).length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Customer Count:</span>
                  <span>{customerCount || 1} customer{(customerCount || 1) > 1 ? 's' : ''}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                The order will be sent to the kitchen/bar and automatically printed to the default printer.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendToKitchen}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send & Print
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSendDraftDialog} onOpenChange={setShowSendDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              Send Draft to Kitchen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send this draft order to the kitchen/bar and print?
            </AlertDialogDescription>
            <div className="space-y-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Order Total:</span>
                  <span className="font-bold text-green-600">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Table:</span>
                  <span>#{selectedTable?.number}</span>
                </div>
                {existingOrder && (
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Order Number:</span>
                    <span>{existingOrder.orderNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Items:</span>
                  <span>{orderItems.length} item{orderItems.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Customer Count:</span>
                  <span>{customerCount || 1} customer{(customerCount || 1) > 1 ? 's' : ''}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                This will change the order from draft to active, send it to kitchen/bar, and print automatically.
              </p>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSendDraftToKitchen}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send & Print
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})

OrderSummaryPanel.displayName = "OrderSummaryPanel"