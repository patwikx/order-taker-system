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
  Minus, 
  Trash2, 
  Send, 
  Save, 
  Coffee, 
  CheckCircle2, 
  Loader2,
  ChevronDown,
  ChevronUp 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  // Added the calculation functions
  getSubtotal: () => number
  getTax: (taxRate: number) => number
  getTotal: (taxRate: number) => number
  onCustomerTypeChange: (isWalkIn: boolean) => void
  onCustomerCountChange: (count: number) => void
  onOrderNotesChange: (notes: string) => void
  onWalkInNameChange: (name: string) => void // Added this prop
  onUpdateQuantity: (itemId: string, change: number) => void
  onRemoveFromOrder: (itemId: string) => void
  onSubmitOrder: () => void
  onSaveAsDraft: () => void
  onSettleOrder: () => void
  onSendDraftToKitchen: () => void
  onClearAll: () => void
  onAddMoreItems: () => void
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
  onUpdateQuantity, 
  onRemoveFromOrder 
}: { 
  item: CartItem
  onUpdateQuantity: (itemId: string, change: number) => void
  onRemoveFromOrder: (itemId: string) => void
}) => {
  const statusInfo = getItemStatusInfo(item.status)
  const StatusIcon = statusInfo.icon
  const formatPrice = useCallback((price: number) => `₱${price.toFixed(2)}`, [])

  return (
    <div className={`rounded-lg p-2.5 border ${
      item.isExistingItem 
        ? 'bg-blue-50 border-blue-200' // Blue background for existing items
        : 'bg-gray-50 border-gray-200'  // Gray background for new items
    }`}>
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
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 text-sm truncate">{item.menuItem.name}</h4>
                {item.isExistingItem && (
                  <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                    Existing
                  </span>
                )}
                {!item.isExistingItem && (
                  <span className="bg-green-600 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                    New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
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
            onClick={() => onUpdateQuantity(item.id, -1)}
            disabled={item.isExistingItem} // Disable quantity changes for existing items
            className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center transition-colors ${
              item.isExistingItem 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, 1)}
            disabled={item.isExistingItem} // Disable quantity changes for existing items
            className={`w-6 h-6 border border-gray-300 rounded flex items-center justify-center transition-colors ${
              item.isExistingItem 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <button 
          onClick={() => onRemoveFromOrder(item.id)}
          disabled={item.isExistingItem} // Disable removal for existing items
          className={`p-1.5 rounded-md transition-colors ${
            item.isExistingItem 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-red-500 hover:bg-red-50'
          }`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {item.isExistingItem && (
        <div className="mt-2 text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
          This item is from the existing order and cannot be modified here
        </div>
      )}
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
  getTax,
  getTotal,
  onCustomerTypeChange,
  onCustomerCountChange,
  onOrderNotesChange,
  onWalkInNameChange, // Added this prop
  onUpdateQuantity,
  onRemoveFromOrder,
  onSubmitOrder,
  onSaveAsDraft,
  onSettleOrder,
  onSendDraftToKitchen,
  onClearAll,
  onAddMoreItems
}: OrderSummaryPanelProps) => {
  const formatPrice = useCallback((price: number) => `₱${price.toFixed(2)}`, [])
  const [isCustomerInfoCollapsed, setIsCustomerInfoCollapsed] = useState(false)

  // Use the calculation functions from the store instead of manual calculation
  const subtotal = getSubtotal()
  const taxRate = businessUnit?.taxRate || 0.12 // Default to 12% if no business unit
  const tax = getTax(taxRate)
  const total = getTotal(taxRate)

  const canAddMoreItems = existingOrder && 
    existingOrder.status !== OrderStatus.PENDING && 
    existingOrder.status !== OrderStatus.COMPLETED &&
    existingOrder.status !== OrderStatus.CANCELLED

  // Check if there are any new items to add
  const hasNewItems = orderItems.some(item => !item.isExistingItem)

  return (
    <div className="w-96 bg-white border-l shadow-sm flex flex-col h-full relative">
      {/* Loading Overlay */}
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

      {/* Customer Information - Collapsible */}
      <div className="border-b bg-gray-50">
        {/* Header */}
        <div 
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
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

        {/* Collapsible Content */}
        {!isCustomerInfoCollapsed && (
          <div className="px-3 pb-3">
            <div className="space-y-3">
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
            {orderItems.map((item) => (
              <OrderItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveFromOrder={onRemoveFromOrder}
              />
            ))}
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
              <span className="text-gray-600">VAT ({(taxRate * 100).toFixed(0)}%)</span>
              <span className="text-gray-900 font-medium">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-1.5">
              <span>Total</span>
              <span className="text-green-600">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Add More Items Button for existing orders */}
            {canAddMoreItems && hasNewItems && (
              <Button 
                onClick={onAddMoreItems}
                disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add More Items
              </Button>
            )}

            {/* Main action button */}
            {existingOrder?.status === OrderStatus.PENDING ? (
              <Button 
                onClick={onSendDraftToKitchen}
                disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending to Kitchen...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Draft to Kitchen
                  </>
                )}
              </Button>
            ) : existingOrder && existingOrder.status !== OrderStatus.IN_PROGRESS ? (
              <Button 
                onClick={onSettleOrder}
                disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
              >
                {isSettlingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Settling Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Settle Order
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={onSubmitOrder}
                disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder || !hasNewItems}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Order...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {hasNewItems ? "Send to Kitchen" : "No New Items"}
                  </>
                )}
              </Button>
            )}

            {/* Secondary buttons */}
            <div className="grid grid-cols-2 gap-2">
              {(!existingOrder || existingOrder.status === OrderStatus.PENDING) && hasNewItems && (
                <Button 
                  onClick={onSaveAsDraft}
                  disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                  variant="outline" 
                  className="py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Draft
                </Button>
              )}

              {!existingOrder && (
                <Button 
                  disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                  variant="outline" 
                  className="py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                >
                  <Coffee className="w-4 h-4" />
                  Bar
                </Button>
              )}

              {existingOrder && existingOrder.status !== OrderStatus.PENDING && (
                <>
                  <Button 
                    disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                    variant="outline" 
                    className="py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                  >
                    <Receipt className="w-4 h-4" />
                    Print
                  </Button>
                  <Button 
                    disabled={isSubmittingOrder || isClearingOrder || isSettlingOrder}
                    variant="outline" 
                    className="py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 text-sm"
                  >
                    <Coffee className="w-4 h-4" />
                    Add Drinks
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

OrderSummaryPanel.displayName = "OrderSummaryPanel"