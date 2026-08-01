import {
  createElement,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser } from './api/auth.api';
import {
  clearSession,
  getAccessToken,
  getAuthUser,
  isAuthenticated,
  setSession,
  subscribeAuth,
} from './session';
import {
  loginRequest,
  logoutRequest,
  refreshRequest,
} from './api/auth.api';
import { AuthContext, type AuthContextValue } from './auth-context-value';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());
  const [user, setUser] = useState<AuthUser | null>(getAuthUser());

  useEffect(() => {
    const unsubscribe = subscribeAuth(() => {
      setAuthenticated(isAuthenticated());
      setUser(getAuthUser());
    });

    let cancelled = false;

    async function bootstrap() {
      if (getAccessToken()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const tokens = await refreshRequest();
        if (!cancelled) {
          setSession(tokens.accessToken, tokens.user);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function login(username: string, password: string): Promise<void> {
    const tokens = await loginRequest({ username, password });
    setSession(tokens.accessToken, tokens.user);
  }

  async function logout(): Promise<void> {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }

  const value: AuthContextValue = {
    ready,
    authenticated,
    user,
    login,
    logout,
  };

  return createElement(AuthContext.Provider, { value }, children);
}
