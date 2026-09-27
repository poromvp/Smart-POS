import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_50%,#f8fafc_100%)] px-4 py-12">
      <LoginForm />
    </main>
  );
}
