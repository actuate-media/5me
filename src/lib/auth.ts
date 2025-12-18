import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { UserRole } from '@/types';

// Superadmin email (hardcoded)
const SUPERADMIN_EMAIL = 'strategize@actuatemedia.com';

// In-memory user store (replace with database later)
// This will be populated when users sign in
const userRoles: Record<string, UserRole> = {
  [SUPERADMIN_EMAIL]: 'SUPERADMIN',
};

// Function to get or create user role
function getUserRole(email: string): UserRole {
  const normalizedEmail = email.toLowerCase();
  
  // Superadmin is always superadmin
  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return 'SUPERADMIN';
  }
  
  // Return stored role or default to USER
  return userRoles[normalizedEmail] || 'USER';
}

// Export function to update user role (for admin use)
export function setUserRole(email: string, role: UserRole): void {
  const normalizedEmail = email.toLowerCase();
  
  // Cannot change superadmin's role
  if (normalizedEmail === SUPERADMIN_EMAIL) {
    return;
  }
  
  userRoles[normalizedEmail] = role;
}

// Export function to get all users with roles
export function getAllUserRoles(): Record<string, UserRole> {
  return { ...userRoles };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          hd: 'actuatemedia.com', // Restrict to Actuate Media domain
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Only allow users with @actuatemedia.com email
      if (account?.provider === 'google') {
        return profile?.email?.endsWith('@actuatemedia.com') ?? false;
      }
      return true;
    },
    async session({ session, token }) {
      // Add user ID and role to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and role to the token
      if (account) {
        token.accessToken = account.access_token;
      }
      
      // Set role based on email
      if (profile?.email) {
        token.role = getUserRole(profile.email);
      } else if (token.email) {
        token.role = getUserRole(token.email as string);
      }
      
      return token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
