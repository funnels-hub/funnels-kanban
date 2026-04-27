import { useState } from "react";
import { api } from "@/lib/api-client";
import { useDialog } from "@/contexts/DialogContext";
import type { Hospital } from "@/types/hospitals";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function HospitalEditDialog({ hospital, onSuccess }: { hospital: Hospital; onSuccess?: () => void }) {
  const { closeDialog } = useDialog();
  const [name, setName] = useState(hospital.name);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const updates: Record<string, any> = {};
    if (name.trim() && name !== hospital.name) updates.name = name.trim();
    if (password) updates.password = password;
    try {
      if (Object.keys(updates).length > 0) {
        await api.patch<Hospital>(`/api/admin/hospitals/${hospital.id}`, updates);
        onSuccess?.();
      }
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dlg" style={{ minWidth: 360, maxWidth: 480 }}>
      <div className="dlg-title">병원 정보 수정</div>
      <form onSubmit={handleSubmit} className="dlg-body space-y-3">
        <div>
          <label className="block text-sm mb-1">이메일</label>
          <Input value={hospital.email} disabled readOnly />
        </div>
        <div>
          <label className="block text-sm mb-1">병원명</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="block text-sm mb-1">새 비밀번호 (변경 시에만 입력)</label>
          <Input type="password" minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="변경하지 않으려면 비워두세요" />
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <div className="dlg-actions flex gap-2 justify-end pt-2">
          <Button type="button" onClick={closeDialog}>취소</Button>
          <Button type="submit" variant="primary" disabled={submitting}>{submitting ? "저장 중…" : "저장"}</Button>
        </div>
      </form>
    </div>
  );
}
