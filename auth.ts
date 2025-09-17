import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"
import type { UserAssignment } from "@/next-auth" // Import the UserAssignment type

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
    signOut: "/auth/sign-in"
  },
  ...authConfig,
  callbacks: {
    async signIn({ user }) {
      if (!user?.id) return false;
      const existingUser = await prisma.user.findUnique({ where: { id: user.id } });
      return existingUser?.isActive === true; // Changed from status to isActive
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const userWithDetails = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          userBusinessUnitRole: { // Updated relation name based on your schema
            include: { 
              role: true, 
              businessUnit: true 
            } 
          },
        },
      });

      if (!userWithDetails) return token;

      const leanAssignments = userWithDetails.userBusinessUnitRole.map((a) => ({
        businessUnitId: a.businessUnitId,
        roleId: a.roleId,
        isActive: a.assignedAt ? true : false, // You might want to add logic for this
        businessUnit: { 
          id: a.businessUnit.id,
          code: a.businessUnit.code, // Added code field
          name: a.businessUnit.name,
        },
        role: { 
          id: a.role.id, 
          name: a.role.name, 
          displayName: a.role.displayName 
        }, 
      }));

      token.id = userWithDetails.id;
      token.name = userWithDetails.name; // Changed from firstName/lastName to single name
      token.isActive = userWithDetails.isActive; // Changed from status to isActive
      token.assignments = leanAssignments;
      
      return token;
    },

    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string; // Now using the single name field
        session.user.isActive = token.isActive as boolean; // Changed from status to isActive
        session.user.assignments = token.assignments as UserAssignment[]; 
      }
      return session;
    },
  },
});