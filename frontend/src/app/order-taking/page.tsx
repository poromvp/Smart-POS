export default function OrderTakingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100 px-6 py-12 text-slate-900">
      <div className="w-full max-w-3xl rounded-3xl border border-amber-200 bg-white p-8 shadow-xl shadow-orange-100/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
          Waiter Panel
        </p>
        <h1 className="mt-4 text-4xl font-black">Phục vụ & Ghi nhận đơn</h1>
        <p className="mt-4 max-w-xl text-slate-600">
          Đây là giao diện cho nhân viên phục vụ theo dõi bàn, ghi đơn và cập nhật trạng thái phục vụ.
        </p>
      </div>
    </main>
  );
}
