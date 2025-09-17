// next-auth.d.ts

import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// Define the structure for a user's role within an assignment
export interface UserAssignmentRole {
  id: string;
  name: string;
  displayName: string;
}

export interface UserAssignmentBusinessUnit {
  id: string;
  code: string; // Added based on your schema
  name: string;
}

// Define the structure of a single assignment
export interface UserAssignment {
  businessUnitId: string;
  roleId: string;
  businessUnit: UserAssignmentBusinessUnit;
  role: UserAssignmentRole;
  isActive: boolean; // Added from UserBusinessUnitRole
}

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      name: string; // Changed from firstName/lastName to single name field
      isActive: boolean; // Added from User model
      assignments: UserAssignment[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and sent to the `Session` callback */
  interface JWT {
    id: string;
    name: string; // Changed from firstName/lastName to single name field
    isActive: boolean; // Added from User model
    assignments: UserAssignment[];
  }
}