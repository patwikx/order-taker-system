"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import type { ItemType } from "@prisma/client"

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

export interface CreateCategoryInput {
  name: string
  description?: string
  sortOrder?: number
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}

export interface CreateMenuItemInput {
  name: string
  description?: string
  price: number
  categoryId: string
  type: ItemType
  prepTime?: number
  imageUrl?: string
}

export interface UpdateMenuItemInput {
  name?: string
  description?: string
  price?: number
  categoryId?: string
  type?: ItemType
  prepTime?: number
  isAvailable?: boolean
  imageUrl?: string
}

// Helper function to convert Decimal to number
function convertDecimalToNumber<T extends { price: unknown }>(item: T): Omit<T, "price"> & { price: number } {
  return {
    ...item,
    price: Number(item.price),
  }
}

// Get all categories for a business unit
export async function getCategories(businessUnitId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        businessUnitId,
        isActive: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
      },
    })

    // Convert null to undefined for description field
    return categories.map((category) => ({
      ...category,
      description: category.description ?? undefined,
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
        isAvailable: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
          },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
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
        isAvailable: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
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
        isActive: true,
      },
      include: {
        menuItems: {
          where: {
            isAvailable: true,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                description: true,
                sortOrder: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    })

    // Convert Decimal to number for nested menuItems
    const categoriesWithConvertedPrices = categories.map((category) => ({
      ...category,
      menuItems: category.menuItems.map(convertDecimalToNumber),
    }))

    return categoriesWithConvertedPrices as CategoryWithItems[]
  } catch (error) {
    console.error("Error fetching categories with items:", error)
    return []
  }
}

// Create a new category
export async function createCategory(businessUnitId: string, categoryData: CreateCategoryInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate business unit exists and user has access
    const businessUnit = await prisma.businessUnit.findFirst({
      where: {
        id: businessUnitId,
        isActive: true,
        users: {
          some: {
            userId: session.user.id,
            isActive: true,
          },
        },
      },
    })

    if (!businessUnit) {
      throw new Error("Business unit not found or access denied")
    }

    // Get next sort order if not provided
    let sortOrder = categoryData.sortOrder
    if (sortOrder === undefined) {
      const lastCategory = await prisma.category.findFirst({
        where: { businessUnitId },
        orderBy: { sortOrder: "desc" },
      })
      sortOrder = (lastCategory?.sortOrder || 0) + 1
    }

    const category = await prisma.category.create({
      data: {
        businessUnitId,
        name: categoryData.name,
        description: categoryData.description,
        sortOrder,
        isActive: true,
      },
    })

    revalidatePath(`/${businessUnitId}`)
    return {
      success: true,
      category: {
        ...category,
        description: category.description ?? undefined,
      },
    }
  } catch (error) {
    console.error("Error creating category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    }
  }
}

// Update a category
export async function updateCategory(businessUnitId: string, categoryId: string, categoryData: UpdateCategoryInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate category exists and belongs to business unit
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
    })

    if (!existingCategory) {
      throw new Error("Category not found or access denied")
    }

    // Remove updatedAt from the data - Prisma handles this automatically
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: categoryData, // Don't manually set updatedAt
    })

    revalidatePath(`/${businessUnitId}`)
    return {
      success: true,
      category: {
        ...category,
        description: category.description ?? undefined,
      },
    }
  } catch (error) {
    console.error("Error updating category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category",
    }
  }
}

// Delete a category (soft delete by setting isActive to false)
export async function deleteCategory(businessUnitId: string, categoryId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check if category has menu items
    const categoryWithItems = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
      include: {
        menuItems: {
          where: { isAvailable: true },
        },
      },
    })

    if (!categoryWithItems) {
      throw new Error("Category not found or access denied")
    }

    if (categoryWithItems.menuItems.length > 0) {
      throw new Error("Cannot delete category with active menu items. Please move or delete the menu items first.")
    }

    // Soft delete the category - don't manually set updatedAt
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        isActive: false,
      },
    })

    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    }
  }
}

// Create a new menu item
export async function createMenuItem(businessUnitId: string, menuItemData: CreateMenuItemInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate category exists and belongs to business unit
    const category = await prisma.category.findFirst({
      where: {
        id: menuItemData.categoryId,
        businessUnitId,
        isActive: true,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
    })

    if (!category) {
      throw new Error("Category not found or access denied")
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        businessUnitId,
        name: menuItemData.name,
        description: menuItemData.description,
        price: menuItemData.price,
        categoryId: menuItemData.categoryId,
        type: menuItemData.type,
        prepTime: menuItemData.prepTime,
        imageUrl: menuItemData.imageUrl,
        isAvailable: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
          },
        },
      },
    })

    const convertedMenuItem = convertDecimalToNumber(menuItem)
    const finalMenuItem = {
      ...convertedMenuItem,
      description: convertedMenuItem.description ?? undefined,
      prepTime: convertedMenuItem.prepTime ?? undefined,
      imageUrl: convertedMenuItem.imageUrl ?? undefined,
      category: {
        ...menuItem.category,
        description: menuItem.category.description ?? undefined,
      },
    }

    revalidatePath(`/${businessUnitId}`)
    return { success: true, menuItem: finalMenuItem }
  } catch (error) {
    console.error("Error creating menu item:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create menu item",
    }
  }
}

// Update a menu item
export async function updateMenuItem(businessUnitId: string, menuItemId: string, menuItemData: UpdateMenuItemInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate menu item exists and belongs to business unit
    const existingMenuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
    })

    if (!existingMenuItem) {
      throw new Error("Menu item not found or access denied")
    }

    // If categoryId is being updated, validate the new category
    if (menuItemData.categoryId && menuItemData.categoryId !== existingMenuItem.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: menuItemData.categoryId,
          businessUnitId,
          isActive: true,
        },
      })

      if (!category) {
        throw new Error("Target category not found")
      }
    }

    // Remove updatedAt from the data - Prisma handles this automatically
    const menuItem = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: menuItemData, // Don't manually set updatedAt
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
          },
        },
      },
    })

    const convertedMenuItem = convertDecimalToNumber(menuItem)
    const finalMenuItem = {
      ...convertedMenuItem,
      description: convertedMenuItem.description ?? undefined,
      prepTime: convertedMenuItem.prepTime ?? undefined,
      imageUrl: convertedMenuItem.imageUrl ?? undefined,
      category: {
        ...menuItem.category,
        description: menuItem.category.description ?? undefined,
      },
    }

    revalidatePath(`/${businessUnitId}`)
    return { success: true, menuItem: finalMenuItem }
  } catch (error) {
    console.error("Error updating menu item:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update menu item",
    }
  }
}

// Delete a menu item (soft delete by setting isAvailable to false)
export async function deleteMenuItem(businessUnitId: string, menuItemId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate menu item exists and belongs to business unit
    const existingMenuItem = await prisma.menuItem.findFirst({
      where: {
        id: menuItemId,
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
    })

    if (!existingMenuItem) {
      throw new Error("Menu item not found or access denied")
    }

    // Check if menu item is in any active orders
    const activeOrderItems = await prisma.orderItem.findFirst({
      where: {
        menuItemId,
        order: {
          status: {
            in: ["PENDING", "CONFIRMED", "IN_PROGRESS", "READY", "SERVED"],
          },
        },
      },
    })

    if (activeOrderItems) {
      throw new Error(
        "Cannot delete menu item that is in active orders. Please wait for orders to complete or mark item as unavailable instead.",
      )
    }

    // Soft delete the menu item - don't manually set updatedAt
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        isAvailable: false,
      },
    })

    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu item:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete menu item",
    }
  }
}

// Interface for admin category data with additional metadata
export interface AdminCategoryData {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
  itemCount: number
}

// Get all categories including inactive ones (for admin)
export async function getAllCategories(businessUnitId: string): Promise<AdminCategoryData[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const categories = await prisma.category.findMany({
      where: {
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        sortOrder: true,
        isActive: true,
        _count: {
          select: {
            menuItems: {
              where: { isAvailable: true },
            },
          },
        },
      },
    })

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description ?? undefined,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      itemCount: category._count.menuItems,
    }))
  } catch (error) {
    console.error("Error fetching all categories:", error)
    return []
  }
}

// Get all menu items including unavailable ones (for admin)
export async function getAllMenuItems(businessUnitId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            sortOrder: true,
          },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    })

    return menuItems.map((item) => {
      const convertedItem = convertDecimalToNumber(item)
      return {
        ...convertedItem,
        description: convertedItem.description ?? undefined,
        prepTime: convertedItem.prepTime ?? undefined,
        imageUrl: convertedItem.imageUrl ?? undefined,
        category: {
          ...item.category,
          description: item.category.description ?? undefined,
        },
      }
    }) as MenuItemWithCategory[]
  } catch (error) {
    console.error("Error fetching all menu items:", error)
    return []
  }
}