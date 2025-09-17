// Types based on the Prisma schema
export interface BusinessUnit {
  id: string
  code: string
  name: string
  address?: string
  phone?: string
  email?: string
  timezone: string
  currency: string
  taxRate: number
  isActive: boolean
  settings?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

export interface Table {
  id: string
  businessUnitId: string
  number: number
  capacity: number
  status: TableStatus
  location?: string
  isActive: boolean
}

export enum TableStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  RESERVED = "RESERVED",
  OUT_OF_ORDER = "OUT_OF_ORDER",
}

export interface Category {
  id: string
  businessUnitId: string
  name: string
  description?: string
  sortOrder: number
  isActive: boolean
}

export interface MenuItem {
  id: string
  businessUnitId: string
  name: string
  description?: string
  price: number
  categoryId: string
  type: ItemType
  prepTime?: number
  isAvailable: boolean
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

export enum ItemType {
  FOOD = "FOOD",
  DRINK = "DRINK",
}

export interface Order {
  id: string
  orderNumber: string
  tableId: string
  waiterId: string
  customerId?: string
  status: OrderStatus
  totalAmount: number
  discountAmount: number
  finalAmount: number
  notes?: string
  customerCount?: number
  isWalkIn: boolean
  walkInName?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  businessUnitId: string
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  READY = "READY",
  SERVED = "SERVED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface OrderItem {
  id: string
  orderId: string
  menuItemId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: OrderItemStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export enum OrderItemStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  SERVED = "SERVED",
  CANCELLED = "CANCELLED",
}

export interface User {
  id: string
  email: string
  username: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  businessUnitId: string
  customerNumber: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  type: CustomerType
  preferences?: Record<string, unknown>
  allergies?: string
  notes?: string
  isActive: boolean
  totalOrders: number
  totalSpent: number
  lastVisit?: Date
  firstVisit: Date
  createdAt: Date
  updatedAt: Date
}

export enum CustomerType {
  WALK_IN = "WALK_IN",
  REGULAR = "REGULAR",
  VIP = "VIP",
}

// Extended types for the POS system
export interface CartItem extends OrderItem {
  menuItem: MenuItem
}

export interface TableWithOrders extends Table {
  currentOrder?: Order
}
