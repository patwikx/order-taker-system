"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { KitchenOrderStatus, OrderStatus, OrderItemStatus, ItemType } from "@prisma/client"

export interface KitchenOrderWithDetails {
  id: string
  orderNumber: string
  tableNumber: number
  waiterName: string
  items: KitchenOrderItem[]
  status: KitchenOrderStatus
  estimatedTime?: number
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  notes?: string
}

export interface KitchenOrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
  prepTime?: number
}

// Type guard to validate KitchenOrderItem
function isKitchenOrderItem(item: unknown): item is KitchenOrderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as KitchenOrderItem).id === 'string' &&
    typeof (item as KitchenOrderItem).name === 'string' &&
    typeof (item as KitchenOrderItem).quantity === 'number'
  )
}

// Transform and validate JSON items to KitchenOrderItem[]
function transformToKitchenOrderItems(jsonItems: unknown): KitchenOrderItem[] {
  if (!Array.isArray(jsonItems)) {
    return []
  }

  return jsonItems.filter(isKitchenOrderItem)
}

// Get all pending kitchen orders
export async function getKitchenOrders(businessUnitId: string) {
  try {
    const orderNumbers = await prisma.order.findMany({
      where: { businessUnitId },
      select: { orderNumber: true }
    }).then(orders => orders.map(o => o.orderNumber))

    const kitchenOrders = await prisma.kitchenOrder.findMany({
      where: {
        orderNumber: {
          in: orderNumbers
        },
        status: {
          in: [KitchenOrderStatus.PENDING, KitchenOrderStatus.ACCEPTED, KitchenOrderStatus.PREPARING]
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return kitchenOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items: transformToKitchenOrderItems(order.items),
      status: order.status,
      estimatedTime: order.estimatedTime ?? undefined,
      startedAt: order.startedAt ?? undefined,
      completedAt: order.completedAt ?? undefined,
      createdAt: order.createdAt,
      notes: order.notes ?? undefined
    })) as KitchenOrderWithDetails[]
  } catch (error) {
    console.error("Error fetching kitchen orders:", error)
    return []
  }
}

// Update kitchen order status
export async function updateKitchenOrderStatus(
  businessUnitId: string,
  kitchenOrderId: string,
  status: KitchenOrderStatus
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get order numbers for this business unit
    const orderNumbers = await prisma.order.findMany({
      where: { businessUnitId },
      select: { orderNumber: true }
    }).then(orders => orders.map(o => o.orderNumber))

    // Verify the kitchen order exists and belongs to this business unit
    const kitchenOrder = await prisma.kitchenOrder.findFirst({
      where: {
        id: kitchenOrderId,
        orderNumber: {
          in: orderNumbers
        }
      }
    })

    if (!kitchenOrder) {
      throw new Error("Kitchen order not found")
    }

    const updateData: {
      status: KitchenOrderStatus
      startedAt?: Date
      completedAt?: Date
      updatedAt: Date
    } = {
      status,
      updatedAt: new Date()
    }

    // Set timestamps based on status
    if (status === KitchenOrderStatus.PREPARING && !kitchenOrder.startedAt) {
      updateData.startedAt = new Date()
    } else if (status === KitchenOrderStatus.READY) {
      updateData.completedAt = new Date()
    }

    // Update kitchen order
    await prisma.kitchenOrder.update({
      where: { id: kitchenOrderId },
      data: updateData
    })

    // If order is ready, update the main order items status
    if (status === KitchenOrderStatus.READY) {
      const mainOrder = await prisma.order.findFirst({
        where: { orderNumber: kitchenOrder.orderNumber },
        include: { orderItems: { include: { menuItem: true } } }
      })

      if (mainOrder) {
        // Update food items to READY status
        const foodItemIds = mainOrder.orderItems
          .filter(item => item.menuItem.type === ItemType.FOOD)
          .map(item => item.id)

        await prisma.orderItem.updateMany({
          where: { id: { in: foodItemIds } },
          data: { status: OrderItemStatus.READY }
        })

        // Check if all items are ready to update main order status
        const allItems = await prisma.orderItem.findMany({
          where: { orderId: mainOrder.id },
          include: { menuItem: true }
        })

        const allItemsReady = allItems.every(item => 
          item.status === OrderItemStatus.READY || 
          item.status === OrderItemStatus.SERVED
        )

        if (allItemsReady) {
          await prisma.order.update({
            where: { id: mainOrder.id },
            data: { status: OrderStatus.READY }
          })
        }
      }
    }

    revalidatePath(`/${businessUnitId}/kitchen`)
    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating kitchen order status:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update kitchen order status" 
    }
  }
}

// Accept kitchen order (change from PENDING to ACCEPTED)
export async function acceptKitchenOrder(businessUnitId: string, kitchenOrderId: string) {
  return updateKitchenOrderStatus(businessUnitId, kitchenOrderId, KitchenOrderStatus.ACCEPTED)
}

// Start preparing kitchen order
export async function startPreparingOrder(businessUnitId: string, kitchenOrderId: string) {
  return updateKitchenOrderStatus(businessUnitId, kitchenOrderId, KitchenOrderStatus.PREPARING)
}

// Mark kitchen order as ready
export async function markOrderReady(businessUnitId: string, kitchenOrderId: string) {
  return updateKitchenOrderStatus(businessUnitId, kitchenOrderId, KitchenOrderStatus.READY)
}