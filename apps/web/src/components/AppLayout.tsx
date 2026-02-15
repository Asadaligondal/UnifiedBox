"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/inbox", label: "Inbox" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-slate-800 bg-slate-900/50 p-4">
        <Link href="/" className="text-lg font-bold text-cyan-400">
          Unified Inbox
        </Link>
        <nav className="mt-6 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg transition ${
                pathname === item.href
                  ? "bg-cyan-600/20 text-cyan-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("token");
              window.location.href = "/";
            }
          }}
          className="mt-8 block text-sm text-slate-500 hover:text-slate-400"
        >
          Log out
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
