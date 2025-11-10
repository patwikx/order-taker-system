import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import type { BusinessUnitItem } from '@/types/business-unit-types';
import { prisma } from '@/lib/prisma';
import "../globals.css";
import { Toaster } from 'sonner';
import { BusinessUnitProvider } from '@/context/business-unit-context';
import { Header } from '@/components/header';
import { getActiveOrderCounts } from '@/lib/actions/kitchen-actions';

export const metadata = {
  title: "Tropicana Worldwide Corp.",
  description: "Hotel Management & CMS for TWC",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers();
  const businessUnitId = headersList.get("x-business-unit-id");
  const session = await auth();

  // Redirect to sign-in if there's no session or user
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Check if user account is active
  if (!session.user.isActive) {
    redirect("/auth/sign-in?error=AccountDeactivated");
  }

  // If no business unit is in the URL, redirect to the user's first assigned unit
  if (!businessUnitId) {
    const defaultUnitId = session.user.assignments[0]?.businessUnitId;
    redirect(defaultUnitId ? `/${defaultUnitId}` : "/select-unit");
  }

  // --- PERMISSION CHECKS UPDATED FOR NEW SCHEMA ---

  // A user is an admin if they have the 'SUPER_ADMIN' role in ANY of their assignments.
  // You might want to adjust this role name based on what you actually use in your system
  const isAdmin = session.user.assignments.some(
    (assignment) => assignment.role.name === 'admin' || assignment.role.name === 'ADMIN'
  );

  // A user is authorized if their assignments include the current business unit ID and the assignment is active.
  const isAuthorizedForUnit = session.user.assignments.some(
    (assignment) => 
      assignment.businessUnitId === businessUnitId && 
      assignment.isActive
  );

  // If the user is neither an admin nor authorized for the requested unit, redirect them.
  if (!isAdmin && !isAuthorizedForUnit) {
    const defaultUnitId = session.user.assignments.find(a => a.isActive)?.businessUnitId;
    redirect(defaultUnitId ? `/${defaultUnitId}` : "/select-unit");
  }

  let businessUnits: BusinessUnitItem[] = [];

  // If the user is an admin, fetch all business units from the database.
  if (isAdmin) {
    businessUnits = await prisma.businessUnit.findMany({
      where: { isActive: true }, // Only get active business units
      orderBy: { name: "asc" }, // Order by name since displayName doesn't exist in schema
      select: {
        id: true,
        code: true, // Include code from schema
        name: true,
      },
    });
  } else {
    // Otherwise, just list the business units they are assigned to from the session.
    // Filter to only active assignments
    businessUnits = session.user.assignments
      .filter(assignment => assignment.isActive)
      .map((assignment) => ({
        id: assignment.businessUnit.id,
        code: assignment.businessUnit.code, // Include code from schema
        name: assignment.businessUnit.name,
      }));
  }

  // Get the user's role in the current business unit
  const currentAssignment = session.user.assignments.find(
    assignment => assignment.businessUnitId === businessUnitId && assignment.isActive
  );
  
  // Default to the first active assignment if current business unit assignment not found
  const userRole = currentAssignment?.role.name || 
                   session.user.assignments.find(a => a.isActive)?.role.name || 
                   'GUEST';

  // Get active order counts for navigation badges
  const orderCounts = await getActiveOrderCounts(businessUnitId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed at top */}
      <Header 
        businessUnitId={businessUnitId} 
        businessUnits={businessUnits}
        isAdmin={isAdmin}
        userRole={userRole}
        kitchenOrderCount={orderCounts.kitchenOrders}
        barOrderCount={orderCounts.barOrders}
      />

      {/* Main Content Area */}
      <main> {/* Add top padding to account for fixed header */}
        <div className="mx-auto h-full">
          <BusinessUnitProvider businessUnitId={businessUnitId}>
            {children}
          </BusinessUnitProvider>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}