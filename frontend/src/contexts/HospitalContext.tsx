import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api } from "@/lib/api-client";
import type { Hospital, HospitalCreate, HospitalUpdate } from "@/types/hospitals";

type Status = "idle" | "loading" | "done" | "error";

interface HospitalContextValue {
  hospitals: Hospital[];
  status: Status;
  error: string | null;
  fetchHospitals: () => Promise<void>;
  createHospital: (input: HospitalCreate) => Promise<Hospital>;
  updateHospital: (id: string, input: HospitalUpdate) => Promise<Hospital>;
  deleteHospital: (id: string) => Promise<void>;
}

const HospitalContext = createContext<HospitalContextValue | null>(null);

export function HospitalProvider({ children }: { children: ReactNode }) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchHospitals = useCallback(async () => {
    setStatus("loading");
    try {
      const list = await api.get<Hospital[]>("/api/admin/hospitals");
      setHospitals(list);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown");
      setStatus("error");
    }
  }, []);

  const createHospital = async (input: HospitalCreate) => {
    const created = await api.post<Hospital>("/api/admin/hospitals", input);
    await fetchHospitals();
    return created;
  };
  const updateHospital = async (id: string, input: HospitalUpdate) => {
    const updated = await api.patch<Hospital>(`/api/admin/hospitals/${id}`, input);
    await fetchHospitals();
    return updated;
  };
  const deleteHospital = async (id: string) => {
    await api.delete(`/api/admin/hospitals/${id}`);
    await fetchHospitals();
  };

  return (
    <HospitalContext.Provider value={{ hospitals, status, error, fetchHospitals, createHospital, updateHospital, deleteHospital }}>
      {children}
    </HospitalContext.Provider>
  );
}

export function useHospitals(): HospitalContextValue {
  const ctx = useContext(HospitalContext);
  if (!ctx) throw new Error("useHospitals must be inside HospitalProvider");
  return ctx;
}
