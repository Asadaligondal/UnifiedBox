import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[rgba(55,53,47,0.09)] mt-auto py-5">
      <div className="flex flex-wrap items-center justify-between gap-4 text-[13px] text-[#9b9a97]">
        <div className="flex items-center gap-5">
          <span className="font-medium text-[#6b6b6b]">Unified Inbox</span>
          <Link href="/" className="hover:text-[#37352f] transition">
            Home
          </Link>
          <Link href="/settings" className="hover:text-[#37352f] transition">
            Settings
          </Link>
        </div>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-[#37352f] transition">Terms</a>
          <a href="#" className="hover:text-[#37352f] transition">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
