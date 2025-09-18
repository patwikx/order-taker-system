"use server"

import { prisma } from "@/lib/prisma"
import { ItemType } from "@prisma/client"

export interface MenuItemWithCategory {
  id: string
  name: string
  description?: string
  price: number
  categoryId: string
  type: ItemType
  prepTime?: number
  isAvailable: boolean
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
  category: {
    id: string
    name: string
    description?: string
    sortOrder: number
  }
}

export interface CategoryWithItems {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
  menuItems: MenuItemWithCategory[]
}

// Helper function to convert Decimal to number
function convertDecimalToNumber<T extends { price: unknown }>(item: T): Omit<T, 'price'> & { price: number } {
  return {
    ...item,
    price: Number(item.price)
  }
}

// Get all categories for a business unit
export async function getCategories(businessUnitId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        businessUnitId,
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      },
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true
      }
    })

    // Convert null to undefined for description field
    return categories.map(category => ({
      ...category,
      description: category.description ?? undefined
    }))
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

// Get all menu items for a business unit
export async function getMenuItems(businessUnitId: string) {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        businessUnitId,
        isAvailable: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true
          }
        }
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' }
      ]
    })

    // Convert Decimal to number
    return menuItems.map(convertDecimalToNumber) as MenuItemWithCategory[]
  } catch (error) {
    console.error("Error fetching menu items:", error)
    return []
  }
}

// Get menu items by category
export async function getMenuItemsByCategory(businessUnitId: string, categoryId: string) {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: {
        businessUnitId,
        categoryId,
        isAvailable: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Convert Decimal to number
    return menuItems.map(convertDecimalToNumber) as MenuItemWithCategory[]
  } catch (error) {
    console.error("Error fetching menu items by category:", error)
    return []
  }
}

// Get categories with their menu items
export async function getCategoriesWithItems(businessUnitId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        businessUnitId,
        isActive: true
      },
      include: {
        menuItems: {
          where: {
            isAvailable: true
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                sortOrder: true
              }
            }
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    // Convert Decimal to number for nested menuItems
    const categoriesWithConvertedPrices = categories.map(category => ({
      ...category,
      menuItems: category.menuItems.map(convertDecimalToNumber)
    }))

    return categoriesWithConvertedPrices as CategoryWithItems[]
  } catch (error) {
    console.error("Error fetching categories with items:", error)
    return []
  }
}