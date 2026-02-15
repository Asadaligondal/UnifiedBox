export type Platform = "INSTANTLY" | "PLUSVIBE";

export type ConversationStatus = "OPEN" | "PENDING" | "CLOSED";

export type MessageDirection = "IN" | "OUT";

export type ReplyStatus = "PENDING" | "SENT" | "FAILED" | "BOUNCED";

export type UserRole = "ADMIN" | "MANAGER" | "SALES_REP";

export interface InstantlyWebhookPayload {
  timestamp: string;
  event_type: string;
  workspace: string;
  campaign_id: string;
  campaign_name: string;
  lead_email?: string;
  email_account?: string;
  unibox_url?: string;
  email_id?: string;
  email_subject?: string;
  reply_text_snippet?: string;
  reply_subject?: string;
  reply_text?: string;
  reply_html?: string;
  [key: string]: unknown;
}

export interface PlusVibeWebhookPayload {
  webhook_id: string;
  webhook_name: string;
  webhook_event: string;
  campaign_name: string;
  workspace_name: string;
  camp_id: string;
  campaign_id: string;
  workspace_id: string;
  thread_id: string;
  last_email_id: string;
  lead_id: string;
  from_email: string;
  subject: string;
  body?: string;
  text_body?: string;
  sentiment?: string;
  message_id?: string;
  references?: string;
  [key: string]: unknown;
}
