"use client";

import { createContext, type ReactNode, useContext } from "react";

interface AuthSeed {
  isAuthenticated: boolean;
  isGuest: boolean;
  userId: string | null;
  userName: string | null;
  userImage: string | null;
  userEmail: string | null;
}

const AuthContext = createContext<AuthSeed | null>(null);

export function AuthProvider({
  session,
  children,
}: {
  session: AuthSeed | null;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
  );
}

export function useAuthSeed() {
  return useContext(AuthContext);
}

export type { AuthSeed };
