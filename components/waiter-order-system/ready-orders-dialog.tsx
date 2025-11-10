"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle2, Package } from "lucide-react"
import { markOrderPickedUp } from "@/lib/actions/kitchen-actions"
import { toast } from "sonner"

interface ReadyOrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
}

interface ReadyOrder {
  id: string
  orderNumber: string
  tableNumber: number
  waiterName: string
  itemCount: number
  completedAt: Date | null
  items: ReadyOrderItem[]
  isAdditionalItems: boolean
}

interface ReadyOrdersDialogProps {
  businessUnitId: string
  orders: ReadyOrder[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderPickedUp: () => void
}

export function ReadyOrdersDialog({
  businessUnitId,
  orders,
  open,
  onOpenChange,
  onOrderPickedUp
}: ReadyOrdersDialogProps) {
  const [pickingUp, setPickingUp] = useState<string | null>(null)

  const handlePickUp = async (orderId: string, orderNumber: string) => {
    setPickingUp(orderId)
    try {
      const result = await markOrderPickedUp(businessUnitId, orderId)
      if (result.success) {
        toast.success(`Order ${orderNumber} marked as picked up`)
        onOrderPickedUp()
      } else {
        toast.error(result.error || "Failed to mark order as picked up")
      }
    } catch (error) {
      console.error("Error marking order as picked up:", error)
      toast.error("Failed to mark order as picked up")
    } finally {
      setPickingUp(null)
    }
  }

  const formatTime = (date: Date | null) => {
    if (!date) return "N/A"
    const now = new Date()
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000 / 60)
    if (diff < 1) return "Just now"
    if (diff === 1) return "1 min ago"
    return `${diff} mins ago`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Package className="h-6 w-6 text-green-600" />
            Orders Ready for Pickup
            <Badge variant="secondary" className="ml-2">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No orders ready for pickup</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 bg-green-50 border-green-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">
                        {order.orderNumber}
                        {order.isAdditionalItems && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Additional
                          </Badge>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">Table {order.tableNumber}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(order.completedAt)}
                      </span>
                      <span>{order.itemCount} {order.itemCount === 1 ? "item" : "items"}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handlePickUp(order.id, order.orderNumber)}
                    disabled={pickingUp === order.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {pickingUp === order.id ? "Marking..." : "Pick Up"}
                  </Button>
                </div>

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 text-sm bg-white rounded p-2"
                    >
                      <Badge variant="secondary" className="mt-0.5">
                        {item.quantity}x
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {orders.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
