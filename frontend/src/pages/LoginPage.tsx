import { LoginForm } from "@/components/auth/LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-2xl font-bold">치과상담 예약 대시보드</div>
          <div className="text-sm text-muted-foreground mt-1">로그인이 필요합니다</div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
