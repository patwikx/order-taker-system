"use server"

import { prisma } from "@/lib/prisma"

export interface BusinessUnitDetails {
  id: string
  code: string
  name: string
  address?: string
  phone?: string
  email?: string
  timezone: string
  currency: string
  taxRate: number
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
        timezone: true,
        currency: true,
        taxRate: true,
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
      currency: businessUnit.currency,
      taxRate: Number(businessUnit.taxRate),
      isActive: businessUnit.isActive,
      settings: (businessUnit.settings as Record<string, unknown>) ?? undefined
    }
  } catch (error) {
    console.error("Error fetching business unit:", error)
    return null
  }
}