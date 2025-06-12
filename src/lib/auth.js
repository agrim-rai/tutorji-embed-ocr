import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import connectDB from "./mongoose";
import User from "@/models/User";

const WHITELIST_URL = process.env.WHITELIST_URL;

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error", // disallowed users land here
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user?.email?.toLowerCase();
      if (!email) return false; // no email → block

      // 1) fetch your remote whitelist.json
      let allowed;
      try {
        const res = await fetch(WHITELIST_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        allowed = json.allowedEmails.map((e) => e.toLowerCase());
      } catch (err) {
        console.error("Could not fetch whitelist:", err);
        return false; // on fetch failure, you can choose to block or allow
      }

      // 2) check against the fetched list
      if (allowed.includes(email)) {
        // 3) Create or update user in database
        try {
          await connectDB();
          
          const existingUser = await User.findOne({ email });
          if (!existingUser) {
            // Create new user
            const newUser = new User({
              name: user.name,
              email: user.email,
              image: user.image,
              credits: 25, // Default credits for new users
            });
            await newUser.save();
            user.id = newUser._id.toString();
            user.credits = newUser.credits;
            user.role = newUser.role;
          } else {
            // Update existing user info
            existingUser.name = user.name;
            existingUser.image = user.image;
            await existingUser.save();
            user.id = existingUser._id.toString();
            user.credits = existingUser.credits;
            user.role = existingUser.role;
          }
        } catch (error) {
          console.error("Database error during signIn:", error);
          return false;
        }
        
        return true; // allowed
      }

      // 4) not on the list → redirect to error page
      return "/auth/error?error=NotAllowed";
    },

    async jwt({ token, user, account }) {
      if (user && account) {
        token.userId = user.id;
        token.credits = user.credits ?? 25;
        token.role = user.role ?? "user";
      }
      
      // Refresh user data from database on each request to keep credits in sync
      if (token.userId) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.userId);
          if (dbUser) {
            token.credits = dbUser.credits;
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }
      
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId;
        session.user.credits = token.credits;
        session.user.role = token.role;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || "dev-secret",
};
