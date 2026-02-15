"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { api } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

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
  const toast = useToast();
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
      toast.error(e instanceof Error ? e.message : "Sync failed");
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
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        <div className="w-80 flex flex-col bg-white border border-[rgba(55,53,47,0.09)] rounded-lg overflow-hidden shadow-sm">
          <div className="p-3 border-b border-[rgba(55,53,47,0.09)] space-y-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-2.5 rounded-md bg-[#2383e2] hover:bg-[#0d6bcc] disabled:opacity-50 text-[14px] font-medium text-white transition"
            >
              {syncing ? "Syncing..." : "Sync from platforms"}
            </button>
            <input
              placeholder="Filter by campaign..."
              value={filters.campaignId}
              onChange={(e) => setFilters((f) => ({ ...f, campaignId: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] outline-none transition bg-white"
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              value={filters.platform}
              onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}
              className="w-full px-3 py-2 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] outline-none transition bg-white"
            >
              <option value="">All platforms</option>
              <option value="INSTANTLY">Instantly</option>
              <option value="PLUSVIBE">PlusVibe</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-md bg-[rgba(55,53,47,0.06)] animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[#6b6b6b] mb-2 text-[14px]">No conversations yet</p>
                <p className="text-[13px] text-[#9b9a97] mb-4">
                  Add platform connections in Settings, then sync or run <code className="text-xs bg-[rgba(55,53,47,0.08)] px-1.5 py-0.5 rounded">npm run seed:demo</code>
                </p>
                <a href="/settings" className="text-[#2383e2] hover:underline text-[14px]">
                  Go to Settings
                </a>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left p-4 border-b border-[rgba(55,53,47,0.06)] hover:bg-[rgba(55,53,47,0.04)] transition ${
                    selected === c.id ? "bg-[rgba(55,53,47,0.08)]" : ""
                  }`}
                >
                  <div className="font-medium truncate text-[14px] text-[#37352f]">
                    {c.lead.firstName || c.lead.lastName
                      ? `${c.lead.firstName || ""} ${c.lead.lastName || ""}`.trim()
                      : c.lead.email}
                  </div>
                  <div className="text-[13px] text-[#6b6b6b] truncate">
                    {c.campaignName || c.lead.email}
                  </div>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-[rgba(55,53,47,0.08)] text-[#6b6b6b]">
                      {c.platform}
                    </span>
                    {c.labels.map((l) => (
                      <span
                        key={l.label}
                        className="text-[11px] px-1.5 py-0.5 rounded bg-[#e3f2fd] text-[#2383e2]"
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
        <div className="flex-1 border border-[rgba(55,53,47,0.09)] rounded-lg overflow-hidden flex flex-col bg-white shadow-sm">
          {detail ? (
            <ConversationDetail conversation={detail} onUpdate={refetchDetail} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#9b9a97] text-[14px]">
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
      className="text-[12px] px-2 py-1 rounded-md border border-[rgba(55,53,47,0.2)] cursor-pointer bg-white focus:outline-none focus:ring-1 focus:ring-[#2383e2]"
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
          className={`text-[12px] px-2 py-1 rounded-md cursor-pointer transition ${
            labels.some((x) => x.label === l) ? "bg-[#2383e2] text-white" : "bg-[rgba(55,53,47,0.08)] text-[#6b6b6b] hover:bg-[rgba(55,53,47,0.16)]"
          }`}
        >
          {l.replace("_", " ")}
        </button>
      ))}
    </>
  );
}

function ConversationDetail({ conversation, onUpdate }: { conversation: ConversationDetailData; onUpdate: () => void }) {
  const toast = useToast();
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
      toast.success("Reply sent");
      onUpdate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
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
      toast.error(e instanceof Error ? e.message : "Failed to generate");
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
      toast.error(e instanceof Error ? e.message : "Failed to add note");
    }
  }

  const messages = (conversation.messages || []) as { id: string; direction: string; subject: string; bodyText?: string | null; bodyHtml?: string | null; fromEmail: string; toEmail?: string; sentAt: string }[];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[rgba(55,53,47,0.09)]">
        <h2 className="font-semibold text-[#37352f] text-[15px]">
          {conversation.lead.firstName || conversation.lead.lastName
            ? `${conversation.lead.firstName || ""} ${conversation.lead.lastName || ""}`.trim()
            : conversation.lead.email}
        </h2>
        <p className="text-[13px] text-[#6b6b6b]">{conversation.lead.email}</p>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <span className="text-[11px] px-2 py-0.5 rounded bg-[rgba(55,53,47,0.08)] text-[#6b6b6b]">{conversation.platform}</span>
          <StatusSelect conversationId={conversation.id} status={conversation.status} onUpdate={onUpdate} />
          {conversation.campaignName && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#e3f2fd] text-[#2383e2]">
              {conversation.campaignName}
            </span>
          )}
          <LabelButtons conversationId={conversation.id} labels={(conversation as { labels?: { label: string }[] }).labels || []} onUpdate={onUpdate} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fafafa]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-lg ${
              m.direction === "IN" ? "bg-white border border-[rgba(55,53,47,0.09)] ml-0" : "bg-[#e3f2fd] border border-[rgba(35,131,226,0.3)] mr-0 ml-8"
            }`}
          >
            <div className="text-[12px] text-[#9b9a97] mb-1">
              {m.fromEmail} • {new Date(m.sentAt).toLocaleString()}
            </div>
            <div className="text-[14px] whitespace-pre-wrap text-[#37352f] leading-relaxed">
              {(m.bodyText || m.bodyHtml || "").slice(0, 500)}
            </div>
          </div>
        ))}
        {(conversation.notes || []).map((n, i) => (
          <div key={i} className="p-3 rounded-lg bg-[#fff8e6] border border-[rgba(245,193,78,0.4)]">
            <div className="text-[12px] text-[#b8860b]">{n.user?.name || "Note"}</div>
            <div className="text-[14px] text-[#37352f]">{n.content}</div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-[rgba(55,53,47,0.09)] space-y-2 bg-white">
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAi}
            disabled={aiLoading}
            className="px-3 py-2 rounded-md bg-[rgba(55,53,47,0.08)] hover:bg-[rgba(55,53,47,0.16)] text-[14px] text-[#37352f] disabled:opacity-50 transition"
          >
            {aiLoading ? "Generating..." : "Generate AI draft"}
          </button>
        </div>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your reply..."
          className="w-full px-3 py-2.5 rounded-md border border-[rgba(55,53,47,0.2)] min-h-[80px] resize-y text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition"
          rows={4}
        />
        <button
          onClick={handleSendReply}
          disabled={sending || !reply.trim()}
          className="px-4 py-2.5 rounded-md bg-[#2383e2] hover:bg-[#0d6bcc] text-white font-medium text-[14px] disabled:opacity-50 transition"
        >
          {sending ? "Sending..." : "Send reply"}
        </button>
        <div className="flex gap-2 mt-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add internal note..."
            className="flex-1 px-3 py-2 rounded-md border border-[rgba(55,53,47,0.2)] text-[14px] focus:border-[#2383e2] focus:ring-1 focus:ring-[#2383e2] outline-none transition"
          />
          <button
            onClick={handleAddNote}
            disabled={!note.trim()}
            className="px-3 py-2 rounded-md bg-[#fff8e6] hover:bg-[#ffecb3] text-[#b8860b] disabled:opacity-50 text-[14px] font-medium transition"
          >
            Add note
          </button>
        </div>
      </div>
    </div>
  );
}
