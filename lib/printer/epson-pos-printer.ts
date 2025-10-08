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

  async printOrder(orderData: PrintOrderData): Promise<boolean> {
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
      console.error("Printing error:", error)
      throw error
    }
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

export const epsonPrinter = new EpsonPOSPrinter()
