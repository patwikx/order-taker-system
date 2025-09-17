'use client'

import React from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  LogOut, 
  Bell, 
  MoreHorizontal,
} from 'lucide-react'
import { useCurrentUser } from '@/lib/current-user'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserProfileLogout() {
  const user = useCurrentUser()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
    router.push('/')
  }

  const handleNotifications = () => {
    router.push('/notifications')
  }

  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.trim().split(' ')
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`
      }
      return user.name.charAt(0)
    }
    return 'U'
  }

  const getUserDisplayName = () => {
    return user?.name || 'User'
  }

  const getUserEmail = () => {
    return user?.email || 'user@example.com'
  }

  // Get user's current business unit and role for display
  const getCurrentAssignment = () => {
    if (user?.assignments && user.assignments.length > 0) {
      // For now, return the first active assignment
      // You might want to add logic to select a "current" assignment
      const activeAssignment = user.assignments.find(a => a.isActive) || user.assignments[0]
      return activeAssignment
    }
    return null
  }

  const getSecondaryInfo = () => {
    const assignment = getCurrentAssignment()
    if (assignment) {
      return `${assignment.businessUnit.name}`
    }
    return getUserEmail()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 px-3 py-2 justify-start gap-3 bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-900 shadow-sm"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-semibold text-gray-900 truncate w-full">
              {getUserDisplayName()}
            </span>
            <span className="text-xs text-gray-500 truncate w-full">
              {getSecondaryInfo()}
            </span>
          </div>

          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-56 bg-white border-gray-200 shadow-lg"
        align="start"
        side="top"
      >
        <DropdownMenuItem 
          onClick={handleNotifications}
          className="cursor-pointer text-gray-900 focus:bg-gray-100 focus:text-gray-900"
        >
          <Bell className="w-4 h-4 mr-3 text-gray-500" />
          <span className="text-sm font-medium">Notifications</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-200" />

        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-3 text-red-600" />
          <span className="text-sm font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserProfileLogout