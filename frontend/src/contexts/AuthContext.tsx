import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStorage } from "@/lib/api-client";
import type { HospitalPublic, LoginRequest, AuthResponse } from "@/types/auth";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  hospital: HospitalPublic | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [hospital, setHospital] = useState<HospitalPublic | null>(null);

  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }
    setStatus("loading");
    api.get<HospitalPublic>("/api/auth/me")
      .then((h) => {
        setHospital(h);
        setStatus("authenticated");
      })
      .catch(() => {
        tokenStorage.clear();
        setHospital(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = async (input: LoginRequest) => {
    const res = await api.post<AuthResponse>("/api/auth/login", input);
    tokenStorage.set(res.access_token);
    setHospital(res.hospital);
    setStatus("authenticated");
  };

  const logout = () => {
    tokenStorage.clear();
    setHospital(null);
    setStatus("unauthenticated");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{
      status,
      hospital,
      isAuthenticated: status === "authenticated",
      isAdmin: hospital?.is_admin ?? false,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
