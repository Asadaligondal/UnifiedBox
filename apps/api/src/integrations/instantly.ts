import type { PlatformConnection, Message } from "@prisma/client";

const BASE = process.env.INSTANTLY_API_BASE || "https://api.instantly.ai";

function decryptApiKey(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf8");
}

export async function listEmails(apiKey: string, params?: { campaign_id?: string; limit?: number }) {
  const url = new URL(`${BASE}/api/v2/emails`);
  if (params?.campaign_id) url.searchParams.set("campaign_id", params.campaign_id);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Instantly API error: ${res.status}`);
  const json = (await res.json()) as unknown;
  return (Array.isArray(json) ? json : (json as { data?: unknown[]; results?: unknown[] }).data || (json as { data?: unknown[]; results?: unknown[] }).results || []) as object[];
}

export async function getEmail(apiKey: string, emailId: string) {
  const res = await fetch(`${BASE}/api/v2/emails/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Instantly API error: ${res.status}`);
  return res.json();
}

export async function sendReplyViaInstantly(
  connection: PlatformConnection,
  message: Message & { metadata?: { eaccount?: string } | null },
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = decryptApiKey(connection.apiKeyEncrypted);
  const eaccount = (message.metadata as { eaccount?: string })?.eaccount;
  if (!eaccount) {
    return { success: false, error: "No eaccount (mailbox) found for this message" };
  }
  try {
    const res = await fetch(`${BASE}/api/v2/emails/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        reply_to_uuid: message.externalMessageId,
        eaccount,
        subject,
        body: { html: body, text: body.replace(/<[^>]*>/g, "") },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: err || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
