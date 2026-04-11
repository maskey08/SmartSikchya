import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/axios";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>; // call after XP-changing actions
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<User>("/auth/login", { email, password });
    setUser(data);
  };

  const register = async (
    full_name: string,
    email: string,
    password: string,
  ) => {
    const { data } = await api.post<User>("/auth/register", {
      full_name,
      email,
      password,
    });
    setUser(data);
  };

  const logout = async () => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
