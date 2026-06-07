import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "권한이 없는 계정이거나 등록되지 않은 사용자입니다. 관리자에게 문의해 주세요.",
  Configuration: "인증 구성에 문제가 있습니다. 관리자에게 문의해 주세요.",
  Verification: "인증에 실패했습니다. 다시 시도해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "로그인 중 오류가 발생했습니다.") : null;

  async function signInWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">VIVAC 운영 콘솔</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            회사 Google 계정으로 로그인해 주세요.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        ) : null}

        <form action={signInWithGoogle}>
          <Button type="submit" className="w-full">
            Google로 로그인
          </Button>
        </form>
      </div>
    </div>
  );
}
