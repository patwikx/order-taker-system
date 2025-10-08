# Epson POS Printer U220B Setup Guide

This guide explains how the automatic printing functionality works when sending orders to Kitchen/Bar.

## Overview

The system automatically prints order details when:
1. Sending a new order to Kitchen/Bar
2. Adding more items to an existing order
3. Sending a draft order to Kitchen/Bar

## How It Works

### USB Connection

The printer uses the WebUSB API to connect to your Epson POS Printer U220B. The browser will prompt you to select the printer when you first send an order.

### Supported Browser

- **Chrome/Edge (Chromium-based browsers)**: Full support for WebUSB
- **Firefox/Safari**: Not supported (WebUSB not available)

### What Gets Printed

When you send an order to Kitchen/Bar, the system prints:

1. **Business Information**: Restaurant name
2. **Order Details**:
   - Date and time
   - Order number
   - Table number
   - Waiter name
   - Number of guests
3. **Items Separated by Type**:
   - KITCHEN items (food)
   - BAR items (drinks)
4. **Item Details**:
   - Quantity
   - Item name
   - Special notes (if any)
5. **Order Notes**: Any special instructions for the entire order

### Print Format

The receipt is formatted using ESC/POS commands specifically for Epson printers:
- Bold headers
- Proper text alignment
- Clear section separators
- Easy-to-read layout

## First-Time Setup

1. **Connect the Printer**:
   - Plug in your Epson U220B printer via USB
   - Make sure it's powered on

2. **Grant Browser Permissions**:
   - When you click "Send to Kitchen" for the first time
   - The browser will show a device selection dialog
   - Select your Epson printer from the list
   - Click "Connect"

3. **Subsequent Prints**:
   - The browser will remember your printer selection
   - No need to select the printer again

## Troubleshooting

### Print Failed Error

If you see a "printing failed" message:

1. **Check USB Connection**: Make sure the printer is connected and powered on
2. **Check Browser Permissions**: The browser might have blocked USB access
3. **Restart the Browser**: Sometimes helps clear permission issues
4. **Try Again**: Click the print button again

### No Printer Prompt

If the browser doesn't show the printer selection dialog:

1. **Check Browser Compatibility**: Make sure you're using Chrome or Edge
2. **HTTPS Required**: WebUSB only works on HTTPS connections (or localhost)
3. **Check USB Permissions**: Some browsers require explicit permission grants

### Printer Prints Garbage

If the printer prints unreadable characters:

1. **Check Printer Model**: Make sure you're using an Epson ESC/POS compatible printer
2. **Check Cable**: Try a different USB cable
3. **Reset Printer**: Turn off the printer, wait 10 seconds, turn it back on

## Technical Details

### Print Commands

The system uses ESC/POS commands:
- `0x1B 0x40`: Initialize printer
- `0x1B 0x45 0x01`: Bold on
- `0x1B 0x61 0x01`: Center alignment
- `0x1D 0x56 0x42 0x00`: Cut paper

### Vendor ID

Epson printers use vendor ID: `0x04b8`

### Data Transfer

- Data is sent in 64-byte chunks
- 10ms delay between chunks to prevent buffer overflow

## Order Printing Scenarios

### Scenario 1: New Order
- Prints all items
- Shows order number (e.g., "REST001-10001")

### Scenario 2: Adding Items to Existing Order
- Prints only new items
- Shows order number with "-ADD" suffix (e.g., "REST001-10001-ADD")
- Indicates "Additional items" in notes

### Scenario 3: Draft Order Sent to Kitchen
- Prints all items from the draft
- Same format as new order

## Fallback

If printing fails, the order is still processed successfully. The system will:
1. Show a warning message
2. Suggest printing manually if needed
3. Continue with order processing

The order is never lost due to printer issues.
