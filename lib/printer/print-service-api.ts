import { ItemType } from "@prisma/client"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"
import { browserPrinter } from "./browser-printer"

interface PrintServiceRequest {
  orderNumber: string
  tableNumber: number
  waiterName?: string
  items: Array<{
    name: string
    quantity: number
    notes?: string
    type: 'FOOD' | 'DRINK'
  }>
  customerCount?: number
  orderNotes?: string
  businessUnitName: string
}

const PRINT_SERVICE_URL = process.env.NEXT_PUBLIC_PRINT_SERVICE_URL || 'http://localhost:3001'

export class PrintServiceAPI {
  private useBrowserPrint = false

  async checkPrinterStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${PRINT_SERVICE_URL}/api/printer-status`, {
        method: 'GET',
      })
      const data = await response.json()
      
      // Check if we should use browser print
      this.useBrowserPrint = data.useBrowserPrint === true || data.usingUSB === false
      
      console.log('Printer status:', data)
      console.log('Using browser print:', this.useBrowserPrint)
      
      return data.connected === true || this.useBrowserPrint
    } catch (error) {
      console.error('Failed to check printer status, defaulting to browser print:', error)
      this.useBrowserPrint = true
      return true
    }
  }

  async printReceipt(request: PrintServiceRequest): Promise<boolean> {
    // If browser print is enabled, use it directly
    if (this.useBrowserPrint) {
      console.log('Using browser printing (kiosk mode)')
      return true // Return true, actual printing happens in printOrderDetails
    }

    try {
      const response = await fetch(`${PRINT_SERVICE_URL}/api/print-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        
        // If server says to use browser print, enable it
        if (error.useBrowserPrint) {
          console.log('Server instructed to use browser print')
          this.useBrowserPrint = true
          return true
        }
        
        throw new Error(error.error || 'Print failed')
      }

      const result = await response.json()
      
      // Check if response indicates browser print should be used
      if (result.useBrowserPrint) {
        console.log('Server instructed to use browser print')
        this.useBrowserPrint = true
        return true
      }
      
      return result.success === true
    } catch (error) {
      console.error('Failed to print via server, falling back to browser print:', error)
      this.useBrowserPrint = true
      return true
    }
  }

  async printOrderDetails(
    order: OrderWithDetails,
    businessUnit: BusinessUnitDetails,
    waiterName?: string
  ): Promise<boolean> {
    const request: PrintServiceRequest = {
      orderNumber: order.orderNumber,
      tableNumber: order.table.number,
      waiterName,
      items: order.orderItems.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        notes: item.notes,
        type: item.menuItem.type
      })),
      customerCount: order.customerCount,
      orderNotes: order.notes,
      businessUnitName: businessUnit.name
    }

    // Try to print via server first
    const serverPrintSuccess = await this.printReceipt(request)
    
    // If using browser print or server print failed, use browser printer
    if (this.useBrowserPrint || !serverPrintSuccess) {
      console.log('Printing via browser...')
      return browserPrinter.printOrderDetails(order, businessUnit, waiterName)
    }
    
    return serverPrintSuccess
  }

  async printNewItems(
    orderNumber: string,
    tableNumber: number,
    newItems: Array<{ name: string; quantity: number; notes?: string; type: ItemType }>,
    businessUnit: BusinessUnitDetails,
    waiterName?: string,
    customerCount?: number
  ): Promise<boolean> {
    const request: PrintServiceRequest = {
      orderNumber: `${orderNumber}-ADD`,
      tableNumber,
      waiterName,
      items: newItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        notes: item.notes,
        type: item.type
      })),
      customerCount,
      orderNotes: "Additional items",
      businessUnitName: businessUnit.name
    }

    // Try to print via server first
    const serverPrintSuccess = await this.printReceipt(request)
    
    // If using browser print or server print failed, use browser printer
    if (this.useBrowserPrint || !serverPrintSuccess) {
      console.log('Printing new items via browser...')
      return browserPrinter.printNewItems(
        orderNumber,
        tableNumber,
        newItems,
        businessUnit,
        waiterName,
        customerCount
      )
    }
    
    return serverPrintSuccess
  }
}

export const printServiceAPI = new PrintServiceAPI()