import { createContext } from 'react';
import type { AuthUser } from './api/auth.api';

export type AuthContextValue = {
  ready: boolean;
  authenticated: boolean;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
