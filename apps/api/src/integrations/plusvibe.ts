import type { PlatformConnection, Message } from "@prisma/client";

const BASE = process.env.PLUSVIBE_API_BASE || "https://api.plusvibe.ai/api/v1";

function decryptApiKey(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf8");
}

export async function listEmails(
  apiKey: string,
  workspaceId: string,
  params?: { campaign_id?: string; lead?: string; label?: string; page_trail?: string }
) {
  const url = new URL(`${BASE}/unibox/emails`);
  url.searchParams.set("workspace_id", workspaceId);
  if (params?.campaign_id) url.searchParams.set("campaign_id", params.campaign_id);
  if (params?.lead) url.searchParams.set("lead", params.lead);
  if (params?.label) url.searchParams.set("label", params.label);
  if (params?.page_trail) url.searchParams.set("page_trail", params.page_trail);
  const res = await fetch(url.toString(), {
    headers: { "x-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`PlusVibe API error: ${res.status}`);
  return res.json();
}

export async function sendReplyViaPlusVibe(
  connection: PlatformConnection,
  message: Message,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = decryptApiKey(connection.apiKeyEncrypted);
  const workspaceId = connection.workspaceId;
  if (!workspaceId) return { success: false, error: "No workspace_id configured for PlusVibe" };

  const toEmail = message.direction === "IN" ? message.fromEmail : message.toEmail;
  const fromEmail = message.direction === "IN" ? message.toEmail : message.fromEmail;

  try {
    const url = new URL(`${BASE}/unibox/emails/reply`);
    url.searchParams.set("workspace_id", workspaceId);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        reply_to_id: message.externalMessageId,
        subject,
        from: fromEmail,
        to: toEmail,
        body,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as { message?: string }).message || `HTTP ${res.status}` };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
