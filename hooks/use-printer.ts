import { useState, useCallback } from "react"
import { epsonPrinter } from "@/lib/printer/epson-pos-printer"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"
import { ItemType } from "@prisma/client"

interface UsePrinterReturn {
  isPrinting: boolean
  printError: string | null
  printOrderDetails: (
    order: OrderWithDetails,
    businessUnit: BusinessUnitDetails,
    waiterName?: string
  ) => Promise<boolean>
  printNewItems: (
    orderNumber: string,
    tableNumber: number,
    newItems: Array<{ name: string; quantity: number; notes?: string; type: ItemType }>,
    businessUnit: BusinessUnitDetails,
    waiterName?: string,
    customerCount?: number
  ) => Promise<boolean>
  clearError: () => void
}

export function usePrinter(): UsePrinterReturn {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)

  const printOrderDetails = useCallback(
    async (
      order: OrderWithDetails,
      businessUnit: BusinessUnitDetails,
      waiterName?: string
    ): Promise<boolean> => {
      setIsPrinting(true)
      setPrintError(null)

      try {
        const success = await epsonPrinter.printOrderDetails(order, businessUnit, waiterName)
        return success
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to print order"
        setPrintError(errorMessage)
        console.error("Print error:", error)
        return false
      } finally {
        setIsPrinting(false)
      }
    },
    []
  )

  const printNewItems = useCallback(
    async (
      orderNumber: string,
      tableNumber: number,
      newItems: Array<{ name: string; quantity: number; notes?: string; type: ItemType }>,
      businessUnit: BusinessUnitDetails,
      waiterName?: string,
      customerCount?: number
    ): Promise<boolean> => {
      setIsPrinting(true)
      setPrintError(null)

      try {
        const success = await epsonPrinter.printNewItems(
          orderNumber,
          tableNumber,
          newItems,
          businessUnit,
          waiterName,
          customerCount
        )
        return success
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to print items"
        setPrintError(errorMessage)
        console.error("Print error:", error)
        return false
      } finally {
        setIsPrinting(false)
      }
    },
    []
  )

  const clearError = useCallback(() => {
    setPrintError(null)
  }, [])

  return {
    isPrinting,
    printError,
    printOrderDetails,
    printNewItems,
    clearError
  }
}
