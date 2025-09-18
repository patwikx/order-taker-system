"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  ChefHat,
  Clock,
  Users,
  CheckCircle2,
  Play,
  AlertCircle,
  Timer,
  Utensils,
  RefreshCw,
} from "lucide-react"

import { KitchenOrderStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

// Server actions
import { 
  getKitchenOrders, 
  acceptKitchenOrder, 
  startPreparingOrder, 
  markOrderReady,
  type KitchenOrderWithDetails 
} from "@/lib/actions/kitchen-actions"

const KitchenDisplayPage = () => {
  const params = useParams()
  const businessUnitId = params.businessUnitId as string

  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Load kitchen orders - wrapped in useCallback
  const loadKitchenOrders = useCallback(async () => {
    try {
      const orders = await getKitchenOrders(businessUnitId)
      setKitchenOrders(orders)
    } catch (error) {
      console.error("Error loading kitchen orders:", error)
      toast.error("Failed to load kitchen orders")
    } finally {
      setIsLoading(false)
    }
  }, [businessUnitId])

  // Initial load
  useEffect(() => {
    loadKitchenOrders()
  }, [loadKitchenOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadKitchenOrders()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadKitchenOrders])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Handle order status updates
  const handleAcceptOrder = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      const result = await acceptKitchenOrder(businessUnitId, orderId)
      if (result.success) {
        toast.success("Order accepted!")
        await loadKitchenOrders()
      } else {
        toast.error(result.error || "Failed to accept order")
      }
    } catch (error) {
      console.error("Error accepting order:", error)
      toast.error("Failed to accept order")
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleStartPreparing = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      const result = await startPreparingOrder(businessUnitId, orderId)
      if (result.success) {
        toast.success("Started preparing order!")
        await loadKitchenOrders()
      } else {
        toast.error(result.error || "Failed to start preparing")
      }
    } catch (error) {
      console.error("Error starting preparation:", error)
      toast.error("Failed to start preparing")
    } finally {
      setProcessingOrderId(null)
    }
  }

  const handleMarkReady = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      const result = await markOrderReady(businessUnitId, orderId)
      if (result.success) {
        toast.success("Order marked as ready!")
        await loadKitchenOrders()
      } else {
        toast.error(result.error || "Failed to mark as ready")
      }
    } catch (error) {
      console.error("Error marking order ready:", error)
      toast.error("Failed to mark as ready")
    } finally {
      setProcessingOrderId(null)
    }
  }

  // Get status info
  const getStatusInfo = (status: KitchenOrderStatus) => {
    switch (status) {
      case KitchenOrderStatus.PENDING:
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", text: "New Order", icon: AlertCircle }
      case KitchenOrderStatus.ACCEPTED:
        return { color: "bg-blue-100 text-blue-800 border-blue-200", text: "Accepted", icon: CheckCircle2 }
      case KitchenOrderStatus.PREPARING:
        return { color: "bg-orange-100 text-orange-800 border-orange-200", text: "Preparing", icon: Timer }
      case KitchenOrderStatus.READY:
        return { color: "bg-green-100 text-green-800 border-green-200", text: "Ready", icon: CheckCircle2 }
      default:
        return { color: "bg-gray-100 text-gray-800 border-gray-200", text: "Unknown", icon: AlertCircle }
    }
  }

  // Calculate elapsed time
  const getElapsedTime = (createdAt: Date, startedAt?: Date) => {
    const now = currentTime
    const start = startedAt || createdAt
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
    return elapsed
  }

  // Get action button for order
  const getActionButton = (order: KitchenOrderWithDetails) => {
    const isProcessing = processingOrderId === order.id

    switch (order.status) {
      case KitchenOrderStatus.PENDING:
        return (
          <Button
            onClick={() => handleAcceptOrder(order.id)}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Accept Order
          </Button>
        )
      case KitchenOrderStatus.ACCEPTED:
        return (
          <Button
            onClick={() => handleStartPreparing(order.id)}
            disabled={isProcessing}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Start Preparing
          </Button>
        )
      case KitchenOrderStatus.PREPARING:
        return (
          <Button
            onClick={() => handleMarkReady(order.id)}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Mark Ready
          </Button>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ChefHat className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
              <p className="text-gray-600">
                {kitchenOrders.length} active orders • {currentTime.toLocaleTimeString("en-PH")}
              </p>
            </div>
          </div>
          <Button
            onClick={loadKitchenOrders}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
          <p className="text-gray-500 text-center">
            All caught up! New orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {kitchenOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status)
            const StatusIcon = statusInfo.icon
            const elapsedTime = getElapsedTime(order.createdAt, order.startedAt)
            const isOverdue = elapsedTime > (order.estimatedTime || 20)

            return (
              <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">
                      {order.orderNumber}
                    </CardTitle>
                    <Badge className={`${statusInfo.color} border`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.text}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Table {order.tableNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-500' : ''}`} />
                      <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                        {elapsedTime}m
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    Waiter: {order.waiterName}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          {item.notes && (
                            <div className="text-xs text-orange-600 mt-1">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-2">
                          <div className="font-bold text-sm">×{item.quantity}</div>
                          {item.prepTime && (
                            <div className="text-xs text-gray-500">{item.prepTime}m</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-xs font-medium text-yellow-800 mb-1">Order Notes:</div>
                      <div className="text-xs text-yellow-700">{order.notes}</div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-2">
                    {getActionButton(order)}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default KitchenDisplayPage