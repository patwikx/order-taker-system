import { create } from 'zustand'
import { ItemType, OrderItemStatus } from '@prisma/client'

export interface CartItem {
  id: string
  menuItem: {
    id: string
    name: string
    description?: string
    price: number
    type: ItemType
    prepTime?: number
    imageUrl?: string
  }
  quantity: number
  status: OrderItemStatus
  estimatedTime: number
  notes?: string
}

export interface OrderState {
  // Current order state
  selectedTableId: string | null
  orderItems: CartItem[]
  customerId?: string
  isWalkIn: boolean
  walkInName?: string
  customerCount?: number
  orderNotes?: string
  
  // UI state
  isSubmittingOrder: boolean
  isClearingOrder: boolean
  addingItemId: string | null
  
  // Actions
  setSelectedTable: (tableId: string) => void
  addToOrder: (menuItem: CartItem['menuItem']) => void
  updateQuantity: (itemId: string, change: number) => void
  removeFromOrder: (itemId: string) => void
  updateItemNotes: (itemId: string, notes: string) => void
  setCustomerInfo: (customerId?: string, isWalkIn?: boolean, walkInName?: string) => void
  setCustomerCount: (count: number) => void
  setOrderNotes: (notes: string) => void
  clearOrder: () => void
  setSubmittingOrder: (isSubmitting: boolean) => void
  setClearingOrder: (isClearing: boolean) => void
  setAddingItemId: (itemId: string | null) => void
  
  // Computed values
  getSubtotal: () => number
  getTax: (taxRate: number) => number
  getTotal: (taxRate: number) => number
  getItemCount: () => number
}

export const useOrderStore = create<OrderState>((set, get) => ({
  // Initial state
  selectedTableId: null,
  orderItems: [],
  customerId: undefined,
  isWalkIn: true,
  walkInName: undefined,
  customerCount: undefined,
  orderNotes: undefined,
  isSubmittingOrder: false,
  isClearingOrder: false,
  addingItemId: null,

  // Actions
  setSelectedTable: (tableId: string) => {
    set({ selectedTableId: tableId })
  },

  addToOrder: (menuItem: CartItem['menuItem']) => {
    set((state) => {
      const existingItem = state.orderItems.find(item => item.id === menuItem.id)
      
      if (existingItem) {
        return {
          orderItems: state.orderItems.map(item =>
            item.id === menuItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        }
      } else {
        const newItem: CartItem = {
          id: menuItem.id,
          menuItem,
          quantity: 1,
          status: OrderItemStatus.PENDING,
          estimatedTime: menuItem.prepTime || 10,
          notes: undefined
        }
        return {
          orderItems: [...state.orderItems, newItem]
        }
      }
    })
  },

  updateQuantity: (itemId: string, change: number) => {
    set((state) => ({
      orderItems: state.orderItems
        .map(item => 
          item.id === itemId 
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter(item => item.quantity > 0)
    }))
  },

  removeFromOrder: (itemId: string) => {
    set((state) => ({
      orderItems: state.orderItems.filter(item => item.id !== itemId)
    }))
  },

  updateItemNotes: (itemId: string, notes: string) => {
    set((state) => ({
      orderItems: state.orderItems.map(item =>
        item.id === itemId ? { ...item, notes } : item
      )
    }))
  },

  setCustomerInfo: (customerId?: string, isWalkIn?: boolean, walkInName?: string) => {
    set({ 
      customerId, 
      isWalkIn: isWalkIn ?? true, 
      walkInName 
    })
  },

  setCustomerCount: (count: number) => {
    set({ customerCount: count })
  },

  setOrderNotes: (notes: string) => {
    set({ orderNotes: notes })
  },

  clearOrder: () => {
    set({
      orderItems: [],
      customerId: undefined,
      isWalkIn: true,
      walkInName: undefined,
      customerCount: undefined,
      orderNotes: undefined
    })
  },

  setSubmittingOrder: (isSubmitting: boolean) => {
    set({ isSubmittingOrder: isSubmitting })
  },

  setClearingOrder: (isClearing: boolean) => {
    set({ isClearingOrder: isClearing })
  },

  setAddingItemId: (itemId: string | null) => {
    set({ addingItemId: itemId })
  },

  // Computed values
  getSubtotal: () => {
    const { orderItems } = get()
    return orderItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0)
  },

  getTax: (taxRate: number) => {
    return get().getSubtotal() * taxRate
  },

  getTotal: (taxRate: number) => {
    const subtotal = get().getSubtotal()
    return subtotal + (subtotal * taxRate)
  },

  getItemCount: () => {
    const { orderItems } = get()
    return orderItems.reduce((count, item) => count + item.quantity, 0)
  }
}))