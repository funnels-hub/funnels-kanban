import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TemplateListView } from "@/components/templates/TemplateListView";
import { TemplateEditView } from "@/components/templates/TemplateEditView";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import type { Template } from "@/types/templates";

export function TemplatesPage() {
  const [editing, setEditing] = useState<Template | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-2 border-b">
        <Link to="/" className="dlg-btn flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Link>
        <h1 className="text-base font-semibold">컬럼 템플릿 관리</h1>
        <DarkModeToggle />
      </header>
      <main className="max-w-3xl mx-auto p-6">
        {editing ? (
          <TemplateEditView template={editing} onBack={() => setEditing(null)} />
        ) : (
          <TemplateListView onSelectEdit={(tpl) => setEditing(tpl)} />
        )}
      </main>
    </div>
  );
}
