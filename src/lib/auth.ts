import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

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
      // Add user ID to session
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token
      if (account) {
        token.accessToken = account.access_token;
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
