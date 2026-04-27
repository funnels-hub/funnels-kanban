import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/contexts/ToastContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { DateProvider } from "@/contexts/DateContext";
import { BoardProvider } from "@/contexts/BoardContext";
import { SelectionProvider } from "@/contexts/SelectionContext";
import { TemplateProvider } from "@/contexts/TemplateContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { DialogContainer } from "@/components/ui/DialogContainer";
import { KanbanPage } from "@/pages/KanbanPage";
import { TemplatesPage } from "@/pages/TemplatesPage";

export default function App() {
  return (
    <ToastProvider>
      <DialogProvider>
        <DateProvider>
          <BoardProvider>
            <SelectionProvider>
              <TemplateProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<KanbanPage />} />
                    <Route path="/templates" element={<TemplatesPage />} />
                  </Routes>
                </BrowserRouter>
                <ToastContainer />
                <DialogContainer />
              </TemplateProvider>
            </SelectionProvider>
          </BoardProvider>
        </DateProvider>
      </DialogProvider>
    </ToastProvider>
  );
}
