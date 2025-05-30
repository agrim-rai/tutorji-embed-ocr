"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Authentication provider component that wraps the app with NextAuth SessionProvider
 * This makes the session available throughout the application
 */
export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
} 