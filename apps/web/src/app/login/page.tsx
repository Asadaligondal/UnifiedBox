"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const path = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister
        ? { email, password, name: email.split("@")[0] }
        : { email, password };
      const data = await api<{ token: string }>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setToken(data.token);
      refreshAuth();
      router.push("/inbox");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-[#fafafa]">
      <div className="w-full max-w-[400px] bg-white p-8 rounded-lg border border-[rgba(55,53,47,0.09)] shadow-sm">
        <h1 className="text-[22px] font-semibold mb-6 text-[#37352f]">Unified Inbox</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] text-[#6b6b6b] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#6b6b6b] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition"
              required
              minLength={isRegister ? 8 : 1}
            />
          </div>
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-md bg-[#2383e2] hover:bg-[#0d6bcc] text-white font-medium text-[14px] transition"
          >
            {isRegister ? "Register" : "Log in"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="mt-4 text-[13px] text-[#6b6b6b] hover:text-[#37352f] transition"
        >
          {isRegister ? "Already have an account? Log in" : "Need an account? Register"}
        </button>
        <Link href="/" className="block mt-4 text-[13px] text-[#2383e2] hover:underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
