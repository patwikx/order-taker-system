"use client"

import type React from "react"
import { useState } from "react"
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
  Clock,
  TrendingUp,
  Package,
  BookOpen,
  Sparkles,
  Menu,
  Shield,
  Key,
  Database,
  LogOut,
  User,
  Bell,
  X,
  ChevronsUp,
  ChevronsDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import type { BusinessUnitItem } from "@/types/business-unit-types"
import BusinessUnitSwitcher from "./business-unit-swticher"

export interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
  roles?: string[]
  badge?: string
}

const getNavigation = (kitchenOrderCount?: number, barOrderCount?: number): NavItem[] => [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    badge: (kitchenOrderCount || 0) + (barOrderCount || 0) > 0 ? String((kitchenOrderCount || 0) + (barOrderCount || 0)) : undefined,
    children: [
      { title: "Active Orders", href: "/orders/active", icon: ClipboardList, roles: ["WAITER", "MANAGER", "CASHIER"] },
      { title: "Order History", href: "/orders/history", icon: Clock, roles: ["MANAGER", "CASHIER"] },
      { title: "Kitchen Orders", href: "/kitchen", icon: ChefHat, roles: ["KITCHEN_STAFF", "MANAGER"], badge: kitchenOrderCount && kitchenOrderCount > 0 ? String(kitchenOrderCount) : undefined },
      { title: "Bar Orders", href: "/bar", icon: Coffee, roles: ["BAR_STAFF", "MANAGER"], badge: barOrderCount && barOrderCount > 0 ? String(barOrderCount) : undefined },
    ],
  },
  {
    title: "Tables",
    icon: Utensils,
    children: [
      { title: "Table Management", href: "/admin/tables", icon: Utensils, roles: ["WAITER", "MANAGER"] },
      { title: "Reservations", href: "/reservations", icon: Calendar, roles: ["WAITER", "MANAGER"] },
      { title: "Walk-ins", href: "/customers/walkins", icon: Users, roles: ["WAITER", "MANAGER"] },
    ],
  },
  {
    title: "Menu",
    icon: BookOpen,
    children: [
      { title: "Menu Items", href: "/menu/menu-items", icon: Package, roles: ["MANAGER"] },
      { title: "Categories", href: "/menu/categories", icon: FileText, roles: ["MANAGER"] },
      { title: "Pricing", href: "/menu/pricing", icon: TrendingUp, roles: ["MANAGER"] },
      { title: "Specials", href: "/menu/specials", icon: Sparkles, roles: ["MANAGER"] },
    ],
  },
  {
    title: "Admin",
    icon: Settings,
    children: [
      { title: "Business Units", href: "/business-units", icon: Building2, roles: ["MANAGER"] },
      { title: "Staff", href: "/admin/users", icon: Users, roles: ["MANAGER"] },
      { title: "Roles", href: "/admin/roles", icon: Shield, roles: ["MANAGER"] },
      { title: "Permissions", href: "/admin/permissions", icon: Key, roles: ["MANAGER"] },
      { title: "Customers", href: "/admin/customers", icon: Users, roles: ["MANAGER"] },
      { title: "Audit Logs", href: "/admin/audit-logs", icon: Database, roles: ["MANAGER"] },
      { title: "Settings", href: "/admin/settings", icon: Settings, roles: ["MANAGER"] },
    ],
  },
]

interface HeaderProps {
  businessUnitId: string
  businessUnits: BusinessUnitItem[]
  isAdmin: boolean
  userRole: string
  userName?: string
  userEmail?: string
  userAvatar?: string
  onLogout?: () => void
  kitchenOrderCount?: number
  barOrderCount?: number
}

function hasAccess(item: NavItem, userRole: string, isAdmin: boolean): boolean {
  if (isAdmin) return true
  if (!item.roles) return true
  return item.roles.includes(userRole)
}

function UserNav({ userName, userEmail, userAvatar, onLogout }: Pick<HeaderProps, "userName" | "userEmail" | "userAvatar" | "onLogout">) {
  const initials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-background" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Avatar className="h-7 w-7">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="text-[10px] font-medium">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <div className="flex items-start gap-3 p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail || ""}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DesktopNav({ businessUnitId, userRole, isAdmin, kitchenOrderCount, barOrderCount }: Pick<HeaderProps, "businessUnitId" | "userRole" | "isAdmin" | "kitchenOrderCount" | "barOrderCount">) {
  const pathname = usePathname()
  const navigation = getNavigation(kitchenOrderCount, barOrderCount)

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {navigation.map((item) => {
        if (!hasAccess(item, userRole, isAdmin)) return null

        const href = item.href ? `/${businessUnitId}${item.href}` : ""
        const isActive = pathname === href || (item.children && item.children.some((child) => {
          const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
          return pathname.startsWith(childHref) && childHref !== `/${businessUnitId}/`
        }))

        if (item.children) {
          const accessibleChildren = item.children.filter((child) => hasAccess(child, userRole, isAdmin))
          if (accessibleChildren.length === 0) return null

          return (
            <DropdownMenu key={item.title}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2.5 gap-1.5 text-sm font-medium relative",
                    isActive && "bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge variant="destructive" className="h-4 px-1 text-[10px] font-medium ml-0.5">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {accessibleChildren.map((child) => {
                  const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
                  const isChildActive = pathname === childHref

                  return (
                    <DropdownMenuItem key={child.title} asChild>
                      <Link
                        href={childHref}
                        className={cn(
                          "gap-2 cursor-pointer",
                          isChildActive && "bg-accent"
                        )}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.title}</span>
                        {child.badge && (
                          <Badge variant="destructive" className="h-4 px-1.5 text-[10px] ml-auto">
                            {child.badge}
                          </Badge>
                        )}
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
            key={item.title}
            asChild
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2.5 gap-1.5 text-sm font-medium",
              isActive && "bg-accent"
            )}
          >
            <Link href={href}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}

function MobileNav({ businessUnitId, businessUnits, isAdmin, userRole, userName, userEmail, userAvatar, onLogout, kitchenOrderCount, barOrderCount }: HeaderProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const navigation = getNavigation(kitchenOrderCount, barOrderCount)

  const initials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail || ""}</p>
              </div>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>

          <div className="p-3 border-b">
            <BusinessUnitSwitcher items={businessUnits} />
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navigation.map((item) => {
              if (!hasAccess(item, userRole, isAdmin)) return null

              const href = item.href ? `/${businessUnitId}${item.href}` : ""
              const isActive = pathname === href

              if (item.children) {
                const accessibleChildren = item.children.filter((child) => hasAccess(child, userRole, isAdmin))
                if (accessibleChildren.length === 0) return null

                const hasActiveChild = accessibleChildren.some((child) => {
                  const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
                  return pathname === childHref
                })

                return (
                  <div key={item.title} className="space-y-1">
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md",
                      hasActiveChild && "text-accent-foreground"
                    )}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="h-4 px-1.5 text-[10px] ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="ml-6 space-y-0.5">
                      {accessibleChildren.map((child) => {
                        const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
                        const isChildActive = pathname === childHref

                        return (
                          <Link
                            key={child.title}
                            href={childHref}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                              isChildActive ? "bg-accent font-medium" : "hover:bg-accent/50"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            <span>{child.title}</span>
                            {child.badge && (
                              <Badge variant="destructive" className="h-4 px-1.5 text-[10px] ml-auto">
                                {child.badge}
                              </Badge>
                            )}
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
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                    isActive ? "bg-accent font-medium" : "hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-2 h-9" size="sm">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 h-9" size="sm">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 text-red-600 hover:text-red-600 hover:bg-red-50" 
              size="sm"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Header({ businessUnitId, businessUnits, isAdmin, userRole, userName, userEmail, userAvatar, onLogout, kitchenOrderCount, barOrderCount }: HeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="relative">
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 w-full border-b bg-background transition-transform duration-300",
          isCollapsed && "-translate-y-full"
        )}
      >
        <div className="flex h-12 items-center gap-3 px-4 lg:px-6">
          <MobileNav
            businessUnitId={businessUnitId}
            businessUnits={businessUnits}
            isAdmin={isAdmin}
            userRole={userRole}
            userName={userName}
            userEmail={userEmail}
            userAvatar={userAvatar}
            onLogout={onLogout}
            kitchenOrderCount={kitchenOrderCount}
            barOrderCount={barOrderCount}
          />

          <div className="hidden md:block w-56 shrink-0">
            <BusinessUnitSwitcher items={businessUnits} />
          </div>

          <div className="flex-1 min-w-0">
            <DesktopNav
              businessUnitId={businessUnitId}
              userRole={userRole}
              isAdmin={isAdmin}
              kitchenOrderCount={kitchenOrderCount}
              barOrderCount={barOrderCount}
            />
          </div>

          <div className="shrink-0">
            <UserNav 
              userName={userName}
              userEmail={userEmail}
              userAvatar={userAvatar}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>

      {/* Spacer to prevent content jumping */}
      {!isCollapsed && <div className="h-12" />}

      {/* Collapse/Expand Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "fixed z-[60] h-8 w-8 rounded-full shadow-lg border-2 bg-background transition-all duration-300 hover:scale-110",
          isCollapsed ? "top-2 right-4" : "top-14 right-4"
        )}
      >
        {isCollapsed ? (
          <ChevronsDown className="h-4 w-4" />
        ) : (
          <ChevronsUp className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

export { Header as Sidebar }