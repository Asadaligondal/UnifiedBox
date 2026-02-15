"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "./Footer";

const nav = [
  { href: "/inbox", label: "Inbox" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
      <aside className="w-56 border-r border-[rgba(55,53,47,0.09)] bg-[#f7f6f3] p-4 flex flex-col">
        <Link href="/inbox" className="text-[15px] font-semibold text-[#37352f] hover:opacity-80 transition">
          Unified Inbox
        </Link>
        <nav className="mt-6 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-[14px] transition ${
                pathname === item.href
                  ? "bg-[rgba(55,53,47,0.08)] text-[#37352f] font-medium"
                  : "text-[#6b6b6b] hover:bg-[rgba(55,53,47,0.08)] hover:text-[#37352f]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-[rgba(55,53,47,0.09)]">
          {user && (
            <p className="text-[12px] text-[#9b9a97] truncate mb-2" title={user.email}>
              {user.email}
            </p>
          )}
          <button
            onClick={logout}
            className="block text-[13px] text-[#6b6b6b] hover:text-[#37352f] transition"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 flex flex-col bg-[#fafafa] min-h-screen">
        {children}
        <Footer />
      </main>
      </div>
    </div>
  );
}
