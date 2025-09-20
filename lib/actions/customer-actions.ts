"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { CustomerType } from "@prisma/client"

export interface CustomerWithDetails {
  id: string
  businessUnitId: string
  customerNumber: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  type: CustomerType
  preferences?: Record<string, string | number | boolean | null>
  allergies?: string
  notes?: string
  isActive: boolean
  totalOrders: number
  totalSpent: number
  lastVisit?: Date
  firstVisit: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateCustomerInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  type?: CustomerType
  preferences?: Record<string, string | number | boolean | null>
  allergies?: string
  notes?: string
}

export interface UpdateCustomerInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  type?: CustomerType
  preferences?: Record<string, string | number | boolean | null>
  allergies?: string
  notes?: string
  isActive?: boolean
}

// Generate customer number
async function generateCustomerNumber(businessUnitId: string): Promise<string> {
  const businessUnit = await prisma.businessUnit.findUnique({
    where: { id: businessUnitId },
    select: { code: true }
  })
  
  if (!businessUnit) {
    throw new Error("Business unit not found")
  }

  const lastCustomer = await prisma.customer.findFirst({
    where: {
      businessUnitId,
      customerNumber: {
        startsWith: `${businessUnit.code}-CUST-`
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  let nextNumber = 1
  
  if (lastCustomer) {
    const parts = lastCustomer.customerNumber.split('-')
    if (parts.length === 3 && parts[2].match(/^\d+$/)) {
      const lastNumber = parseInt(parts[2])
      nextNumber = lastNumber + 1
    }
  }

  return `${businessUnit.code}-CUST-${nextNumber.toString().padStart(3, '0')}`
}

// Get all customers for a business unit
export async function getCustomers(businessUnitId: string): Promise<CustomerWithDetails[]> {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        businessUnitId,
        isActive: true
      },
      orderBy: [
        { type: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return customers.map(customer => ({
      id: customer.id,
      businessUnitId: customer.businessUnitId,
      customerNumber: customer.customerNumber,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      type: customer.type,
      preferences: (customer.preferences as Record<string, string | number | boolean | null>) ?? undefined,
      allergies: customer.allergies ?? undefined,
      notes: customer.notes ?? undefined,
      isActive: customer.isActive,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      lastVisit: customer.lastVisit ?? undefined,
      firstVisit: customer.firstVisit,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))
  } catch (error) {
    console.error("Error fetching customers:", error)
    return []
  }
}

// Get all customers including inactive ones (for admin)
export async function getAllCustomers(businessUnitId: string): Promise<CustomerWithDetails[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const customers = await prisma.customer.findMany({
      where: {
        businessUnitId,
        businessUnit: {
          userBusinessUnitRole: {
            some: {
              userId: session.user.id,
              role: {
                name: { in: ["admin", "manager"] }
              }
            }
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { type: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return customers.map(customer => ({
      id: customer.id,
      businessUnitId: customer.businessUnitId,
      customerNumber: customer.customerNumber,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      type: customer.type,
      preferences: (customer.preferences as Record<string, string | number | boolean | null>) ?? undefined,
      allergies: customer.allergies ?? undefined,
      notes: customer.notes ?? undefined,
      isActive: customer.isActive,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      lastVisit: customer.lastVisit ?? undefined,
      firstVisit: customer.firstVisit,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))
  } catch (error) {
    console.error("Error fetching all customers:", error)
    return []
  }
}

// Create customer
export async function createCustomer(businessUnitId: string, customerData: CreateCustomerInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate business unit access
    const businessUnit = await prisma.businessUnit.findFirst({
      where: {
        id: businessUnitId,
        isActive: true,
        userBusinessUnitRole: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!businessUnit) {
      throw new Error("Business unit not found or access denied")
    }

    // Check for duplicate email or phone
    if (customerData.email || customerData.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          businessUnitId,
          OR: [
            ...(customerData.email ? [{ email: customerData.email }] : []),
            ...(customerData.phone ? [{ phone: customerData.phone }] : [])
          ]
        }
      })

      if (existingCustomer) {
        throw new Error("Customer with this email or phone already exists")
      }
    }

    const customerNumber = await generateCustomerNumber(businessUnitId)

    const customer = await prisma.customer.create({
      data: {
        businessUnitId,
        customerNumber,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        type: customerData.type || CustomerType.WALK_IN,
        preferences: customerData.preferences,
        allergies: customerData.allergies,
        notes: customerData.notes,
        isActive: true
      }
    })

    const result: CustomerWithDetails = {
      id: customer.id,
      businessUnitId: customer.businessUnitId,
      customerNumber: customer.customerNumber,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      type: customer.type,
      preferences: (customer.preferences as Record<string, string | number | boolean | null>) ?? undefined,
      allergies: customer.allergies ?? undefined,
      notes: customer.notes ?? undefined,
      isActive: customer.isActive,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      lastVisit: customer.lastVisit ?? undefined,
      firstVisit: customer.firstVisit,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }

    revalidatePath(`/${businessUnitId}`)
    return { success: true, customer: result }
  } catch (error) {
    console.error("Error creating customer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create customer"
    }
  }
}

// Update customer
export async function updateCustomer(
  businessUnitId: string,
  customerId: string,
  customerData: UpdateCustomerInput
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate customer exists and belongs to business unit
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessUnitId,
        businessUnit: {
          userBusinessUnitRole: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!existingCustomer) {
      throw new Error("Customer not found or access denied")
    }

    // Check for duplicate email or phone
    if (customerData.email || customerData.phone) {
      const conflictingCustomer = await prisma.customer.findFirst({
        where: {
          businessUnitId,
          id: { not: customerId },
          OR: [
            ...(customerData.email ? [{ email: customerData.email }] : []),
            ...(customerData.phone ? [{ phone: customerData.phone }] : [])
          ]
        }
      })

      if (conflictingCustomer) {
        throw new Error("Another customer with this email or phone already exists")
      }
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: customerData
    })

    const result: CustomerWithDetails = {
      id: customer.id,
      businessUnitId: customer.businessUnitId,
      customerNumber: customer.customerNumber,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      type: customer.type,
      preferences: (customer.preferences as Record<string, string | number | boolean | null>) ?? undefined,
      allergies: customer.allergies ?? undefined,
      notes: customer.notes ?? undefined,
      isActive: customer.isActive,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      lastVisit: customer.lastVisit ?? undefined,
      firstVisit: customer.firstVisit,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }

    revalidatePath(`/${businessUnitId}`)
    return { success: true, customer: result }
  } catch (error) {
    console.error("Error updating customer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update customer"
    }
  }
}

// Delete customer (soft delete)
export async function deleteCustomer(businessUnitId: string, customerId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check if customer has active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        customerId,
        status: {
          in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "READY", "SERVED"]
        }
      }
    })

    if (activeOrders) {
      throw new Error("Cannot delete customer with active orders")
    }

    // Soft delete
    await prisma.customer.update({
      where: { id: customerId },
      data: { isActive: false }
    })

    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting customer:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete customer"
    }
  }
}

// Search customers
export async function searchCustomers(
  businessUnitId: string,
  query: string,
  type?: CustomerType
): Promise<CustomerWithDetails[]> {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        businessUnitId,
        isActive: true,
        ...(type && { type }),
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { customerNumber: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { type: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      take: 20
    })

    return customers.map(customer => ({
      id: customer.id,
      businessUnitId: customer.businessUnitId,
      customerNumber: customer.customerNumber,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      type: customer.type,
      preferences: (customer.preferences as Record<string, string | number | boolean | null>) ?? undefined,
      allergies: customer.allergies ?? undefined,
      notes: customer.notes ?? undefined,
      isActive: customer.isActive,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      lastVisit: customer.lastVisit ?? undefined,
      firstVisit: customer.firstVisit,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }))
  } catch (error) {
    console.error("Error searching customers:", error)
    return []
  }
}

// Get customer by ID
export async function getCustomer(businessUnitId: string, customerId: string): Promise<CustomerWithDetails | null> {
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessUnitId
      }
    })

    if (!customer) {
      return null
    }

    return {
      id: customer.id,
      businessUnitId: customer.businessUnitId,
      customerNumber: customer.customerNumber,
      firstName: customer.firstName ?? undefined,
      lastName: customer.lastName ?? undefined,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
      type: customer.type,
      preferences: (customer.preferences as Record<string, string | number | boolean | null>) ?? undefined,
      allergies: customer.allergies ?? undefined,
      notes: customer.notes ?? undefined,
      isActive: customer.isActive,
      totalOrders: customer.totalOrders,
      totalSpent: Number(customer.totalSpent),
      lastVisit: customer.lastVisit ?? undefined,
      firstVisit: customer.firstVisit,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    }
  } catch (error) {
    console.error("Error fetching customer:", error)
    return null
  }
}

// Update customer stats after order
export async function updateCustomerStats(customerId: string, orderAmount: number) {
  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: { increment: 1 },
        totalSpent: { increment: orderAmount },
        lastVisit: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating customer stats:", error)
    return { success: false }
  }
}