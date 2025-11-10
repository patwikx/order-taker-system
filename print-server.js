import express from 'express'
import cors from 'cors'
import escpos from 'escpos'
import USB from 'escpos-usb'

// Suppress deprecation warnings
process.noDeprecation = true

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// Printer configuration
let printerDevice = null
let printer = null
let usingUSBPrinter = false

// Function to detect and initialize USB printer
function initializeUSBPrinter() {
  try {
    console.log('🔍 Searching for USB printers...')
    
    const devices = escpos.USB.findPrinter()
    
    if (!devices || devices.length === 0) {
      console.log('⚠️  No USB printers found')
      return false
    }
    
    console.log(`✅ Found ${devices.length} USB printer(s)`)
    devices.forEach((device, index) => {
      console.log(`   ${index + 1}. VID: ${device.deviceDescriptor.idVendor}, PID: ${device.deviceDescriptor.idProduct}`)
    })
    
    // Use the first available printer
    printerDevice = new escpos.USB()
    printer = new escpos.Printer(printerDevice)
    usingUSBPrinter = true
    
    console.log('✅ USB Printer initialized successfully')
    return true
    
  } catch (error) {
    console.log('⚠️  USB Printer initialization failed:', error.message)
    return false
  }
}

// Print using USB printer (ESC/POS)
async function printWithUSB(data) {
  return new Promise((resolve, reject) => {
    try {
      printerDevice.open((error) => {
        if (error) {
          console.error('❌ Error opening USB printer:', error)
          return reject(error)
        }

        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(1, 1)
          .text(data.businessUnitName)
          .style('normal')
          .size(0, 0)
          .text('KITCHEN ORDER')
          .text('--------------------------------')
          .align('lt')
          .text(`Date: ${new Date().toLocaleString('en-PH')}`)
          .text(`Order: ${data.orderNumber}`)
          .text(`Table: ${data.tableNumber}`)

        if (data.waiterName) {
          printer.text(`Waiter: ${data.waiterName}`)
        }

        if (data.customerCount) {
          printer.text(`Guests: ${data.customerCount}`)
        }

        printer.text('--------------------------------')
          .style('b')
          .text('ITEMS:')
          .style('normal')
          .text('')

        const foodItems = data.items.filter(item => item.type === 'FOOD')
        const drinkItems = data.items.filter(item => item.type === 'DRINK')

        if (foodItems.length > 0) {
          printer.style('b').text('KITCHEN:').style('normal')
          foodItems.forEach(item => {
            printer.text(`  ${item.quantity}x ${item.name}`)
            if (item.notes) {
              printer.text(`     Note: ${item.notes}`)
            }
          })
          printer.text('')
        }

        if (drinkItems.length > 0) {
          printer.style('b').text('BAR:').style('normal')
          drinkItems.forEach(item => {
            printer.text(`  ${item.quantity}x ${item.name}`)
            if (item.notes) {
              printer.text(`     Note: ${item.notes}`)
            }
          })
          printer.text('')
        }

        if (data.orderNotes) {
          printer
            .text('--------------------------------')
            .style('b')
            .text('ORDER NOTES:')
            .style('normal')
            .text(data.orderNotes)
        }

        printer
          .text('--------------------------------')
          .text('')
          .text('')
          .text('')
          .cut()
          .close(() => {
            console.log('✅ USB Print job completed')
            resolve(true)
          })
      })
    } catch (error) {
      console.error('❌ USB Print error:', error)
      reject(error)
    }
  })
}

// Initialize printer on startup
console.log('🚀 Initializing print server...')
const usbInitialized = initializeUSBPrinter()

if (!usbInitialized) {
  console.log('📌 No USB printer found - client will use browser printing')
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    usingUSBPrinter,
    printerType: usingUSBPrinter ? 'USB' : 'Browser Default'
  })
})

// Printer status endpoint
app.get('/api/printer-status', (req, res) => {
  res.json({ 
    connected: usingUSBPrinter,
    type: usingUSBPrinter ? 'USB' : 'Browser Default',
    usingUSB: usingUSBPrinter,
    useBrowserPrint: !usingUSBPrinter
  })
})

// Print receipt endpoint
app.post('/api/print-receipt', async (req, res) => {
  try {
    const data = req.body
    
    console.log(`📝 Print request received for order: ${data.orderNumber}`)
    
    if (usingUSBPrinter && printer) {
      // Use USB printer
      try {
        await printWithUSB(data)
        console.log('✅ Printed successfully via USB')
        res.json({ success: true, method: 'USB' })
      } catch (usbError) {
        console.log('⚠️  USB print failed')
        console.error(usbError)
        res.status(500).json({ 
          success: false, 
          error: 'USB printer error',
          useBrowserPrint: true
        })
      }
    } else {
      // No USB printer - tell client to use browser printing
      console.log('📌 No USB printer - instructing client to use browser print')
      res.json({ 
        success: false, 
        useBrowserPrint: true,
        message: 'No USB printer available, use browser printing'
      })
    }
    
  } catch (error) {
    console.error('❌ Print error:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message,
      useBrowserPrint: true
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`✅ Print server running on http://localhost:${PORT}`)
  console.log(`📋 Printer type: ${usingUSBPrinter ? 'USB (ESC/POS)' : 'Browser Default (Kiosk Mode)'}`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down print server...')
  if (printerDevice) {
    try {
      printerDevice.close()
    } catch (e) {
      // Ignore close errors
    }
  }
  process.exit(0)
})