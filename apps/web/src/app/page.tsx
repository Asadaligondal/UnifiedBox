import Link from "next/link";
import { RedirectToInbox } from "./RedirectToInbox";

export default function HomePage() {
  return (
    <>
    <RedirectToInbox />
    <main className="min-h-screen flex flex-col bg-[#fafafa]">
      <header className="border-b border-[rgba(55,53,47,0.09)] bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-[17px] font-semibold text-[#37352f]">Unified Inbox</span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-md text-[14px] text-[#6b6b6b] hover:bg-[rgba(55,53,47,0.08)] hover:text-[#37352f] transition"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-md bg-[#2383e2] hover:bg-[#0d6bcc] text-white text-[14px] font-medium transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 max-w-3xl text-[#37352f] leading-tight">
          One inbox for all your{" "}
          <span className="text-[#2383e2]">Instantly & PlusVibe</span> replies
        </h1>
        <p className="text-[#6b6b6b] text-lg text-center mb-12 max-w-2xl">
          Aggregate campaign replies, send responses from the correct mailbox,
          and use AI to draft replies. Built for sales teams.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-md bg-[#2383e2] hover:bg-[#0d6bcc] text-white font-medium transition"
          >
            Start free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-md border border-[rgba(55,53,47,0.2)] hover:bg-[rgba(55,53,47,0.08)] text-[#37352f] font-medium transition"
          >
            Log in
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="p-6 rounded-lg bg-white border border-[rgba(55,53,47,0.09)] shadow-sm">
            <h3 className="font-semibold mb-2 text-[#37352f]">Unified Inbox</h3>
            <p className="text-[#6b6b6b] text-[14px] leading-relaxed">
              All replies from Instantly and PlusVibe in one place. Filter by campaign, status, and platform.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-white border border-[rgba(55,53,47,0.09)] shadow-sm">
            <h3 className="font-semibold mb-2 text-[#37352f]">AI Drafts</h3>
            <p className="text-[#6b6b6b] text-[14px] leading-relaxed">
              Generate reply suggestions from conversation history and lead context. Edit before sending.
            </p>
          </div>
          <div className="p-6 rounded-lg bg-white border border-[rgba(55,53,47,0.09)] shadow-sm">
            <h3 className="font-semibold mb-2 text-[#37352f]">Team Workflows</h3>
            <p className="text-[#6b6b6b] text-[14px] leading-relaxed">
              Labels, assignments, notes, and analytics. Built for multi-user sales teams.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[rgba(55,53,47,0.09)] bg-white py-5 px-6">
        <div className="max-w-6xl mx-auto flex justify-between text-[13px] text-[#9b9a97]">
          <span>Unified Inbox</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#37352f] transition">Terms</a>
            <a href="#" className="hover:text-[#37352f] transition">Privacy</a>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
