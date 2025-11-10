"use client"

import { useState, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2, 
  Download, 
  Upload, 
  CheckCircle2, 
  XCircle,
  Image as ImageIcon,
  Trash2,
  FileSpreadsheet,
  FileCheck
} from "lucide-react"
import { ItemType } from "@prisma/client"
import { createMenuItem, type CreateMenuItemInput } from "@/lib/actions/menu-actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

interface MenuItemBulkImportProps {
  businessUnitId: string
  categories: Category[]
}

interface ParsedMenuItem {
  name: string
  description: string
  price: number
  categoryId: string
  categoryName: string
  type: ItemType
  prepTime: number
  imageUrl?: string
  imageFileName?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function MenuItemBulkImport({ businessUnitId, categories }: MenuItemBulkImportProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [parsedItems, setParsedItems] = useState<ParsedMenuItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isParsingCSV, setIsParsingCSV] = useState(false)
  const [parsedCount, setParsedCount] = useState(0)

  const downloadTemplate = () => {
    const headers = ['Name', 'Description', 'Price', 'Category', 'Type', 'Prep Time (minutes)']
    const exampleRow = ['Burger Deluxe', 'Juicy beef burger with cheese', '250.00', categories[0]?.name || 'Main Course', 'FOOD', '15']
    
    const csvContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'menu-items-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Template downloaded successfully')
  }

  const handleFileUpload = async (result: { fileName: string; name: string; fileUrl: string }) => {
    setIsParsingCSV(true)
    setParsedCount(0)
    
    try {
      const response = await fetch(result.fileUrl)
      const text = await response.text()
      
      // Parse CSV
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid')
        setIsParsingCSV(false)
        return
      }

      const items: ParsedMenuItem[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        
        if (values.length < 6) continue

        const categoryName = values[3]
        const category = categories.find(c => 
          c.name.toLowerCase() === categoryName.toLowerCase()
        )

        if (!category) {
          toast.error(`Category "${categoryName}" not found on row ${i + 1}`)
          continue
        }

        const type = values[4].toUpperCase() as ItemType
        if (type !== ItemType.FOOD && type !== ItemType.DRINK) {
          toast.error(`Invalid type "${values[4]}" on row ${i + 1}. Must be FOOD or DRINK`)
          continue
        }

        items.push({
          name: values[0],
          description: values[1] || '',
          price: parseFloat(values[2]) || 0,
          categoryId: category.id,
          categoryName: category.name,
          type,
          prepTime: parseInt(values[5]) || 15,
          status: 'pending'
        })
        
        // Update progress
        setParsedCount(items.length)
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Show success for a moment before closing
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setParsedItems(items)
      setIsParsingCSV(false)
      toast.success(`Parsed ${items.length} items from CSV`)
    } catch {
      toast.error('Failed to parse CSV file')
      setIsParsingCSV(false)
    }
  }

  const handleImageUpload = (index: number, result: { fileName: string; name: string; fileUrl: string }) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, imageUrl: result.fileUrl, imageFileName: result.name }
        : item
    ))
    toast.success(`Image uploaded for ${parsedItems[index].name}`)
  }

  const handleRemoveImage = (index: number) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, imageUrl: undefined, imageFileName: undefined }
        : item
    ))
  }

  const handleRemoveItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleCategoryChange = (index: number, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category) {
      setParsedItems(prev => prev.map((item, i) => 
        i === index 
          ? { ...item, categoryId: category.id, categoryName: category.name }
          : item
      ))
    }
  }

  const handleImportAll = () => {
    if (parsedItems.length === 0) {
      toast.error('No items to import')
      return
    }

    setIsProcessing(true)
    startTransition(async () => {
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i]
        
        setParsedItems(prev => prev.map((it, idx) => 
          idx === i ? { ...it, status: 'uploading' } : it
        ))

        try {
          const menuItemData: CreateMenuItemInput = {
            name: item.name,
            description: item.description || undefined,
            price: item.price,
            categoryId: item.categoryId,
            type: item.type,
            prepTime: item.prepTime || undefined,
            imageUrl: item.imageUrl || undefined,
          }

          const result = await createMenuItem(businessUnitId, menuItemData)

          if (result.success) {
            setParsedItems(prev => prev.map((it, idx) => 
              idx === i ? { ...it, status: 'success' } : it
            ))
            successCount++
          } else {
            setParsedItems(prev => prev.map((it, idx) => 
              idx === i ? { ...it, status: 'error', error: result.error } : it
            ))
            errorCount++
          }
        } catch {
          setParsedItems(prev => prev.map((it, idx) => 
            idx === i ? { ...it, status: 'error', error: 'Failed to create item' } : it
          ))
          errorCount++
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setIsProcessing(false)
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} items`)
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} items`)
      }

      if (successCount === parsedItems.length) {
        setTimeout(() => {
          router.push(`/${businessUnitId}/menu/menu-items`)
        }, 2000)
      }
    })
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      
      if (result.success) {
        await handleFileUpload({
          fileName: result.fileName,
          name: result.originalName,
          fileUrl: result.fileUrl,
        })
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (error) {
      toast.error('Upload failed')
    }
    
    // Reset input
    if (e.target) e.target.value = ''
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Action Bar */}
      <div className="bg-white border-b px-6 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Step 1 */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                1
              </div>
              <Button onClick={downloadTemplate} variant="outline" size="sm" className="h-8">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download Template
              </Button>
            </div>
            
            <div className="h-8 w-px bg-gray-200" />
            
            {/* Step 2 */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                2
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,application/csv,application/vnd.ms-excel"
                onChange={handleFileInputChange}
                disabled={isPending || isProcessing}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  disabled={isPending || isProcessing}
                  onClick={(e) => {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }}
                  asChild
                >
                  <span>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload CSV
                  </span>
                </Button>
              </label>
            </div>

            {parsedItems.length > 0 && (
              <>
                <div className="h-8 w-px bg-gray-200" />
                <div className="flex items-center gap-2 text-sm">
                  <div className="px-2.5 py-1 bg-gray-100 rounded-md font-medium text-gray-900">
                    {parsedItems.length}
                  </div>
                  <span className="text-gray-600">items parsed</span>
                  {parsedItems.filter(i => i.status === 'success').length > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <div className="px-2.5 py-1 bg-green-100 rounded-md font-medium text-green-700">
                        {parsedItems.filter(i => i.status === 'success').length}
                      </div>
                      <span className="text-gray-600">imported</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {parsedItems.length > 0 && (
            <Button 
              onClick={handleImportAll}
              disabled={isProcessing || parsedItems.every(i => i.status === 'success')}
              size="sm"
              className="h-8"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Import All Items
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Parsing CSV Dialog */}
      <Dialog open={isParsingCSV} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Parsing CSV File
            </DialogTitle>
            <DialogDescription>
              Please wait while we process your file...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-2xl font-bold text-blue-600">{parsedCount}</p>
              <p className="text-sm text-gray-600">items parsed</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {parsedItems.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Yet</h3>
              <p className="text-gray-500 mb-6">
                Download the CSV template, fill it with your menu items, and upload it to get started.
              </p>
              <div className="flex flex-col gap-2 text-sm text-left bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <div className="font-medium text-gray-900">Download the template</div>
                    <div className="text-gray-600">Get the CSV format with example data</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <div className="font-medium text-gray-900">Fill in your items</div>
                    <div className="text-gray-600">Add name, description, price, category, type, and prep time</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <div className="font-medium text-gray-900">Upload and review</div>
                    <div className="text-gray-600">Upload your CSV and optionally add images</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="w-28 font-semibold">Price</TableHead>
                    <TableHead className="w-40 font-semibold">Category</TableHead>
                    <TableHead className="w-24 font-semibold">Type</TableHead>
                    <TableHead className="w-52 font-semibold">Image</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedItems.map((item, index) => (
                    <TableRow 
                      key={index}
                      className={
                        item.status === 'success' ? 'bg-green-50/50' :
                        item.status === 'error' ? 'bg-red-50/50' :
                        item.status === 'uploading' ? 'bg-blue-50/50' :
                        ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {item.status === 'pending' && (
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                          )}
                          {item.status === 'uploading' && (
                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          )}
                          {item.status === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {item.status === 'error' && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">{item.description}</TableCell>
                      <TableCell className="font-medium">₱{item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={item.categoryId}
                          onValueChange={(value) => handleCategoryChange(index, value)}
                          disabled={isProcessing || item.status !== 'pending'}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.type === ItemType.FOOD ? "default" : "secondary"}
                          className="font-medium"
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.imageUrl ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                              <ImageIcon className="w-3 h-3" />
                              Image added
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveImage(index)}
                              disabled={isProcessing || item.status !== 'pending'}
                              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.gif,.webp"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return
                                
                                const formData = new FormData()
                                formData.append('file', file)
                                
                                try {
                                  const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData,
                                  })
                                  const result = await response.json()
                                  
                                  if (result.success) {
                                    handleImageUpload(index, {
                                      fileName: result.fileName,
                                      name: result.originalName,
                                      fileUrl: result.fileUrl,
                                    })
                                  } else {
                                    toast.error(result.error || 'Upload failed')
                                  }
                                } catch {
                                  toast.error('Upload failed')
                                }
                              }}
                              disabled={isProcessing || item.status !== 'pending'}
                              className="hidden"
                              id={`file-${index}`}
                            />
                            <label
                              htmlFor={`file-${index}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md cursor-pointer transition-colors ${
                                isProcessing || item.status !== 'pending' 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                                  : 'hover:bg-gray-50 hover:border-gray-400'
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              Add Image
                            </label>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
