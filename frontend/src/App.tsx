import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DialogProvider } from "@/contexts/DialogContext";
import { DateProvider } from "@/contexts/DateContext";
import { BoardProvider } from "@/contexts/BoardContext";
import { SelectionProvider } from "@/contexts/SelectionContext";
import { TemplateProvider } from "@/contexts/TemplateContext";
import { DialogContainer } from "@/components/ui/DialogContainer";
import { KanbanPage } from "@/pages/KanbanPage";
import { TemplatesPage } from "@/pages/TemplatesPage";

export default function App() {
  return (
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
              <DialogContainer />
            </TemplateProvider>
          </SelectionProvider>
        </BoardProvider>
      </DateProvider>
    </DialogProvider>
  );
}
