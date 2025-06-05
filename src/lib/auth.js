/**
 * NextAuth Authentication Options
 * 
 * Centralized configuration for NextAuth.js authentication.
 * This allows sharing the same configuration between API routes and server components.
 */

import GoogleProvider from 'next-auth/providers/google';

/**
 * Authentication options for NextAuth
 * 
 * These options are used across the application to maintain consistent 
 * authentication behavior.
 */
export const authOptions = {
  // Configure authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  
  // Define custom pages for auth flows
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  // Callback functions to handle auth events
  callbacks: {
    /**
     * JWT callback - Executed when JWT is created/updated
     * 
     * Adds user ID and other custom data to the JWT token
     * 
     * @param {Object} params - Parameters containing token, user, and account
     * @returns {Promise<Object>} Modified token with additional data
     */
    async jwt({ token, user, account }) {
      // If this is a sign-in, user and account will be defined
      if (account && user) {
        token.userId = user.id;
        token.credits = user.credits || 25;
        token.role = user.role || 'user';
      }
      return token;
    },
    
    /**
     * Session callback - Called whenever a session is checked
     * 
     * Adds user data from token to the session object for client use
     * 
     * @param {Object} params - Parameters containing session and token
     * @returns {Promise<Object>} Enhanced session object with user data
     */
    async session({ session, token }) {
      // Add user ID, credits, and role to the session
      if (token.userId) {
        session.user.id = token.userId;
        session.user.credits = token.credits;
        session.user.role = token.role;
      }
      
      return session;
    },
  },
  
  // Secret used to encrypt cookies and tokens
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development',
}; 