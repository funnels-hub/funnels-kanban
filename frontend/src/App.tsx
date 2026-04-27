import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { DateProvider } from "@/contexts/DateContext";
import { BoardProvider } from "@/contexts/BoardContext";
import { SelectionProvider } from "@/contexts/SelectionContext";
import { TemplateProvider } from "@/contexts/TemplateContext";
import { HospitalProvider } from "@/contexts/HospitalContext";
import { DialogContainer } from "@/components/ui/DialogContainer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { KanbanPage } from "@/pages/KanbanPage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { LoginPage } from "@/pages/LoginPage";
import { AdminHospitalsPage } from "@/pages/AdminHospitalsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin/hospitals"
              element={
                <AdminRoute>
                  <HospitalProvider>
                    <AdminHospitalsPage />
                  </HospitalProvider>
                </AdminRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DateProvider>
                    <BoardProvider>
                      <SelectionProvider>
                        <KanbanPage />
                      </SelectionProvider>
                    </BoardProvider>
                  </DateProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <DateProvider>
                    <BoardProvider>
                      <TemplateProvider>
                        <TemplatesPage />
                      </TemplateProvider>
                    </BoardProvider>
                  </DateProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
          <DialogContainer />
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
