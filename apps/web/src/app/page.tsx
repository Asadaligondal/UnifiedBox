import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">Unified Inbox</h1>
      <p className="text-slate-400 mb-8">Aggregate replies from Instantly and PlusVibe</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
        >
          Log in
        </Link>
        <Link
          href="/inbox"
          className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition"
        >
          Inbox
        </Link>
        <Link
          href="/analytics"
          className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
        >
          Analytics
        </Link>
      </div>
    </main>
  );
}
