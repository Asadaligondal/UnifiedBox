"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { api } from "@/lib/api";

interface Connection {
  id: string;
  platform: string;
  workspaceId: string | null;
  organizationId: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [platform, setPlatform] = useState<"INSTANTLY" | "PLUSVIBE">("INSTANTLY");
  const [apiKey, setApiKey] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api<Connection[]>("/api/platform/connections")
      .then(setConnections)
      .catch(() => setConnections([]));
  }, []);

  async function handleAddConnection() {
    if (!apiKey.trim()) return;
    setAdding(true);
    try {
      await api("/api/platform/connections", {
        method: "POST",
        body: JSON.stringify({
          platform,
          apiKey: apiKey.trim(),
          workspaceId: workspaceId.trim() || undefined,
        }),
      });
      setApiKey("");
      setWorkspaceId("");
      const list = await api<Connection[]>("/api/platform/connections");
      setConnections(list);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await api(`/api/platform/connections/${id}`, { method: "DELETE" });
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove");
    }
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="max-w-xl space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">Platform connections</h2>
          <div className="space-y-3 mb-4">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "INSTANTLY" | "PLUSVIBE")}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
            >
              <option value="INSTANTLY">Instantly</option>
              <option value="PLUSVIBE">PlusVibe</option>
            </select>
            <input
              type="password"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
            />
            <input
              placeholder={platform === "PLUSVIBE" ? "Workspace ID (required)" : "Workspace/Org ID (optional)"}
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700"
            />
            <button
              onClick={handleAddConnection}
              disabled={adding || !apiKey.trim()}
              className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add connection"}
            </button>
          </div>
          <ul className="space-y-2">
            {connections.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between p-3 rounded bg-slate-800 border border-slate-700"
              >
                <span>
                  {c.platform}
                  {c.workspaceId && (
                    <span className="text-slate-500 text-sm ml-2">({c.workspaceId})</span>
                  )}
                </span>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2">Webhook URLs</h2>
          <p className="text-sm text-slate-500 mb-2">
            Configure these URLs in your Instantly and PlusVibe dashboard to receive real-time
            replies.
          </p>
          <div className="space-y-2 text-sm font-mono bg-slate-900 p-3 rounded">
            <div>
              <span className="text-slate-500">Instantly:</span>{" "}
              {(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")}/api/webhooks/instantly
            </div>
            <div>
              <span className="text-slate-500">PlusVibe:</span>{" "}
              {(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")}/api/webhooks/plusvibe
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
