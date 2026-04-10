/**
 * Authentication module
 *
 * Server-side: import { auth, Session, User } from "@/lib/core/auth/server"
 * Client-side: import { signIn, signOut, useSession } from "@/lib/core/auth/client"
 */

export { auth, type Session, type User } from "./server";
