"use server"

import { prisma } from "@/lib/prisma"

export interface BusinessUnitDetails {
  id: string
  code: string
  name: string
  address?: string
  phone?: string
  email?: string
  taxRate: number
  timezone: string
  currency: string
  isActive: boolean
  settings?: Record<string, unknown>
}

// Get business unit details
export async function getBusinessUnit(businessUnitId: string): Promise<BusinessUnitDetails | null> {
  try {
    const businessUnit = await prisma.businessUnit.findFirst({
      where: {
        id: businessUnitId,
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        taxRate: true,
        timezone: true,
        currency: true,
        isActive: true,
        settings: true
      }
    })

    if (!businessUnit) {
      return null
    }

    return {
      id: businessUnit.id,
      code: businessUnit.code,
      name: businessUnit.name,
      address: businessUnit.address ?? undefined,
      phone: businessUnit.phone ?? undefined,
      email: businessUnit.email ?? undefined,
      timezone: businessUnit.timezone,
      taxRate: Number(businessUnit.taxRate),
      currency: businessUnit.currency,
      isActive: businessUnit.isActive,
      settings: (businessUnit.settings as Record<string, unknown>) ?? undefined
    }
  } catch (error) {
    console.error("Error fetching business unit:", error)
    return null
  }
}

export async function getAllBusinessUnits(): Promise<
  Array<{
    id: string
    code: string
    name: string
    isActive: boolean
  }>
> {
  try {
    const businessUnits = await prisma.businessUnit.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return businessUnits
  } catch (error) {
    console.error("Error fetching all business units:", error)
    return []
  }
}