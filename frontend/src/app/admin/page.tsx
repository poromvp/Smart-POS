export default function AdminPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl shadow-slate-950/40">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Manager Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-black">Bảng điều khiển quản lý</h1>
        <p className="mt-4 max-w-xl text-slate-300">
          Đây là khu vực dành cho quản lý: doanh thu, nhân sự, tối ưu hoạt động và báo cáo nhà hàng.
        </p>
      </div>
    </main>
  );
}
