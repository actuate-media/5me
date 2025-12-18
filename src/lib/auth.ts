import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import prisma from '@/lib/prisma';
import type { UserRole } from '@/types';

// Superadmin email (hardcoded)
const SUPERADMIN_EMAIL = 'strategize@actuatemedia.com';

// Function to get or create user and return role
async function getOrCreateUserRole(email: string, name?: string | null, avatar?: string | null): Promise<UserRole> {
  const normalizedEmail = email.toLowerCase();
  
  // Superadmin is always superadmin
  const role: UserRole = normalizedEmail === SUPERADMIN_EMAIL ? 'SUPERADMIN' : 'USER';
  
  // Split name into first/last
  const nameParts = name?.split(' ') || [];
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  try {
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        lastLoginAt: new Date(),
        avatar: avatar || undefined,
      },
      create: {
        email: normalizedEmail,
        firstName,
        lastName,
        role,
        avatar,
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    return user.role as UserRole;
  } catch (error) {
    console.error('Database error in getOrCreateUserRole:', error);
    // Fallback: return based on email check
    return normalizedEmail === SUPERADMIN_EMAIL ? 'SUPERADMIN' : 'USER';
  }
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
        const isAllowed = profile?.email?.endsWith('@actuatemedia.com') ?? false;
        
        if (isAllowed && profile?.email) {
          // Check if user is active in database
          try {
            const user = await prisma.user.findUnique({
              where: { email: profile.email.toLowerCase() },
              select: { isActive: true },
            });
            
            // If user exists and is inactive, deny login
            if (user && !user.isActive) {
              return false;
            }
          } catch (error) {
            console.error('Database error checking user status:', error);
            // Allow login on DB error (fail open for new users)
          }
        }
        
        return isAllowed;
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
    async jwt({ token, account, profile, trigger }) {
      // Persist the OAuth access_token and role to the token
      if (account) {
        token.accessToken = account.access_token;
      }
      
      // On sign in, get/create user and fetch role from database
      if (profile?.email && (account || trigger === 'signIn')) {
        token.role = await getOrCreateUserRole(
          profile.email, 
          profile.name, 
          profile.picture || profile.image
        );
      } else if (token.email && !token.role) {
        // Fallback for existing sessions without role
        token.role = token.email.toLowerCase() === SUPERADMIN_EMAIL ? 'SUPERADMIN' : 'USER';
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
