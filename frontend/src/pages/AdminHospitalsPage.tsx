import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HospitalListView } from "@/components/admin/HospitalListView";

export function AdminHospitalsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <Link to="/" className="dlg-btn flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" /> 칸반
        </Link>
        <h1 className="text-base font-semibold">병원 계정 관리</h1>
        <div className="w-20" />
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <HospitalListView />
      </main>
    </div>
  );
}
