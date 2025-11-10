import { useState, useCallback, useEffect } from "react"
import { printServiceAPI } from "@/lib/printer/print-service-api"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"
import { ItemType } from "@prisma/client"

interface UsePrinterReturn {
  isPrinting: boolean
  printError: string | null
  isPrinterConnected: boolean
  checkPrinterConnection: () => Promise<void>
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
  const [isPrinterConnected, setIsPrinterConnected] = useState(false)

  // Check printer connection on mount
  useEffect(() => {
    checkPrinterConnection()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkPrinterConnection = useCallback(async () => {
    try {
      const connected = await printServiceAPI.checkPrinterStatus()
      setIsPrinterConnected(connected)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setIsPrinterConnected(false)
    }
  }, [])

  const printOrderDetails = useCallback(
    async (
      order: OrderWithDetails,
      businessUnit: BusinessUnitDetails,
      waiterName?: string
    ): Promise<boolean> => {
      setIsPrinting(true)
      setPrintError(null)

      try {
        const success = await printServiceAPI.printOrderDetails(
          order,
          businessUnit,
          waiterName
        )
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
        const success = await printServiceAPI.printNewItems(
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
    isPrinterConnected,
    checkPrinterConnection,
    printOrderDetails,
    printNewItems,
    clearError
  }
}