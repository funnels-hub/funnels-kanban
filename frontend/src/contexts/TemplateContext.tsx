import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { api } from "@/lib/api-client";
import type {
  Template,
  TemplateCreate,
  TemplateUpdate,
} from "@/types/templates";

interface TemplateContextValue {
  templates: Template[];
  status: "idle" | "loading" | "done" | "error";
  error: string | null;
  fetchTemplates: () => Promise<void>;
  createTemplate: (input: TemplateCreate) => Promise<Template>;
  updateTemplate: (id: string, input: TemplateUpdate) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<Template>;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const fetchTemplates = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await api.get<Template[]>("/api/templates");
      setTemplates(data);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  const createTemplate = useCallback(
    async (input: TemplateCreate) => {
      const created = await api.post<Template>("/api/templates", input);
      await fetchTemplates();
      return created;
    },
    [fetchTemplates]
  );

  const updateTemplate = useCallback(
    async (id: string, input: TemplateUpdate) => {
      const updated = await api.patch<Template>(
        `/api/templates/${id}`,
        input
      );
      await fetchTemplates();
      return updated;
    },
    [fetchTemplates]
  );

  const deleteTemplate = useCallback(
    async (id: string) => {
      await api.delete(`/api/templates/${id}`);
      await fetchTemplates();
    },
    [fetchTemplates]
  );

  const duplicateTemplate = useCallback(
    async (id: string) => {
      const dup = await api.post<Template>(
        `/api/templates/${id}/duplicate`
      );
      await fetchTemplates();
      return dup;
    },
    [fetchTemplates]
  );

  useEffect(() => {
    if (statusRef.current === "idle") {
      fetchTemplates();
    }
  }, [fetchTemplates]);

  return (
    <TemplateContext.Provider
      value={{
        templates,
        status,
        error,
        fetchTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates(): TemplateContextValue {
  const ctx = useContext(TemplateContext);
  if (!ctx)
    throw new Error("useTemplates must be used within TemplateProvider");
  return ctx;
}
