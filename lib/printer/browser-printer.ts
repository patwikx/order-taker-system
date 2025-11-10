import { ItemType } from "@prisma/client"
import type { OrderWithDetails } from "@/lib/actions/order-actions"
import type { BusinessUnitDetails } from "@/lib/actions/business-unit-actions"

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

export class BrowserPrinter {
  private generatePrintHTML(data: PrintOrderData): string {
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
            .no-print {
              display: none;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.6;
            max-width: 300px;
            margin: 0 auto;
            padding: 10px;
            background: white;
          }
          .center {
            text-align: center;
          }
          .bold {
            font-weight: bold;
          }
          .large {
            font-size: 18px;
          }
          .divider {
            border-top: 2px dashed #000;
            margin: 10px 0;
          }
          .item {
            margin: 8px 0;
            padding-left: 10px;
          }
          .item-note {
            margin-left: 20px;
            font-style: italic;
            font-size: 12px;
            color: #333;
          }
          .section-title {
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 8px;
            text-decoration: underline;
          }
          .info-line {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="center bold large">${data.businessUnit.name}</div>
        <div class="center bold">KITCHEN ORDER</div>
        <div class="divider"></div>
        
        <div class="info-line">Date: ${dateStr} ${timeStr}</div>
        <div class="info-line">Order: <strong>${data.orderNumber}</strong></div>
        <div class="info-line">Table: <strong>${data.tableNumber}</strong></div>
        ${data.waiterName ? `<div class="info-line">Waiter: ${data.waiterName}</div>` : ''}
        ${data.customerCount ? `<div class="info-line">Guests: ${data.customerCount}</div>` : ''}
        
        <div class="divider"></div>
        <div class="bold">ITEMS:</div>
        <br>
    `

    if (foodItems.length > 0) {
      html += '<div class="section-title">KITCHEN:</div>'
      foodItems.forEach(item => {
        html += `<div class="item"><strong>${item.quantity}x</strong> ${item.name}</div>`
        if (item.notes) {
          html += `<div class="item-note">Note: ${item.notes}</div>`
        }
      })
      html += '<br>'
    }

    if (drinkItems.length > 0) {
      html += '<div class="section-title">BAR:</div>'
      drinkItems.forEach(item => {
        html += `<div class="item"><strong>${item.quantity}x</strong> ${item.name}</div>`
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
        <div style="margin: 10px 0;">${data.orderNotes}</div>
      `
    }

    html += `
        <div class="divider"></div>
        <div class="center" style="margin-top: 20px; margin-bottom: 30px;">Thank you!</div>
      </body>
      </html>
    `

    return html
  }

  async printOrder(data: PrintOrderData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const htmlContent = this.generatePrintHTML(data)
        
        // Create hidden iframe for printing
        const iframe = document.createElement('iframe')
        iframe.style.position = 'absolute'
        iframe.style.top = '-9999px'
        iframe.style.left = '-9999px'
        iframe.style.width = '1px'
        iframe.style.height = '1px'
        iframe.style.border = 'none'
        iframe.style.visibility = 'hidden'
        iframe.style.opacity = '0'
        
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
        
        // Wait for content to load
        iframe.onload = () => {
          setTimeout(() => {
            try {
              const iframeWindow = iframe.contentWindow
              if (!iframeWindow) {
                throw new Error("Cannot access iframe window")
              }

              // Focus the iframe
              iframeWindow.focus()
              
              // Auto-click Print button in dialog
              const autoClickPrint = () => {
                const attempts = 20 // Try 20 times over 2 seconds
                let attemptCount = 0
                
                const clickInterval = setInterval(() => {
                  attemptCount++
                  
                  // Try to find and click Print button
                  try {
                    // Method 1: Try to find Print button by text
                    const buttons = document.querySelectorAll('button')
                    buttons.forEach(button => {
                      if (button.textContent?.toLowerCase().includes('print')) {
                        button.click()
                      }
                    })
                    
                    // Method 2: Press Enter key
                    const enterEvent = new KeyboardEvent('keypress', {
                      key: 'Enter',
                      code: 'Enter',
                      keyCode: 13,
                      which: 13,
                      bubbles: true,
                      cancelable: true
                    })
                    document.dispatchEvent(enterEvent)
                    window.dispatchEvent(enterEvent)
                    
                    // Method 3: Try pressing Enter on active element
                    if (document.activeElement) {
                      document.activeElement.dispatchEvent(enterEvent)
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                  
                  if (attemptCount >= attempts) {
                    clearInterval(clickInterval)
                  }
                }, 100)
              }
              
              // Trigger print
              iframeWindow.print()
              
              // Start auto-clicking
              autoClickPrint()
              
              // Cleanup after printing
              setTimeout(() => {
                try {
                  if (iframe && iframe.parentNode) {
                    document.body.removeChild(iframe)
                  }
                } catch (cleanupError) {
                  console.error("Cleanup error:", cleanupError)
                }
                resolve(true)
              }, 3000)
              
            } catch (printError) {
              console.error("Print execution error:", printError)
              if (iframe && iframe.parentNode) {
                document.body.removeChild(iframe)
              }
              reject(printError)
            }
          }, 500)
        }
        
        iframe.onerror = (error) => {
          if (iframe && iframe.parentNode) {
            document.body.removeChild(iframe)
          }
          reject(error)
        }
        
      } catch (error) {
        console.error("Browser print error:", error)
        reject(error)
      }
    })
  }

  async printOrderDetails(
    order: OrderWithDetails,
    businessUnit: BusinessUnitDetails,
    waiterName?: string
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

    return this.printOrder(printData)
  }

  async printNewItems(
    orderNumber: string,
    tableNumber: number,
    newItems: Array<{ name: string; quantity: number; notes?: string; type: ItemType }>,
    businessUnit: BusinessUnitDetails,
    waiterName?: string,
    customerCount?: number
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

    return this.printOrder(printData)
  }
}

export const browserPrinter = new BrowserPrinter()