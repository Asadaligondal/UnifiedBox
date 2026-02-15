"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/inbox");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Unified Inbox</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-cyan-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:border-cyan-500 outline-none"
              required
              minLength={isRegister ? 8 : 1}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition"
          >
            {isRegister ? "Register" : "Log in"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="mt-4 text-sm text-slate-400 hover:text-slate-300"
        >
          {isRegister ? "Already have an account? Log in" : "Need an account? Register"}
        </button>
        <Link href="/" className="block mt-4 text-sm text-cyan-400 hover:underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
