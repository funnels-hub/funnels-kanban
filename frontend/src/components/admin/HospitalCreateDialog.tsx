import { useState } from "react";
import { api } from "@/lib/api-client";
import { useDialog } from "@/contexts/DialogContext";
import type { Hospital } from "@/types/hospitals";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function HospitalCreateDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { closeDialog } = useDialog();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post<Hospital>("/api/admin/hospitals", { name: name.trim(), email: email.trim(), password });
      onSuccess?.();
      closeDialog();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "오류";
      if (msg.includes("EMAIL_TAKEN")) setError("이미 사용 중인 이메일입니다");
      else setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dlg" style={{ minWidth: 360, maxWidth: 480 }}>
      <div className="dlg-title">새 병원 계정 생성</div>
      <form onSubmit={handleSubmit} className="dlg-body space-y-3">
        <div>
          <label className="block text-sm mb-1">병원명</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className="block text-sm mb-1">이메일</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">비밀번호 (4자 이상)</label>
          <Input type="password" minLength={4} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-sm text-destructive">{error}</div>}
        <div className="dlg-actions flex gap-2 justify-end pt-2">
          <Button type="button" onClick={closeDialog}>취소</Button>
          <Button type="submit" variant="primary" disabled={submitting}>{submitting ? "생성 중…" : "생성"}</Button>
        </div>
      </form>
    </div>
  );
}
