"use client";

import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { mockLogin, ROLE_REDIRECTS } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("chef@smartpos.vn");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await mockLogin({ email, password });

    if (!result.ok) {
      setError(result.message);
      setIsLoading(false);
      return;
    }

    router.push(ROLE_REDIRECTS[result.user.role]);
  };

  return (
    <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200">
          <LockKeyhole size={28} aria-hidden="true" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
          Smart POS & KDS
        </p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900">Đăng nhập</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
            Tên đăng nhập / Email
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
            <UserRound size={18} className="text-slate-400" aria-hidden="true" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@smartpos.vn"
              className="w-full border-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
            Mật khẩu
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100">
            <LockKeyhole size={18} className="text-slate-400" aria-hidden="true" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full border-0 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          {!isLoading ? <ArrowRight size={18} aria-hidden="true" /> : null}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-semibold text-slate-700">Tài khoản demo:</p>
        <div className="mt-2 space-y-1">
          <p>chef@smartpos.vn / 123456</p>
          <p>cashier@smartpos.vn / 123456</p>
          <p>manager@smartpos.vn / 123456</p>
          <p>waiter@smartpos.vn / 123456</p>
        </div>
      </div>
    </div>
  );
}
