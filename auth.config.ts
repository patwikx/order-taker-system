import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { LoginSchema } from "@/lib/validations/login-schema";
import { getUserByUsername } from "@/lib/auth-actions/auth-users";

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { username, passwordHash } = validatedFields.data;
          const user = await getUserByUsername(username);

          // UPDATED: Check for 'passwordHash' instead of 'password'
          if (!user || !user.passwordHash) return null;

          // UPDATED: Compare against 'passwordHash' instead of 'password'
          const passwordsMatch = await bcryptjs.compare(
            passwordHash,
            user.passwordHash
          );
          
          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;