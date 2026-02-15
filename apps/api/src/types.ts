export interface InstantlyWebhookPayload {
  timestamp?: string;
  event_type?: string;
  workspace?: string;
  campaign_id?: string;
  campaign_name?: string;
  lead_email?: string;
  email_account?: string;
  email_id?: string;
  reply_text?: string;
  reply_html?: string;
  reply_subject?: string;
  [key: string]: unknown;
}

export interface PlusVibeWebhookPayload {
  webhook_id?: string;
  webhook_event?: string;
  campaign_id?: string;
  workspace_id?: string;
  thread_id?: string;
  last_email_id?: string;
  lead_id?: string;
  from_email?: string;
  subject?: string;
  body?: string;
  text_body?: string;
  modified_at?: string;
  created_at?: string;
  workspace_name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  email_account_name?: string;
  email_account_id?: string;
  [key: string]: unknown;
}
