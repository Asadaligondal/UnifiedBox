"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

interface Connection {
  id: string;
  platform: string;
  workspaceId: string | null;
  organizationId: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const toast = useToast();
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
      toast.success("Connection added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await api(`/api/platform/connections/${id}`, { method: "DELETE" });
      setConnections((prev) => prev.filter((c) => c.id !== id));
      toast.success("Connection removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    }
  }

  return (
    <AppLayout>
      <h1 className="text-[22px] font-semibold mb-6 text-[#37352f]">Settings</h1>
      <div className="max-w-xl space-y-8">
        <section>
          <h2 className="text-[15px] font-semibold mb-4 text-[#37352f]">Platform connections</h2>
          <div className="space-y-3 mb-4">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as "INSTANTLY" | "PLUSVIBE")}
              className="w-full px-3 py-2.5 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition bg-white"
            >
              <option value="INSTANTLY">Instantly</option>
              <option value="PLUSVIBE">PlusVibe</option>
            </select>
            <input
              type="password"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition"
            />
            <input
              placeholder={platform === "PLUSVIBE" ? "Workspace ID (required)" : "Workspace/Org ID (optional)"}
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition"
            />
            <button
              onClick={handleAddConnection}
              disabled={adding || !apiKey.trim()}
              className="px-4 py-2.5 rounded-md bg-[#2383e2] hover:bg-[#0d6bcc] text-white font-medium text-[14px] disabled:opacity-50 transition"
            >
              {adding ? "Adding..." : "Add connection"}
            </button>
          </div>
          <ul className="space-y-2">
            {connections.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between p-3 rounded-md bg-white border border-[rgba(55,53,47,0.09)] shadow-sm"
              >
                <span className="text-[14px] text-[#37352f]">
                  {c.platform}
                  {c.workspaceId && (
                    <span className="text-[#6b6b6b] text-[13px] ml-2">({c.workspaceId})</span>
                  )}
                </span>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="text-[13px] text-[#eb5757] hover:text-[#c53030] transition"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-[15px] font-semibold mb-2 text-[#37352f]">Webhook URLs</h2>
          <p className="text-[13px] text-[#6b6b6b] mb-2">
            Configure these URLs in your Instantly and PlusVibe dashboard to receive real-time
            replies.
          </p>
          <div className="space-y-2 text-[13px] font-mono bg-[rgba(55,53,47,0.06)] p-4 rounded-md border border-[rgba(55,53,47,0.09)]">
            <div className="text-[#37352f]">
              <span className="text-[#6b6b6b]">Instantly:</span>{" "}
              {(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")}/api/webhooks/instantly
            </div>
            <div className="text-[#37352f]">
              <span className="text-[#6b6b6b]">PlusVibe:</span>{" "}
              {(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")}/api/webhooks/plusvibe
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
