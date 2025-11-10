import { ItemType } from "@prisma/client"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"

interface USBDevice {
  configuration: USBConfiguration | null
  open(): Promise<void>
  close(): Promise<void>
  selectConfiguration(configurationValue: number): Promise<void>
  claimInterface(interfaceNumber: number): Promise<void>
  transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>
}

interface USBConfiguration {
  configurationValue: number
}

interface USBOutTransferResult {
  bytesWritten: number
  status: string
}

interface USB {
  requestDevice(options: { filters: Array<{ vendorId: number }> }): Promise<USBDevice>
}

interface PrintOrderItem {
  name: string
  quantity: number
  notes?: string
  type: ItemType
}

interface PrintOrderData {
  orderNumber: string
  tableNumber: number
  waiterName?: string
  items: PrintOrderItem[]
  customerCount?: number
  orderNotes?: string
  timestamp: Date
  businessUnit: BusinessUnitDetails
}

export type PrintMethod = 'usb' | 'default'

export class EpsonPOSPrinter {
  private encoder: TextEncoder

  constructor() {
    this.encoder = new TextEncoder()
  }

  private encodeCommand(command: number[]): Uint8Array {
    return new Uint8Array(command)
  }

  private encodeText(text: string): Uint8Array {
    return this.encoder.encode(text)
  }

  private buildPrintCommands(data: PrintOrderData): Uint8Array {
    const commands: number[] = []

    commands.push(0x1B, 0x40)

    commands.push(0x1B, 0x61, 0x01)
    commands.push(0x1B, 0x45, 0x01)
    commands.push(0x1D, 0x21, 0x11)
    const businessNameBytes = Array.from(this.encodeText(data.businessUnit.name + "\n"))
    commands.push(...businessNameBytes)
    commands.push(0x1B, 0x45, 0x00)
    commands.push(0x1D, 0x21, 0x00)

    commands.push(0x1B, 0x61, 0x01)
    const titleBytes = Array.from(this.encodeText("KITCHEN ORDER\n"))
    commands.push(...titleBytes)

    commands.push(0x1B, 0x61, 0x00)
    commands.push(...Array.from(this.encodeText("--------------------------------\n")))

    const dateStr = data.timestamp.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    const timeStr = data.timestamp.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit'
    })
    commands.push(...Array.from(this.encodeText(`Date: ${dateStr} ${timeStr}\n`)))
    commands.push(...Array.from(this.encodeText(`Order: ${data.orderNumber}\n`)))
    commands.push(...Array.from(this.encodeText(`Table: ${data.tableNumber}\n`)))

    if (data.waiterName) {
      commands.push(...Array.from(this.encodeText(`Waiter: ${data.waiterName}\n`)))
    }

    if (data.customerCount) {
      commands.push(...Array.from(this.encodeText(`Guests: ${data.customerCount}\n`)))
    }

    commands.push(...Array.from(this.encodeText("--------------------------------\n")))

    commands.push(0x1B, 0x45, 0x01)
    commands.push(...Array.from(this.encodeText("ITEMS:\n")))
    commands.push(0x1B, 0x45, 0x00)
    commands.push(...Array.from(this.encodeText("\n")))

    const foodItems = data.items.filter(item => item.type === ItemType.FOOD)
    const drinkItems = data.items.filter(item => item.type === ItemType.DRINK)

    if (foodItems.length > 0) {
      commands.push(0x1B, 0x45, 0x01)
      commands.push(...Array.from(this.encodeText("KITCHEN:\n")))
      commands.push(0x1B, 0x45, 0x00)

      for (const item of foodItems) {
        const itemLine = `  ${item.quantity}x ${item.name}\n`
        commands.push(...Array.from(this.encodeText(itemLine)))

        if (item.notes) {
          commands.push(...Array.from(this.encodeText(`     Note: ${item.notes}\n`)))
        }
      }
      commands.push(...Array.from(this.encodeText("\n")))
    }

    if (drinkItems.length > 0) {
      commands.push(0x1B, 0x45, 0x01)
      commands.push(...Array.from(this.encodeText("BAR:\n")))
      commands.push(0x1B, 0x45, 0x00)

      for (const item of drinkItems) {
        const itemLine = `  ${item.quantity}x ${item.name}\n`
        commands.push(...Array.from(this.encodeText(itemLine)))

        if (item.notes) {
          commands.push(...Array.from(this.encodeText(`     Note: ${item.notes}\n`)))
        }
      }
      commands.push(...Array.from(this.encodeText("\n")))
    }

    if (data.orderNotes) {
      commands.push(...Array.from(this.encodeText("--------------------------------\n")))
      commands.push(0x1B, 0x45, 0x01)
      commands.push(...Array.from(this.encodeText("ORDER NOTES:\n")))
      commands.push(0x1B, 0x45, 0x00)
      commands.push(...Array.from(this.encodeText(`${data.orderNotes}\n`)))
    }

    commands.push(...Array.from(this.encodeText("--------------------------------\n")))
    commands.push(...Array.from(this.encodeText("\n\n\n")))

    commands.push(0x1D, 0x56, 0x42, 0x00)

    return new Uint8Array(commands)
  }

  // Generate HTML content for default printer with auto-print
  private buildHTMLContent(data: PrintOrderData): string {
    const dateStr = data.timestamp.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    const timeStr = data.timestamp.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit'
    })

    const foodItems = data.items.filter(item => item.type === ItemType.FOOD)
    const drinkItems = data.items.filter(item => item.type === ItemType.DRINK)

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kitchen Order - ${data.orderNumber}</title>
        <style>
          @media print {
            @page {
              margin: 0.5cm;
              size: 80mm auto;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .large {
            font-size: 16px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .item {
            margin: 5px 0;
          }
          .item-note {
            margin-left: 20px;
            font-style: italic;
            font-size: 11px;
          }
          .section-title {
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 5px;
          }
          @media screen {
            body {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="center bold large">${data.businessUnit.name}</div>
        <div class="center bold">KITCHEN ORDER</div>
        <div class="divider"></div>
        
        <div>Date: ${dateStr} ${timeStr}</div>
        <div>Order: ${data.orderNumber}</div>
        <div>Table: ${data.tableNumber}</div>
        ${data.waiterName ? `<div>Waiter: ${data.waiterName}</div>` : ''}
        ${data.customerCount ? `<div>Guests: ${data.customerCount}</div>` : ''}
        
        <div class="divider"></div>
        <div class="bold">ITEMS:</div>
        <br>
    `

    if (foodItems.length > 0) {
      html += '<div class="section-title">KITCHEN:</div>'
      foodItems.forEach(item => {
        html += `<div class="item">${item.quantity}x ${item.name}</div>`
        if (item.notes) {
          html += `<div class="item-note">Note: ${item.notes}</div>`
        }
      })
      html += '<br>'
    }

    if (drinkItems.length > 0) {
      html += '<div class="section-title">BAR:</div>'
      drinkItems.forEach(item => {
        html += `<div class="item">${item.quantity}x ${item.name}</div>`
        if (item.notes) {
          html += `<div class="item-note">Note: ${item.notes}</div>`
        }
      })
      html += '<br>'
    }

    if (data.orderNotes) {
      html += `
        <div class="divider"></div>
        <div class="bold">ORDER NOTES:</div>
        <div>${data.orderNotes}</div>
      `
    }

    html += `
        <div class="divider"></div>
      </body>
      </html>
    `

    return html
  }

  // Print using USB POS printer
  async printOrderUSB(orderData: PrintOrderData): Promise<boolean> {
    try {
      if (!('usb' in navigator)) {
        throw new Error("WebUSB is not supported in this browser")
      }

      const device = await (navigator as Navigator & { usb: USB }).usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 }
        ]
      })

      await device.open()

      if (device.configuration === null) {
        await device.selectConfiguration(1)
      }

      await device.claimInterface(0)

      const printData = this.buildPrintCommands(orderData)

      const chunkSize = 64
      for (let i = 0; i < printData.length; i += chunkSize) {
        const chunk = printData.slice(i, i + chunkSize)
        await device.transferOut(1, chunk)

        await new Promise(resolve => setTimeout(resolve, 10))
      }

      await device.close()

      return true
    } catch (error) {
      console.error("USB Printing error:", error)
      throw error
    }
  }

  // Print using default browser printer - ALTERNATIVE METHOD
  async printOrderDefaultAlt(orderData: PrintOrderData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const htmlContent = this.buildHTMLContent(orderData)
        
        // Open in a new window instead of iframe
        const printWindow = window.open('', '_blank', 'width=300,height=600')
        
        if (!printWindow) {
          reject(new Error("Failed to open print window. Please allow pop-ups."))
          return
        }

        printWindow.document.open()
        printWindow.document.write(htmlContent)
        printWindow.document.close()

        // Wait for content to load
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            
            // Close after print
            setTimeout(() => {
              printWindow.close()
              resolve(true)
            }, 2000)
          }, 500)
        }

      } catch (error) {
        console.error("Print error:", error)
        reject(error)
      }
    })
  }

  // Print using default browser printer - SILENT/AUTO PRINT
  async printOrderDefault(orderData: PrintOrderData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const htmlContent = this.buildHTMLContent(orderData)
        
        // Create iframe for silent printing
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        iframe.style.visibility = 'hidden'
        
        document.body.appendChild(iframe)
        
        const iframeDoc = iframe.contentWindow?.document
        if (!iframeDoc) {
          document.body.removeChild(iframe)
          reject(new Error("Failed to access iframe document"))
          return
        }
        
        iframeDoc.open()
        iframeDoc.write(htmlContent)
        iframeDoc.close()
        
        // Auto-click print button handler
        const tryAutoClickPrint = () => {
          // Try to find and click the Print button in the print dialog
          // This works in kiosk mode when the dialog appears
          setTimeout(() => {
            try {
              // Simulate Enter key press to accept print dialog
              const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
              })
              document.dispatchEvent(enterEvent)
            } catch (e) {
              console.log('Auto-click attempt:', e)
            }
          }, 1000)
        }
        
        // Wait for content to fully load
        iframe.onload = () => {
          // Give more time for rendering
          setTimeout(() => {
            try {
              // Focus the iframe before printing
              iframe.contentWindow?.focus()
              
              // Trigger print
              iframe.contentWindow?.print()
              
              // Try to auto-accept the print dialog
              tryAutoClickPrint()
              
              // Wait longer before cleanup to ensure print job is sent
              setTimeout(() => {
                try {
                  if (iframe && iframe.parentNode) {
                    document.body.removeChild(iframe)
                  }
                } catch (cleanupError) {
                  console.error("Cleanup error:", cleanupError)
                }
                resolve(true)
              }, 5000) // Wait 5 seconds before cleanup
              
            } catch (printError) {
              console.error("Print execution error:", printError)
              if (iframe && iframe.parentNode) {
                document.body.removeChild(iframe)
              }
              reject(printError)
            }
          }, 500) // Wait 500ms for rendering
        }
        
        // Handle load errors
        iframe.onerror = (error) => {
          if (iframe && iframe.parentNode) {
            document.body.removeChild(iframe)
          }
          reject(error)
        }
        
      } catch (error) {
        console.error("Default printer error:", error)
        reject(error)
      }
    })
  }

  // Main print method with method selection
  async printOrder(orderData: PrintOrderData, method: PrintMethod = 'default'): Promise<boolean> {
    if (method === 'usb') {
      return this.printOrderUSB(orderData)
    } else {
      return this.printOrderDefault(orderData)
    }
  }

  async printOrderDetails(
    order: OrderWithDetails,
    businessUnit: BusinessUnitDetails,
    waiterName?: string,
    method: PrintMethod = 'default'
  ): Promise<boolean> {
    const printData: PrintOrderData = {
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
      timestamp: new Date(),
      businessUnit
    }

    return this.printOrder(printData, method)
  }

  async printNewItems(
    orderNumber: string,
    tableNumber: number,
    newItems: Array<{ name: string; quantity: number; notes?: string; type: ItemType }>,
    businessUnit: BusinessUnitDetails,
    waiterName?: string,
    customerCount?: number,
    method: PrintMethod = 'default'
  ): Promise<boolean> {
    const printData: PrintOrderData = {
      orderNumber: `${orderNumber}-ADD`,
      tableNumber,
      waiterName,
      items: newItems,
      customerCount,
      orderNotes: "Additional items",
      timestamp: new Date(),
      businessUnit
    }

    return this.printOrder(printData, method)
  }
}

export const epsonPrinter = new EpsonPOSPrinter()