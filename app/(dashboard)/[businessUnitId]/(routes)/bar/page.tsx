"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  Wine,
  Clock,
  Users,
  CheckCircle2,
  Play,
  Timer,
  GlassWater,
  RefreshCw,
  Plus,
  AlertCircle,
  StickyNote,
  History,
  Package,
} from "lucide-react"

import { BarOrderStatus } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"

// Server actions
import { 
  getBarOrders,
  getCompletedBarOrders,
  startPreparingBarOrder, 
  markBarOrderReady,
  markBarOrderPickedUp,
  type BarOrderWithDetails 
} from "@/lib/actions/bar-actions"

const BarDisplayPage = () => {
  const params = useParams()
  const businessUnitId = params.businessUnitId as string

  const [barOrders, setBarOrders] = useState<BarOrderWithDetails[]>([])
  const [completedOrders, setCompletedOrders] = useState<BarOrderWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showCompletedOrders, setShowCompletedOrders] = useState(false)

  // Load bar orders - wrapped in useCallback
  const loadBarOrders = useCallback(async () => {
    try {
      const orders = await getBarOrders(businessUnitId)
      setBarOrders(orders)
    } catch (error) {
      console.error("Error loading bar orders:", error)
      toast.error("Failed to load bar orders")
    } finally {
      setIsLoading(false)
    }
  }, [businessUnitId])

  // Load completed orders
  const loadCompletedOrders = useCallback(async () => {
    try {
      const orders = await getCompletedBarOrders(businessUnitId)
      setCompletedOrders(orders)
    } catch (error) {
      console.error("Error loading completed orders:", error)
      toast.error("Failed to load completed orders")
    }
  }, [businessUnitId])

  // Initial load
  useEffect(() => {
    loadBarOrders()
  }, [loadBarOrders])

  // Auto-refresh every 15 seconds (more frequent for bar)
  useEffect(() => {
    const interval = setInterval(() => {
      loadBarOrders()
    }, 15000)
    return () => clearInterval(interval)
  }, [loadBarOrders])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Handle start preparing
  const handleStartPreparing = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      const result = await startPreparingBarOrder(businessUnitId, orderId)
      if (result.success) {
        toast.success("Started preparing drinks!")
        await loadBarOrders()
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

  // Handle mark ready
  const handleMarkReady = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      const result = await markBarOrderReady(businessUnitId, orderId)
      if (result.success) {
        toast.success("Drinks marked as ready!")
        await loadBarOrders()
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

  // Handle mark as picked up
  const handleMarkPickedUp = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      const result = await markBarOrderPickedUp(businessUnitId, orderId)
      if (result.success) {
        toast.success("Order marked as picked up!")
        await loadBarOrders()
      } else {
        toast.error(result.error || "Failed to mark as picked up")
      }
    } catch (error) {
      console.error("Error marking order picked up:", error)
      toast.error("Failed to mark as picked up")
    } finally {
      setProcessingOrderId(null)
    }
  }

  // Calculate elapsed time
  const getElapsedTime = (createdAt: Date, startedAt?: Date) => {
    const now = currentTime
    const start = startedAt || createdAt
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
    return elapsed
  }

  // Get time urgency color
  const getTimeUrgency = (elapsedTime: number, estimatedTime?: number) => {
    const maxTime = estimatedTime || 10 // Drinks typically take less time than food
    if (elapsedTime > maxTime) return "text-red-600 font-bold"
    if (elapsedTime > maxTime * 0.8) return "text-amber-600 font-medium"
    return "text-gray-600"
  }

  // Get action button for order
  const getActionButton = (order: BarOrderWithDetails) => {
    const isProcessing = processingOrderId === order.id

    switch (order.status) {
      case BarOrderStatus.PENDING:
        return (
          <Button
            onClick={() => handleStartPreparing(order.id)}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2"
            size="sm"
          >
            {isProcessing ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Play className="w-3 h-3 mr-1" />
            )}
            Start Preparing
          </Button>
        )
      case BarOrderStatus.PREPARING:
        return (
          <Button
            onClick={() => handleMarkReady(order.id)}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2"
            size="sm"
          >
            {isProcessing ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            Mark Ready
          </Button>
        )
      case BarOrderStatus.READY:
        return (
          <Button
            onClick={() => handleMarkPickedUp(order.id)}
            disabled={isProcessing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm py-2"
            size="sm"
          >
            {isProcessing ? (
              <RefreshCw className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Package className="w-3 h-3 mr-1" />
            )}
            Mark Picked Up
          </Button>
        )
      default:
        return null
    }
  }

  // Group orders by status
  const ordersByStatus = {
    pending: barOrders.filter(order => order.status === BarOrderStatus.PENDING),
    preparing: barOrders.filter(order => order.status === BarOrderStatus.PREPARING),
    ready: barOrders.filter(order => order.status === BarOrderStatus.READY)
  }

  // Render order card
  const renderOrderCard = (order: BarOrderWithDetails) => {
    const elapsedTime = getElapsedTime(order.createdAt, order.startedAt)
    const timeUrgency = getTimeUrgency(elapsedTime, order.estimatedTime)

    return (
      <Card key={order.id} className="border border-gray-200 bg-white hover:shadow-md transition-shadow mb-3">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-1">
              {order.orderNumber}
              {order.isAdditionalItems && (
                <Plus className="w-3 h-3 text-blue-600" />
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Clock className={`w-3 h-3 ${elapsedTime > (order.estimatedTime || 8) ? 'text-red-500' : 'text-gray-400'}`} />
              <span className={`text-xs ${timeUrgency}`}>
                {elapsedTime}m
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
              <Users className="w-3 h-3 text-slate-600" />
              <span className="font-bold text-slate-800">Table {order.tableNumber}</span>
            </div>
            <span className="text-gray-600">{order.waiterName}</span>
          </div>
        </CardHeader>

        <CardContent className="px-3 pb-3 space-y-2">
          {/* Order Items */}
          <div className="space-y-1">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start text-xs bg-gray-50 p-2 rounded">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                  {item.notes && (
                    <div className="text-blue-600 mt-1 text-xs">
                      {item.notes}
                    </div>
                  )}
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <div className="font-bold">×{item.quantity}</div>
                  {item.prepTime && (
                    <div className="text-gray-500">{item.prepTime}m</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <div className="flex items-center gap-1 font-medium text-blue-800 mb-1">
                <StickyNote className="w-3 h-3" />
                Order Notes:
              </div>
              <div className="text-blue-700">{order.notes}</div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-1">
            {getActionButton(order)}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading bar orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50 p-4 overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wine className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bar Display System</h1>
              <p className="text-sm text-gray-600">
                {barOrders.length} active orders • {currentTime.toLocaleTimeString("en-PH")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Sheet open={showCompletedOrders} onOpenChange={setShowCompletedOrders}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  size="sm"
                  onClick={loadCompletedOrders}
                >
                  <History className="w-4 h-4" />
                  Completed Orders
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[600px] sm:w-[800px]">
                <SheetHeader>
                  <SheetTitle>Completed Orders (Last 24 Hours)</SheetTitle>
                  <SheetDescription>
                    Drink orders that have been served and picked up
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {completedOrders.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <GlassWater className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      No completed orders found
                    </div>
                  ) : (
                    completedOrders.map((order) => (
                      <Card key={order.id} className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                              {order.orderNumber}
                              {order.isAdditionalItems && (
                                <Plus className="w-3 h-3 text-blue-600" />
                              )}
                            </CardTitle>
                            <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                              Served
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                              <Users className="w-3 h-3 text-slate-600" />
                              <span className="font-bold text-slate-800">Table {order.tableNumber}</span>
                            </div>
                            <div className="text-right">
                              <div>Waiter: {order.waiterName}</div>
                              {order.completedAt && (
                                <div className="text-green-600">
                                  Served: {order.completedAt.toLocaleTimeString("en-PH")}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3 pb-3">
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-start text-xs bg-gray-50 p-2 rounded">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{item.name}</div>
                                  {item.notes && (
                                    <div className="text-blue-600 mt-1">{item.notes}</div>
                                  )}
                                </div>
                                <div className="font-bold">×{item.quantity}</div>
                              </div>
                            ))}
                          </div>
                          {order.notes && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <div className="flex items-center gap-1 font-medium text-blue-800 mb-1">
                                <StickyNote className="w-3 h-3" />
                                Order Notes:
                              </div>
                              <div className="text-blue-700">{order.notes}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>
            
            <Button
              onClick={loadBarOrders}
              variant="outline"
              className="flex items-center gap-2"
              size="sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Column Layout */}
      {barOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <GlassWater className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
          <p className="text-gray-500 text-center">
            All caught up! New drink orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 h-[calc(100%-120px)]">
          {/* Pending Orders Column */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-yellow-100 p-3 border-b border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <h2 className="font-bold text-gray-900">PENDING</h2>
                </div>
                <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300">
                  {ordersByStatus.pending.length}
                </Badge>
              </div>
            </div>
            <div className="p-3 overflow-y-auto h-[calc(100%-60px)]">
              {ordersByStatus.pending.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-8">
                  No pending orders
                </div>
              ) : (
                ordersByStatus.pending.map(renderOrderCard)
              )}
            </div>
          </div>

          {/* Preparing Orders Column */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-100 p-3 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <h2 className="font-bold text-gray-900">PREPARING</h2>
                </div>
                <Badge className="bg-blue-200 text-blue-800 border-blue-300">
                  {ordersByStatus.preparing.length}
                </Badge>
              </div>
            </div>
            <div className="p-3 overflow-y-auto h-[calc(100%-60px)]">
              {ordersByStatus.preparing.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-8">
                  No orders in preparation
                </div>
              ) : (
                ordersByStatus.preparing.map(renderOrderCard)
              )}
            </div>
          </div>

          {/* Ready Orders Column */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-green-100 p-3 border-b border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <h2 className="font-bold text-gray-900">READY FOR PICKUP</h2>
                </div>
                <Badge className="bg-green-200 text-green-800 border-green-300">
                  {ordersByStatus.ready.length}
                </Badge>
              </div>
            </div>
            <div className="p-3 overflow-y-auto h-[calc(100%-60px)]">
              {ordersByStatus.ready.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-8">
                  No orders ready
                </div>
              ) : (
                ordersByStatus.ready.map(renderOrderCard)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BarDisplayPage