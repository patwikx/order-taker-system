
"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Users,
  FileText,
  Settings,
  ChefHat,
  Utensils,
  Coffee,
  Calendar,
  ShoppingCart,
  ClipboardList,
  LayoutDashboard,
  ChevronDown,
  UserSearch as UserStar,
  Clock,
  TrendingUp,
  Package,
  BookOpen,
  Sparkles,
  Menu,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import type { BusinessUnitItem } from "@/types/business-unit-types"
import BusinessUnitSwitcher from "./business-unit-swticher"
import UserProfileLogout from "./user-profile-logout"

// Navigation item interface
export interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
  roles?: string[]
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orders Management",
    icon: ShoppingCart,
    children: [
      { title: "Active Orders", href: "/orders/active", icon: ClipboardList, roles: ["WAITER", "MANAGER", "CASHIER"] },
      { title: "Order History", href: "/orders/history", icon: Clock, roles: ["MANAGER", "CASHIER"] },
      { title: "Kitchen Orders", href: "/kitchen", icon: ChefHat, roles: ["KITCHEN_STAFF", "MANAGER"] },
      { title: "Bar Orders", href: "/bar", icon: Coffee, roles: ["BAR_STAFF", "MANAGER"] },
    ],
  },
  {
    title: "Tables & Service",
    icon: Utensils,
    children: [
      { title: "Table Management", href: "/admin/tables", icon: Utensils, roles: ["WAITER", "MANAGER"] },
      { title: "Reservations", href: "/reservations", icon: Calendar, roles: ["WAITER", "MANAGER"] },
      { title: "Customer Walk-ins", href: "/customers/walkins", icon: Users, roles: ["WAITER", "MANAGER"] },
    ],
  },
  {
    title: "Menu Management",
    icon: BookOpen,
    children: [
      { title: "Menu Items", href: "/menu/menu-items", icon: Package, roles: ["MANAGER"] },
      { title: "Categories", href: "/menu/categories", icon: FileText, roles: ["MANAGER"] },
      { title: "Pricing", href: "/menu/pricing", icon: TrendingUp, roles: ["MANAGER"] },
      { title: "Specials", href: "/menu/specials", icon: Sparkles, roles: ["MANAGER"] },
    ],
  },
  {
    title: "Customer Management",
    icon: Users,
    children: [
      { title: "All Customers", href: "/customers", icon: Users, roles: ["MANAGER", "CASHIER"] },
      { title: "Regular Customers", href: "/customers/regular", icon: UserStar, roles: ["MANAGER", "CASHIER"] },
      { title: "Customer Preferences", href: "/customers/preferences", icon: FileText, roles: ["MANAGER"] },
    ],
  },
  // {
  //  title: "Payments & Billing",
  //  icon: CreditCard,
  //  children: [
  //    { title: "Process Payments", href: "/payments", icon: CreditCard, roles: ["CASHIER", "MANAGER"] },
  //    { title: "Daily Sales", href: "/payments/daily", icon: Receipt, roles: ["MANAGER", "CASHIER"] },
  //    { title: "Payment History", href: "/payments/history", icon: Clock, roles: ["MANAGER"] },
  //  ],
  // },

  // {
  //   title: "Reports & Analytics",
  //   icon: BarChart3,
  //   children: [
  //     { title: "Sales Reports", href: "/reports/sales", icon: TrendingUp, roles: ["MANAGER"] },
  //     { title: "Menu Analytics", href: "/reports/menu", icon: PieChart, roles: ["MANAGER"] },
  //     { title: "Customer Analytics", href: "/reports/customers", icon: Users, roles: ["MANAGER"] },
  //     { title: "Kitchen Performance", href: "/reports/kitchen", icon: ChefHat, roles: ["MANAGER"] },
  //   ],
  //},
  {
    title: "Administration",
    icon: Settings,
    children: [
      { title: "Business Units", href: "/business-units", icon: Building2, roles: ["MANAGER"] },
      { title: "Staff Management", href: "/staff", icon: Users, roles: ["MANAGER"] },
      { title: "System Settings", href: "/settings", icon: Settings, roles: ["MANAGER"] },
      { title: "Audit Logs", href: "/audit", icon: FileText, roles: ["MANAGER"] },
    ],
  },
]

// Component prop interfaces
interface HeaderProps {
  businessUnitId: string
  businessUnits: BusinessUnitItem[]
  isAdmin: boolean
  userRole: string
}

// Helper function to check if user has access to a nav item
function hasAccess(item: NavItem, userRole: string, isAdmin: boolean): boolean {
  if (isAdmin) return true
  if (!item.roles) return true
  return item.roles.includes(userRole)
}

// Desktop Navigation Item Component
function DesktopNavItem({
  item,
  businessUnitId,
  userRole,
  isAdmin,
}: {
  item: NavItem
  businessUnitId: string
  userRole: string
  isAdmin: boolean
}) {
  const pathname = usePathname()

  if (!hasAccess(item, userRole, isAdmin)) {
    return null
  }

  const href = item.href ? `/${businessUnitId}${item.href}` : ""
  const isActive =
    pathname === href ||
    (item.children &&
      item.children.some((child) => {
        const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
        return pathname.startsWith(childHref)
      }))

  if (item.children) {
    const accessibleChildren = item.children.filter((child) => hasAccess(child, userRole, isAdmin))

    if (accessibleChildren.length === 0) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "h-10 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1",
              isActive && "text-blue-600 bg-blue-50",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          {accessibleChildren.map((child) => {
            const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
            const isChildActive = pathname === childHref

            return (
              <DropdownMenuItem key={child.title} asChild>
                <Link
                  href={childHref}
                  className={cn("flex items-center gap-2 w-full", isChildActive && "bg-blue-50 text-blue-600")}
                >
                  <child.icon className="h-4 w-4" />
                  {child.title}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-10 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2",
        isActive && "text-blue-600 bg-blue-50",
      )}
    >
      <Link href={href}>
        <item.icon className="h-4 w-4" />
        {item.title}
      </Link>
    </Button>
  )
}

// Mobile Navigation Component
function MobileNav({ businessUnitId, businessUnits, isAdmin, userRole }: HeaderProps) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <BusinessUnitSwitcher items={businessUnits} />
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-4">
              {navigation.map((item) => {
                if (!hasAccess(item, userRole, isAdmin)) return null

                const href = item.href ? `/${businessUnitId}${item.href}` : ""
                const isActive = pathname === href

                if (item.children) {
                  const accessibleChildren = item.children.filter((child) => hasAccess(child, userRole, isAdmin))
                  if (accessibleChildren.length === 0) return null

                  return (
                    <div key={item.title} className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-900">
                        <item.icon className="h-4 w-4" />
                        {item.title}
                      </div>
                      <div className="ml-6 space-y-1">
                        {accessibleChildren.map((child) => {
                          const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
                          const isChildActive = pathname === childHref

                          return (
                            <Link
                              key={child.title}
                              href={childHref}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                isChildActive
                                  ? "bg-blue-100 text-blue-700 font-medium"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                              )}
                            >
                              <child.icon className="h-4 w-4" />
                              {child.title}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={item.title}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t">
            <UserProfileLogout />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Main Header Component
export function Header({ businessUnitId, businessUnits, isAdmin, userRole }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="flex h-16 items-center px-4">
        {/* Mobile menu */}
        <MobileNav
          businessUnitId={businessUnitId}
          businessUnits={businessUnits}
          isAdmin={isAdmin}
          userRole={userRole}
        />

        {/* Business Unit Switcher - Desktop */}
        <div className="hidden md:block">
          <BusinessUnitSwitcher items={businessUnits} />
        </div>

        {/* Main Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-1 ml-8">
          {navigation.map((item) => (
            <DesktopNavItem
              key={item.title}
              item={item}
              businessUnitId={businessUnitId}
              userRole={userRole}
              isAdmin={isAdmin}
            />
          ))}
        </nav>

        {/* Right side - User profile */}
        <div className="ml-auto">
          <UserProfileLogout />
        </div>
      </div>
    </header>
  )
}

export { Header as Sidebar }
