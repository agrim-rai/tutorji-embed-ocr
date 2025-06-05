import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** MongoDB Object ID for the user */
      id: string;
      /** User's remaining credits */
      credits: number;
      /** User's role */
      role?: string;
    } & DefaultSession["user"];
  }
} 