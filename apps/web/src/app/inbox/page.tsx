"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { api } from "@/lib/api";

interface Conversation {
  id: string;
  campaignName: string | null;
  status: string;
  platform: string;
  lastMessageAt: string | null;
  lead: { email: string; firstName: string | null; lastName: string | null };
  labels: { label: string }[];
  messages?: { id: string; direction: string; subject: string; bodyText?: string | null; bodyHtml?: string | null; fromEmail: string; toEmail?: string; sentAt: string }[] | { subject: string; contentPreview?: string }[];
}

interface ConversationDetailData extends Omit<Conversation, "messages"> {
  messages?: { id: string; direction: string; subject: string; bodyText?: string | null; bodyHtml?: string | null; fromEmail: string; toEmail?: string; sentAt: string }[];
  notes?: { content: string; user?: { name: string | null } }[];
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailData | null>(null);
  const [filters, setFilters] = useState({ campaignId: "", status: "", platform: "" });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      await api("/api/sync/run", { method: "POST" });
      const params = new URLSearchParams();
      if (filters.campaignId) params.set("campaignId", filters.campaignId);
      if (filters.status) params.set("status", filters.status);
      if (filters.platform) params.set("platform", filters.platform);
      const list = await api<Conversation[]>(`/api/conversations?${params}`);
      setConversations(list);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.campaignId) params.set("campaignId", filters.campaignId);
    if (filters.status) params.set("status", filters.status);
    if (filters.platform) params.set("platform", filters.platform);
    api<Conversation[]>(`/api/conversations?${params}`)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [filters.campaignId, filters.status, filters.platform]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    api<ConversationDetailData>(`/api/conversations/${selected}`)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selected]);

  const refetchDetail = () => {
    if (selected) {
      api<ConversationDetailData>(`/api/conversations/${selected}`)
        .then(setDetail)
        .catch(() => setDetail(null));
    }
  };

  return (
    <AppLayout>
      <div className="flex gap-4 h-[calc(100vh-6rem)]">
        <div className="w-80 flex flex-col border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm"
            >
              {syncing ? "Syncing..." : "Sync from platforms"}
            </button>
            <input
              placeholder="Filter by campaign..."
              value={filters.campaignId}
              onChange={(e) => setFilters((f) => ({ ...f, campaignId: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              value={filters.platform}
              onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
            >
              <option value="">All platforms</option>
              <option value="INSTANTLY">Instantly</option>
              <option value="PLUSVIBE">PlusVibe</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-slate-500">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-slate-500">No conversations</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left p-4 border-b border-slate-800 hover:bg-slate-800/50 transition ${
                    selected === c.id ? "bg-slate-800" : ""
                  }`}
                >
                  <div className="font-medium truncate">
                    {c.lead.firstName || c.lead.lastName
                      ? `${c.lead.firstName || ""} ${c.lead.lastName || ""}`.trim()
                      : c.lead.email}
                  </div>
                  <div className="text-sm text-slate-500 truncate">
                    {c.campaignName || c.lead.email}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700">
                      {c.platform}
                    </span>
                    {c.labels.map((l) => (
                      <span
                        key={l.label}
                        className="text-xs px-1.5 py-0.5 rounded bg-cyan-900/50"
                      >
                        {l.label}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          {detail ? (
            <ConversationDetail conversation={detail} onUpdate={refetchDetail} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatusSelect({
  conversationId,
  status,
  onUpdate,
}: {
  conversationId: string;
  status: string;
  onUpdate: () => void;
}) {
  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    try {
      await api(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: e.target.value }),
      });
      onUpdate();
    } catch {}
  }
  return (
    <select
      value={status}
      onChange={handleChange}
      className="text-xs px-2 py-1 rounded bg-slate-700 border-0 cursor-pointer"
    >
      <option value="OPEN">Open</option>
      <option value="PENDING">Pending</option>
      <option value="CLOSED">Closed</option>
    </select>
  );
}

function LabelButtons({
  conversationId,
  labels,
  onUpdate,
}: {
  conversationId: string;
  labels: { label: string }[];
  onUpdate: () => void;
}) {
  const presetLabels = ["INTERESTED", "NOT_INTERESTED", "FOLLOW_UP", "WRONG_PERSON"];
  async function toggle(label: string) {
    const has = labels.some((l) => l.label === label);
    try {
      if (has) {
        await api(`/api/conversations/${conversationId}/labels/${encodeURIComponent(label)}`, {
          method: "DELETE",
        });
      } else {
        await api(`/api/conversations/${conversationId}/labels`, {
          method: "POST",
          body: JSON.stringify({ label }),
        });
      }
      onUpdate();
    } catch {}
  }
  return (
    <>
      {presetLabels.map((l) => (
        <button
          key={l}
          onClick={() => toggle(l)}
          className={`text-xs px-2 py-1 rounded cursor-pointer ${
            labels.some((x) => x.label === l) ? "bg-cyan-700" : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          {l.replace("_", " ")}
        </button>
      ))}
    </>
  );
}

function ConversationDetail({ conversation, onUpdate }: { conversation: ConversationDetailData; onUpdate: () => void }) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [note, setNote] = useState("");

  async function handleSendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api("/api/replies/send", {
        method: "POST",
        body: JSON.stringify({
          conversationId: conversation.id,
          body: reply,
        }),
      });
      setReply("");
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleGenerateAi() {
    setAiLoading(true);
    try {
      const { draft } = await api<{ draft: string }>("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      setReply(draft);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAddNote() {
    if (!note.trim()) return;
    try {
      await api("/api/conversations/" + conversation.id + "/notes", {
        method: "POST",
        body: JSON.stringify({ content: note }),
      });
      setNote("");
      onUpdate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add note");
    }
  }

  const messages = (conversation.messages || []) as { id: string; direction: string; subject: string; bodyText?: string | null; bodyHtml?: string | null; fromEmail: string; toEmail?: string; sentAt: string }[];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-semibold">
          {conversation.lead.firstName || conversation.lead.lastName
            ? `${conversation.lead.firstName || ""} ${conversation.lead.lastName || ""}`.trim()
            : conversation.lead.email}
        </h2>
        <p className="text-sm text-slate-500">{conversation.lead.email}</p>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <span className="text-xs px-2 py-1 rounded bg-slate-700">{conversation.platform}</span>
          <StatusSelect conversationId={conversation.id} status={conversation.status} onUpdate={onUpdate} />
          {conversation.campaignName && (
            <span className="text-xs px-2 py-1 rounded bg-cyan-900/50">
              {conversation.campaignName}
            </span>
          )}
          <LabelButtons conversationId={conversation.id} labels={(conversation as { labels?: { label: string }[] }).labels || []} onUpdate={onUpdate} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${
              m.direction === "IN" ? "bg-slate-800/50 ml-0" : "bg-cyan-900/20 mr-0 ml-8"
            }`}
          >
            <div className="text-xs text-slate-500 mb-1">
              {m.fromEmail} • {new Date(m.sentAt).toLocaleString()}
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {(m.bodyText || m.bodyHtml || "").slice(0, 500)}
            </div>
          </div>
        ))}
        {(conversation.notes || []).map((n, i) => (
          <div key={i} className="p-3 rounded-lg bg-amber-900/20 border border-amber-800/30">
            <div className="text-xs text-amber-600">{n.user?.name || "Note"}</div>
            <div className="text-sm">{n.content}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAi}
            disabled={aiLoading}
            className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-sm disabled:opacity-50"
          >
            {aiLoading ? "Generating..." : "Generate AI draft"}
          </button>
        </div>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your reply..."
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 min-h-[80px] resize-y"
          rows={4}
        />
        <button
          onClick={handleSendReply}
          disabled={sending || !reply.trim()}
          className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send reply"}
        </button>
        <div className="flex gap-2 mt-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add internal note..."
            className="flex-1 px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm"
          />
          <button
            onClick={handleAddNote}
            disabled={!note.trim()}
            className="px-3 py-2 rounded bg-amber-800/50 hover:bg-amber-800 disabled:opacity-50 text-sm"
          >
            Add note
          </button>
        </div>
      </div>
    </div>
  );
}
