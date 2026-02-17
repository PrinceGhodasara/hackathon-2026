export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-5 text-center shadow-xl">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-100" />
        <p className="mt-3 text-sm text-zinc-400">Loading admin...</p>
      </div>
    </div>
  )
}
