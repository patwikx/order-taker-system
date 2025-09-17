'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  User,
  Settings,
  LogOut,
  Home,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';

import { BusinessUnitItem } from '../types/business-unit-types';
import { Sidebar } from './header';


interface AdminLayoutProps {
  children: React.ReactNode;
  businessUnitId: string;
  businessUnits: BusinessUnitItem[];
  isAdmin: boolean;
  userRole: string;
}

// Sidebar dimensions
const DRAWER_WIDTH = 280;

interface BreadcrumbItemType {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const AdminLayoutClient: React.FC<AdminLayoutProps> = ({
  children,
  businessUnitId,
  businessUnits,
  isAdmin,
  userRole,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const generateBreadcrumbs = (): BreadcrumbItemType[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItemType[] = [
      { 
        label: 'Restaurant', 
        href: `/admin/${businessUnitId}`, 
        icon: <Home className="h-4 w-4" /> 
      }
    ];

    // Skip the business unit ID in the URL path for breadcrumbs
    for (let i = 2; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      const href = '/' + pathSegments.slice(0, i + 1).join('/');
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({ label, href });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentBusinessUnit = businessUnits.find(unit => unit.id === businessUnitId);

  const handleLogout = () => {
    router.push('/auth/sign-out');
  };

  const handleSettingsClick = () => {
    router.push(`/admin/${businessUnitId}/settings`);
  };

  const handleProfileClick = () => {
    router.push('/admin/profile');
  };

  const handlePreferencesClick = () => {
    router.push('/admin/preferences');
  };

  const handleNotificationsClick = () => {
    router.push('/admin/notifications');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        businessUnitId={businessUnitId}
        businessUnits={businessUnits}
        isAdmin={isAdmin}
        userRole={userRole}
      />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col bg-gray-50 min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: DRAWER_WIDTH }}
      >
        {/* Top App Bar */}
        <header 
          className="fixed top-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm"
          style={{ width: `calc(100% - ${DRAWER_WIDTH}px)` }}
        >
          <div className="flex justify-between items-center py-3 px-6">
            {/* Breadcrumbs */}
            <div className="flex items-center flex-1">
              {/* Business Unit Name */}
              {currentBusinessUnit && (
                <div className="mr-6">
                  <h1 className="text-lg font-semibold text-gray-900 font-sf-pro">
                    {currentBusinessUnit.name}
                  </h1>
                  {isAdmin && (
                    <p className="text-xs text-gray-500 font-medium">
                      Super Admin
                    </p>
                  )}
                </div>
              )}
              
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.href}>
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="flex items-center gap-1 font-semibold text-gray-900">
                            {crumb.icon}
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href={crumb.href}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 font-medium"
                          >
                            {crumb.icon}
                            {crumb.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator>
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        </BreadcrumbSeparator>
                      )}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:bg-gray-100 hover:text-gray-900 relative"
                  >
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center min-w-[20px] px-1">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <h4 className="font-semibold text-sm text-gray-900">Notifications</h4>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    <DropdownMenuItem className="flex-col items-start p-3 border-b border-gray-50">
                      <div className="w-full">
                        <p className="text-sm font-medium text-gray-900">New order received</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Table 5 ordered Grilled Salmon and Chicken Inasal
                        </p>
                        <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex-col items-start p-3 border-b border-gray-50">
                      <div className="w-full">
                        <p className="text-sm font-medium text-gray-900">Kitchen order ready</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Order #ORD-001 is ready for serving
                        </p>
                        <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem className="flex-col items-start p-3">
                      <div className="w-full">
                        <p className="text-sm font-medium text-gray-900">Low inventory alert</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Grilled Salmon is running low - only 3 portions left
                        </p>
                        <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <Separator />
                  <div className="p-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNotificationsClick}
                      className="text-sm font-medium text-gray-900 hover:text-gray-900 hover:underline"
                    >
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettingsClick}
                className="text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <Settings className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="ml-2 hover:bg-gray-100">
                    <Avatar className="h-9 w-9 bg-gray-900">
                      <AvatarImage src="" alt="User Avatar" />
                      <AvatarFallback className="bg-gray-900 text-white text-sm font-semibold">
                        JD
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900">John Doe</p>
                    <p className="text-xs text-gray-500">admin@doloresgroup.com</p>
                  </div>
                  
                  <DropdownMenuItem onClick={handleProfileClick} className="py-2">
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handlePreferencesClick} className="py-2">
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="py-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 pt-16 p-6 bg-gray-50 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutClient;