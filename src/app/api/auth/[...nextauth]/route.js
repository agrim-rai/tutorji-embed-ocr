/**
 * NextAuth Authentication Configuration
 * 
 * This file configures the authentication system for the Tutorji application
 * using NextAuth.js with Google OAuth provider. It handles user authentication,
 * session management, and database integration.
 * 
 * Features:
 * - Google OAuth authentication
 * - User creation during first login
 * - Session management with user data enrichment
 * - Credits system integration
 * - Secure JWT token handling
 * - Custom login and error pages
 * 
 * @route /api/auth/*
 * @access Public (authentication endpoints)
 */

import NextAuth from 'next-auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

/**
 * NextAuth configuration object
 * 
 * Defines providers, callbacks, and pages for the authentication system
 */
const handler = NextAuth({
  ...authOptions,
  
  // Override callbacks from the auth options to add database integration
  callbacks: {
    ...authOptions.callbacks,
    
    /**
     * JWT callback - Executed when JWT is created/updated
     * 
     * Adds user ID and other custom data to the JWT token
     * 
     * @param {Object} params - Parameters containing token, user, and account
     * @returns {Promise<Object>} Modified token with additional data
     */
    async jwt({ token, user, account }) {
      // If this is a sign-in, find or create the user
      if (account && user) {
        try {
          // Connect to the database
          await dbConnect();
          
          // Find the user by email or create a new one
          let existingUser = await User.findOne({ email: user.email });
          
          if (existingUser) {
            // Update token with existing user data
            token.userId = existingUser._id.toString();
            token.credits = existingUser.credits;
            console.log('User found in database:', existingUser.email);
          } else {
            // Create a new user if not found
            console.log('Creating new user:', user.email);
            const newUser = await User.create({
              email: user.email,
              name: user.name || 'User',
              image: user.image,
              credits: 25, // Default starting credits for new users
            });
            
            // Verify the user was created
            existingUser = await User.findOne({ email: user.email });
            if (!existingUser) {
              console.error('Failed to create user in database');
            } else {
              console.log('New user created successfully:', existingUser._id);
            }
            
            // Add new user data to token
            token.userId = newUser._id.toString();
            token.credits = newUser.credits;
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
        }
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
      // Add user ID and credits to the session
      if (token.userId) {
        session.user.id = token.userId;
        session.user.credits = token.credits;
      }
      
      return session;
    },
  },
});

// Export handler for GET and POST requests
export { handler as GET, handler as POST }; 