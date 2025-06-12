import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

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
    async signIn({ user }) {
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
        return true; // allowed
      }

      // 3) not on the list → redirect to error page
      return "/auth/error?error=NotAllowed";
    },

    async jwt({ token, user, account }) {
      if (user && account) {
        token.userId = user.id;
        token.credits = user.credits ?? 25;
        token.role = user.role ?? "user";
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
