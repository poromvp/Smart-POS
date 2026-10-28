import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#140e0a] px-4 py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(251,146,60,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,146,60,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-orange-500/20 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-10 right-1/4 h-[350px] w-[350px] rounded-full bg-amber-500/15 blur-[100px]" />
      <LoginForm />
    </main>
  );
}