"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_42%)]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 text-center text-white md:px-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100 backdrop-blur-sm">
          Smart POS & KDS
        </div>

        <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight md:text-6xl">
          Chào mừng đến với Smart POS & KDS
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-200 md:text-xl">
          Hệ thống quản lý nhà hàng hiện đại cho trải nghiệm đặt món, phục vụ,
          bếp và thu ngân trong một nền tảng thống nhất.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/menu")}
            className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400"
          >
            Khách hàng - Xem Menu
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-white/40 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
          >
            Đăng nhập nội bộ
          </button>
        </div>
      </section>
    </main>
  );
}
