import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { status, isAuthenticated, isAdmin } = useAuth();
  if (status === "idle" || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">로딩 중…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
