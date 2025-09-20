"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export interface SettingEntry {
  id: string
  key: string
  value: string
  description?: string
}

export interface CreateSettingInput {
  key: string
  value: string
  description?: string
}

export interface UpdateSettingInput {
  value: string
  description?: string
}

// Get all settings
export async function getSettings(): Promise<SettingEntry[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check if user is admin
    const isAdmin = await prisma.userBusinessUnitRole.findFirst({
      where: {
        userId: session.user.id,
        role: {
          name: "admin"
        }
      }
    })

    if (!isAdmin) {
      throw new Error("Admin access required")
    }

    const settings = await prisma.setting.findMany({
      orderBy: {
        key: 'asc'
      }
    })

    return settings.map(setting => ({
      id: setting.id,
      key: setting.key,
      value: setting.value,
      description: setting.description ?? undefined
    }))
  } catch (error) {
    console.error("Error fetching settings:", error)
    return []
  }
}

// Get setting by key
export async function getSetting(key: string): Promise<SettingEntry | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key }
    })

    if (!setting) {
      return null
    }

    return {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      description: setting.description ?? undefined
    }
  } catch (error) {
    console.error("Error fetching setting:", error)
    return null
  }
}

// Create setting
export async function createSetting(settingData: CreateSettingInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check if user is admin
    const isAdmin = await prisma.userBusinessUnitRole.findFirst({
      where: {
        userId: session.user.id,
        role: {
          name: "admin"
        }
      }
    })

    if (!isAdmin) {
      throw new Error("Admin access required")
    }

    // Check if key already exists
    const existingSetting = await prisma.setting.findUnique({
      where: { key: settingData.key }
    })

    if (existingSetting) {
      throw new Error("Setting key already exists")
    }

    const setting = await prisma.setting.create({
      data: {
        key: settingData.key,
        value: settingData.value,
        description: settingData.description
      }
    })

    const result: SettingEntry = {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      description: setting.description ?? undefined
    }

    revalidatePath("/admin/settings")
    return { success: true, setting: result }
  } catch (error) {
    console.error("Error creating setting:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create setting"
    }
  }
}

// Update setting
export async function updateSetting(settingId: string, settingData: UpdateSettingInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check if user is admin
    const isAdmin = await prisma.userBusinessUnitRole.findFirst({
      where: {
        userId: session.user.id,
        role: {
          name: "admin"
        }
      }
    })

    if (!isAdmin) {
      throw new Error("Admin access required")
    }

    const setting = await prisma.setting.update({
      where: { id: settingId },
      data: settingData
    })

    const result: SettingEntry = {
      id: setting.id,
      key: setting.key,
      value: setting.value,
      description: setting.description ?? undefined
    }

    revalidatePath("/admin/settings")
    return { success: true, setting: result }
  } catch (error) {
    console.error("Error updating setting:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update setting"
    }
  }
}

// Delete setting
export async function deleteSetting(settingId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check if user is admin
    const isAdmin = await prisma.userBusinessUnitRole.findFirst({
      where: {
        userId: session.user.id,
        role: {
          name: "admin"
        }
      }
    })

    if (!isAdmin) {
      throw new Error("Admin access required")
    }

    await prisma.setting.delete({
      where: { id: settingId }
    })

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error) {
    console.error("Error deleting setting:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete setting"
    }
  }
}