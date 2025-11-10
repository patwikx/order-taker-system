"use client"

import { memo } from "react"
import { 
  Users, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TableCellsMergeIcon,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TableStatus, OrderStatus } from "@prisma/client"
import type { TableWithCurrentOrder } from "@/lib/actions/table-actions"

interface TableGridProps {
  tables: TableWithCurrentOrder[]
  selectedTableId: string | null
  isCollapsed: boolean
  onTableSelect: (tableId: string) => void
  onToggleCollapse: () => void
}

interface TableStatusInfo {
  color: string
  text: string
  icon: React.ComponentType<{ className?: string }>
}

const getTableStatusInfo = (
  status: TableStatus, 
  hasCurrentOrder: boolean, 
  orderStatus?: OrderStatus
): TableStatusInfo => {
  if (hasCurrentOrder) {
    if (orderStatus === OrderStatus.PENDING) {
      return { 
        color: "border-yellow-400 bg-yellow-50 text-yellow-700", 
        text: "Has Draft", 
        icon: Edit3 
      }
    } else {
      return { 
        color: "border-orange-400 bg-orange-50 text-orange-700", 
        text: "Has Order", 
        icon: Edit3 
      }
    }
  }

  switch (status) {
    case TableStatus.OCCUPIED:
      return { 
        color: "border-red-400 bg-red-50 text-red-700", 
        text: "Occupied", 
        icon: Users 
      }
    case TableStatus.AVAILABLE:
      return {
        color: "border-green-400 bg-green-50 text-green-700 hover:bg-green-100",
        text: "Available",
        icon: CheckCircle2,
      }
    case TableStatus.RESERVED:
      return { 
        color: "border-blue-400 bg-blue-50 text-blue-700", 
        text: "Reserved", 
        icon: Clock 
      }
    case TableStatus.OUT_OF_ORDER:
      return { 
        color: "border-gray-400 bg-gray-50 text-gray-700", 
        text: "Out of Order", 
        icon: AlertCircle 
      }
    default:
      return { 
        color: "bg-white text-gray-700", 
        text: "Unknown", 
        icon: AlertCircle 
      }
  }
}

const getTableStatusDot = (
  status: TableStatus, 
  hasCurrentOrder: boolean, 
  orderStatus?: OrderStatus
): string => {
  if (hasCurrentOrder) {
    if (orderStatus === OrderStatus.PENDING) {
      return "bg-yellow-500"
    } else {
      return "bg-orange-500"
    }
  }

  switch (status) {
    case TableStatus.OCCUPIED:
      return "bg-red-500"
    case TableStatus.AVAILABLE:
      return "bg-green-500"
    case TableStatus.RESERVED:
      return "bg-blue-500"
    case TableStatus.OUT_OF_ORDER:
      return "bg-gray-400"
    default:
      return "bg-gray-400"
  }
}

const TableCard = memo(({ 
  table, 
  isSelected, 
  onSelect 
}: { 
  table: TableWithCurrentOrder
  isSelected: boolean
  onSelect: (tableId: string) => void
}) => {
  const statusInfo = getTableStatusInfo(table.status, !!table.currentOrder, table.currentOrder?.status)
  const StatusIcon = statusInfo.icon

  return (
    <div
      onClick={() => onSelect(table.id)}
      className={`relative p-2 rounded-md border-2 cursor-pointer transition-all duration-200 ${statusInfo.color} ${
        isSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""
      }`}
    >
      <div className="text-center">
        <div className="text-sm font-bold mb-0.5">T{table.number}</div>
        <div className="flex items-center justify-center gap-0.5 text-[10px] mb-1">
          <StatusIcon className="w-2.5 h-2.5" />
          <span>{statusInfo.text}</span>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-center gap-0.5 text-[10px]">
            <Users className="w-2.5 h-2.5" />
            <span>{table.capacity}</span>
          </div>
          {table.location && <div className="text-[10px] opacity-75">{table.location}</div>}
          {table.currentOrder && (
            <div className="text-[10px] text-blue-600 font-medium flex items-center justify-center gap-0.5">
              <Edit3 className="w-2.5 h-2.5" />
              {table.currentOrder.orderNumber}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

TableCard.displayName = "TableCard"

const CollapsedTableCard = memo(({ 
  table, 
  isSelected, 
  onSelect 
}: { 
  table: TableWithCurrentOrder
  isSelected: boolean
  onSelect: (tableId: string) => void
}) => {
  const statusDot = getTableStatusDot(table.status, !!table.currentOrder, table.currentOrder?.status)
  const statusInfo = getTableStatusInfo(table.status, !!table.currentOrder, table.currentOrder?.status)

  return (
    <div
      onClick={() => onSelect(table.id)}
      className={`relative p-3 rounded-lg bg-white border cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-400 ring-offset-1 shadow-md border-blue-200" : "border-gray-200 hover:border-gray-300"
      }`}
      title={`Table ${table.number} - ${statusInfo.text} - ${table.capacity} seats`}
    >
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusDot} border-2 border-white`} />
      
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900 mb-1">T{table.number}</div>
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
          <Users className="w-3 h-3" />
          <span>{table.capacity}</span>
        </div>
        {table.currentOrder && (
          <div className="mt-1">
            <Edit3 className="w-3 h-3 text-blue-500 mx-auto" />
          </div>
        )}
      </div>
    </div>
  )
})

CollapsedTableCard.displayName = "CollapsedTableCard"

export const TableGrid = memo(({ 
  tables, 
  selectedTableId, 
  isCollapsed, 
  onTableSelect, 
  onToggleCollapse 
}: TableGridProps) => {
  const occupiedCount = tables.filter((t) => t.status === TableStatus.OCCUPIED || t.currentOrder).length

  if (isCollapsed) {
    return (
      <div className="w-24 border-r flex flex-col h-full min-h-0 transition-all duration-300">
        <div className="p-2 border-b bg-white flex justify-center">
          <Button 
            variant='outline' 
            size="sm" 
            onClick={onToggleCollapse}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-gray-50 scrollbar-hide min-h-0">
          <div className="space-y-2">
            {tables.map((table) => (
              <CollapsedTableCard
                key={table.id}
                table={table}
                isSelected={selectedTableId === table.id}
                onSelect={onTableSelect}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r flex flex-col h-full min-h-0 transition-all duration-300">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <TableCellsMergeIcon className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tables</h2>
              <p className="text-sm text-gray-600">
                {tables.length} total • {occupiedCount} occupied
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant='outline' 
              size="sm" 
              onClick={onToggleCollapse}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 bg-gray-50 scrollbar-hide min-h-0">
        <div className="grid grid-cols-3 gap-1.5">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              onSelect={onTableSelect}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

TableGrid.displayName = "TableGrid"