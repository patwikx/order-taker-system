"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { updateTableStatus } from "./table-actions"
import { 
  OrderStatus, 
  OrderItemStatus, 
  ItemType,
  KitchenOrderStatus,
  BarOrderStatus,
  OrderPriority, 
  TableStatus,
} from "@prisma/client"

// Types for our actions
export interface CreateOrderItemInput {
  menuItemId: string
  quantity: number
  notes?: string
}

export interface CreateOrderInput {
  tableId: string
  customerId?: string
  isWalkIn: boolean
  walkInName?: string
  customerCount?: number
  notes?: string
  items: CreateOrderItemInput[]
}

export interface OrderWithDetails {
  id: string
  orderNumber: string
  tableId: string
  waiterId: string
  customerId?: string
  status: OrderStatus
  totalAmount: number
  discountAmount: number
  finalAmount: number
  notes?: string
  customerCount?: number
  isWalkIn: boolean
  walkInName?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  businessUnitId: string
  table: {
    id: string
    number: number
    capacity: number
    location?: string
  }
  customer?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    status: OrderItemStatus
    notes?: string
    menuItem: {
      id: string
      name: string
      description?: string
      price: number
      type: ItemType
      prepTime?: number
      imageUrl?: string
    }
  }>
}

// Helper functions to convert Decimal to number and handle null/undefined
function convertDecimalToNumber<T extends { price: unknown }>(item: T): Omit<T, 'price'> & { price: number } {
  return {
    ...item,
    price: Number(item.price)
  }
}

function convertOrderItemDecimal<T extends { unitPrice: unknown; totalPrice: unknown }>(item: T): Omit<T, 'unitPrice' | 'totalPrice'> & { unitPrice: number; totalPrice: number } {
  return {
    ...item,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice)
  }
}

function convertOrderDecimals<T extends { totalAmount: unknown; discountAmount: unknown; finalAmount: unknown }>(order: T): Omit<T, 'totalAmount' | 'discountAmount' | 'finalAmount'> & { totalAmount: number; discountAmount: number; finalAmount: number } {
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    discountAmount: Number(order.discountAmount),
    finalAmount: Number(order.finalAmount)
  }
}

// Generate simple incrementing order number with business unit code starting from 10001
async function generateOrderNumber(businessUnitId: string): Promise<string> {
  // Get business unit code for prefix
  const businessUnit = await prisma.businessUnit.findUnique({
    where: { id: businessUnitId },
    select: { code: true }
  })
  
  if (!businessUnit) {
    throw new Error("Business unit not found")
  }

  // Use transaction to safely get next sequence number
  const orderNumber = await prisma.$transaction(async (tx) => {
    const lastOrder = await tx.order.findFirst({
      where: {
        businessUnitId,
        // Look for orders with the same business unit prefix
        orderNumber: {
          startsWith: `${businessUnit.code}-`
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let nextNumber = 10001 // Starting number
    
    if (lastOrder) {
      // Extract number from order number like "REST001-10001"
      const parts = lastOrder.orderNumber.split('-')
      if (parts.length === 2 && parts[1].match(/^\d+$/)) {
        const lastNumber = parseInt(parts[1])
        nextNumber = lastNumber + 1
      }
    }

    return `${businessUnit.code}-${nextNumber.toString()}`
  })

  return orderNumber
}

// Create order (draft or confirmed)
export async function createOrder(
  businessUnitId: string,
  orderData: CreateOrderInput,
  isDraft: boolean = false
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate table exists and belongs to business unit
    const table = await prisma.table.findFirst({
      where: {
        id: orderData.tableId,
        businessUnitId,
        isActive: true
      }
    })

    if (!table) {
      throw new Error("Table not found")
    }

    // Validate menu items belong to business unit
    const menuItemIds = orderData.items.map(item => item.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        businessUnitId,
        isAvailable: true
      }
    })

    if (menuItems.length !== menuItemIds.length) {
      throw new Error("Some menu items are not available")
    }

    // Calculate totals
    let totalAmount = 0
    const orderItemsData = orderData.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
      const itemTotal = Number(menuItem.price) * item.quantity
      totalAmount += itemTotal

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        status: isDraft ? OrderItemStatus.PENDING : OrderItemStatus.CONFIRMED,
        notes: item.notes
      }
    })

    // Generate unique order number with retry for race conditions
    let retries = 3
    let order
    
    while (retries > 0) {
      try {
        const orderNumber = await generateOrderNumber(businessUnitId)

        // Create order with items
        order = await prisma.order.create({
          data: {
            orderNumber,
            tableId: orderData.tableId,
            waiterId: session.user.id,
            customerId: orderData.customerId,
            businessUnitId,
            status: isDraft ? OrderStatus.PENDING : OrderStatus.CONFIRMED,
            totalAmount,
            discountAmount: 0,
            finalAmount: totalAmount,
            notes: orderData.notes,
            customerCount: orderData.customerCount,
            isWalkIn: orderData.isWalkIn,
            walkInName: orderData.walkInName,
            orderItems: {
              create: orderItemsData
            }
          },
          include: {
            table: {
              select: {
                id: true,
                number: true,
                capacity: true,
                location: true
              }
            },
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            orderItems: {
              include: {
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    type: true,
                    prepTime: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        })
        
        break // Success, exit the retry loop
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'P2002' && error.message.includes('orderNumber')) {
          retries--
          if (retries === 0) {
            throw new Error("Failed to generate unique order number after multiple attempts")
          }
          // Wait a small random amount before retrying to reduce collision probability
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
        } else {
          throw error
        }
      }
    }

    if (!order) {
      throw new Error("Failed to create order")
    }

    // If not draft, send to kitchen/bar
    if (!isDraft) {
      await sendOrderToKitchenAndBar(order.id, businessUnitId)
      
      // Update table status to OCCUPIED
      await updateTableStatus(businessUnitId, orderData.tableId, TableStatus.OCCUPIED)
    }

    // Convert Decimal fields before returning
    const convertedOrder = convertOrderDecimals(order)
    const finalOrder = {
      ...convertedOrder,
      table: {
        ...order.table,
        location: order.table.location ?? undefined
      },
      customer: order.customer ? {
        ...order.customer,
        firstName: order.customer.firstName ?? undefined,
        lastName: order.customer.lastName ?? undefined,
        email: order.customer.email ?? undefined,
        phone: order.customer.phone ?? undefined
      } : undefined,
      orderItems: order.orderItems?.map(item => {
        const convertedItem = convertOrderItemDecimal(item)
        return {
          ...convertedItem,
          notes: convertedItem.notes ?? undefined,
          menuItem: {
            ...convertDecimalToNumber(item.menuItem),
            description: item.menuItem.description ?? undefined,
            prepTime: item.menuItem.prepTime ?? undefined,
            imageUrl: item.menuItem.imageUrl ?? undefined
          }
        }
      }) ?? []
    }

    revalidatePath(`/${businessUnitId}`)
    return { success: true, order: finalOrder }
  } catch (error) {
    console.error("Error creating order:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create order" 
    }
  }
}

// Send order to kitchen and bar
export async function sendOrderToKitchenAndBar(orderId: string, businessUnitId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessUnitId
      },
      include: {
        table: true,
        waiter: true,
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!order) {
      throw new Error("Order not found")
    }

    // Separate food and drink items
    const foodItems = order.orderItems.filter(item => item.menuItem.type === ItemType.FOOD)
    const drinkItems = order.orderItems.filter(item => item.menuItem.type === ItemType.DRINK)

    // Create kitchen order for food items
    if (foodItems.length > 0) {
      const kitchenItems = foodItems.map(item => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        notes: item.notes,
        prepTime: item.menuItem.prepTime
      }))

      await prisma.kitchenOrder.create({
        data: {
          orderNumber: order.orderNumber,
          tableNumber: order.table.number,
          waiterName: order.waiter.name,
          items: kitchenItems,
          status: KitchenOrderStatus.PENDING,
          priority: OrderPriority.NORMAL,
          estimatedTime: Math.max(...foodItems.map(item => item.menuItem.prepTime || 15)),
          notes: order.notes
        }
      })
    }

    // Create bar order for drink items
    if (drinkItems.length > 0) {
      const barItems = drinkItems.map(item => ({
        id: item.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        notes: item.notes,
        prepTime: item.menuItem.prepTime
      }))

      await prisma.barOrder.create({
        data: {
          orderNumber: order.orderNumber,
          tableNumber: order.table.number,
          waiterName: order.waiter.name,
          items: barItems,
          status: BarOrderStatus.PENDING,
          priority: OrderPriority.NORMAL,
          estimatedTime: Math.max(...drinkItems.map(item => item.menuItem.prepTime || 5)),
          notes: order.notes
        }
      })
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: OrderStatus.CONFIRMED,
        updatedAt: new Date()
      }
    })

    // Update table status to OCCUPIED using the existing order data
    await updateTableStatus(businessUnitId, order.tableId, TableStatus.OCCUPIED)

    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error sending order to kitchen/bar:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send order" 
    }
  }
}

// Update order (for drafts)
export async function updateOrder(
  businessUnitId: string,
  orderId: string,
  orderData: CreateOrderInput
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate order exists and is a draft
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessUnitId,
        waiterId: session.user.id,
        status: OrderStatus.PENDING
      }
    })

    if (!existingOrder) {
      throw new Error("Order not found or cannot be modified")
    }

    // Validate menu items
    const menuItemIds = orderData.items.map(item => item.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        businessUnitId,
        isAvailable: true
      }
    })

    if (menuItems.length !== menuItemIds.length) {
      throw new Error("Some menu items are not available")
    }

    // Calculate new totals
    let totalAmount = 0
    const orderItemsData = orderData.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
      const itemTotal = Number(menuItem.price) * item.quantity
      totalAmount += itemTotal

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal,
        status: OrderItemStatus.PENDING,
        notes: item.notes
      }
    })

    // Update order
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Delete existing order items
      await tx.orderItem.deleteMany({
        where: { orderId }
      })

      // Update order and create new items
      return await tx.order.update({
        where: { id: orderId },
        data: {
          customerId: orderData.customerId,
          totalAmount,
          finalAmount: totalAmount,
          notes: orderData.notes,
          customerCount: orderData.customerCount,
          isWalkIn: orderData.isWalkIn,
          walkInName: orderData.walkInName,
          orderItems: {
            create: orderItemsData
          }
        },
        include: {
          table: {
            select: {
              id: true,
              number: true,
              capacity: true,
              location: true
            }
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          orderItems: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                  type: true,
                  prepTime: true,
                  imageUrl: true
                }
              }
            }
          }
        }
      })
    })

    // Convert Decimal fields before returning
    const convertedOrder = convertOrderDecimals(updatedOrder)
    const finalOrder = {
      ...convertedOrder,
      table: {
        ...updatedOrder.table,
        location: updatedOrder.table.location ?? undefined
      },
      customer: updatedOrder.customer ? {
        ...updatedOrder.customer,
        firstName: updatedOrder.customer.firstName ?? undefined,
        lastName: updatedOrder.customer.lastName ?? undefined,
        email: updatedOrder.customer.email ?? undefined,
        phone: updatedOrder.customer.phone ?? undefined
      } : undefined,
      orderItems: updatedOrder.orderItems?.map(item => {
        const convertedItem = convertOrderItemDecimal(item)
        return {
          ...convertedItem,
          notes: convertedItem.notes ?? undefined,
          menuItem: {
            ...convertDecimalToNumber(item.menuItem),
            description: item.menuItem.description ?? undefined,
            prepTime: item.menuItem.prepTime ?? undefined,
            imageUrl: item.menuItem.imageUrl ?? undefined
          }
        }
      }) ?? []
    }

    revalidatePath(`/${businessUnitId}`)
    return { success: true, order: finalOrder }
  } catch (error) {
    console.error("Error updating order:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update order" 
    }
  }
}

// Get order by ID
export async function getOrder(businessUnitId: string, orderId: string): Promise<OrderWithDetails | null> {
  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessUnitId
      },
      include: {
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
            location: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                type: true,
                prepTime: true,
                imageUrl: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return null
    }

    // Convert Decimal fields before returning
    const convertedOrder = convertOrderDecimals(order)
    const finalOrder = {
      ...convertedOrder,
      table: {
        ...order.table,
        location: order.table.location ?? undefined
      },
      customer: order.customer ? {
        ...order.customer,
        firstName: order.customer.firstName ?? undefined,
        lastName: order.customer.lastName ?? undefined,
        email: order.customer.email ?? undefined,
        phone: order.customer.phone ?? undefined
      } : undefined,
      orderItems: order.orderItems?.map(item => {
        const convertedItem = convertOrderItemDecimal(item)
        return {
          ...convertedItem,
          notes: convertedItem.notes ?? undefined,
          menuItem: {
            ...convertDecimalToNumber(item.menuItem),
            description: item.menuItem.description ?? undefined,
            prepTime: item.menuItem.prepTime ?? undefined,
            imageUrl: item.menuItem.imageUrl ?? undefined
          }
        }
      }) ?? []
    }
    
    return finalOrder as OrderWithDetails
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

// Cancel order
export async function cancelOrder(businessUnitId: string, orderId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        businessUnitId,
        status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] }
      }
    })

    if (!order) {
      throw new Error("Order not found or cannot be cancelled")
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        updatedAt: new Date()
      }
    })

    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error cancelling order:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to cancel order" 
    }
  }
}