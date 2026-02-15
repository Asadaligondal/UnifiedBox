import { PrismaClient } from "@prisma/client";
import type { InstantlyWebhookPayload, PlusVibeWebhookPayload } from "../types.js";

const prisma = new PrismaClient();

async function processInstantlyWebhook(payload: InstantlyWebhookPayload) {
  const emailId = payload.email_id;
  const leadEmail = payload.lead_email;
  const campaignId = payload.campaign_id;
  const campaignName = payload.campaign_name;
  const replyText = payload.reply_text || "";
  const replyHtml = payload.reply_html || replyText;
  const replySubject = payload.reply_subject || "Re:";
  const emailAccount = payload.email_account;
  const workspace = payload.workspace;

  if (!leadEmail || !campaignId || !emailId || !workspace) return;

  let workspaceRecord = await prisma.workspace.findFirst({
    where: { externalId: workspace },
  });
  if (!workspaceRecord) {
    workspaceRecord = await prisma.workspace.create({
      data: { externalId: workspace, name: `Workspace ${workspace.slice(0, 8)}` },
    });
  }

  const lead = await prisma.lead.upsert({
    where: {
      email_workspaceId_sourcePlatform: {
        email: leadEmail,
        workspaceId: workspaceRecord.id,
        sourcePlatform: "INSTANTLY",
      },
    },
    create: {
      email: leadEmail,
      workspaceId: workspaceRecord.id,
      sourcePlatform: "INSTANTLY",
      externalLeadId: undefined,
    },
    update: {},
  });

  const threadId = `instantly-${emailId}-${lead.id}`;
  const conversation = await prisma.conversation.upsert({
    where: {
      platform_externalThreadId: { platform: "INSTANTLY", externalThreadId: threadId },
    },
    create: {
      leadId: lead.id,
      platform: "INSTANTLY",
      externalThreadId: threadId,
      campaignId,
      campaignName,
      lastMessageAt: new Date(),
    },
    update: { lastMessageAt: new Date(), campaignName: campaignName || undefined },
  });

  await prisma.message.upsert({
    where: {
      platform_externalMessageId: { platform: "INSTANTLY", externalMessageId: emailId },
    },
    create: {
      conversationId: conversation.id,
      platform: "INSTANTLY",
      externalMessageId: emailId,
      direction: "IN",
      subject: replySubject,
      bodyText: replyText,
      bodyHtml: replyHtml,
      fromEmail: leadEmail,
      toEmail: emailAccount || "",
      sentAt: new Date(),
      metadata: { eaccount: emailAccount },
    },
    update: {},
  });
}

async function processPlusVibeWebhook(payload: PlusVibeWebhookPayload) {
  const {
    workspace_id,
    campaign_id,
    campaign_name,
    thread_id,
    last_email_id,
    lead_id,
    from_email,
    subject,
    body,
    text_body,
    email_account_name,
    email_account_id,
  } = payload;

  if (!from_email || !thread_id || !last_email_id || !workspace_id) return;

  let workspaceRecord = await prisma.workspace.findFirst({
    where: { externalId: workspace_id },
  });
  if (!workspaceRecord) {
    workspaceRecord = await prisma.workspace.create({
      data: { externalId: workspace_id, name: payload.workspace_name || `Workspace ${workspace_id.slice(0, 8)}` },
    });
  }

  const lead = await prisma.lead.upsert({
    where: {
      email_workspaceId_sourcePlatform: {
        email: from_email,
        workspaceId: workspaceRecord.id,
        sourcePlatform: "PLUSVIBE",
      },
    },
    create: {
      email: from_email,
      workspaceId: workspaceRecord.id,
      sourcePlatform: "PLUSVIBE",
      externalLeadId: lead_id,
      firstName: payload.first_name,
      lastName: payload.last_name,
      companyName: payload.company_name,
    },
    update: {
      firstName: payload.first_name,
      lastName: payload.last_name,
      companyName: payload.company_name,
    },
  });

  const externalThreadId = `plusvibe-${thread_id}`;
  const conversation = await prisma.conversation.upsert({
    where: {
      platform_externalThreadId: { platform: "PLUSVIBE", externalThreadId },
    },
    create: {
      leadId: lead.id,
      platform: "PLUSVIBE",
      externalThreadId,
      campaignId: campaign_id || undefined,
      campaignName: (campaign_name as string) || undefined,
      lastMessageAt: new Date(),
    },
    update: { lastMessageAt: new Date(), campaignName: campaign_name || undefined },
  });

  await prisma.message.upsert({
    where: {
      platform_externalMessageId: { platform: "PLUSVIBE", externalMessageId: last_email_id },
    },
    create: {
      conversationId: conversation.id,
      platform: "PLUSVIBE",
      externalMessageId: last_email_id,
      direction: "IN",
      subject: subject || "Re:",
      bodyText: text_body || body || "",
      bodyHtml: body || text_body || "",
      fromEmail: from_email,
      toEmail: email_account_name || "",
      sentAt: new Date((payload.modified_at || payload.created_at || Date.now()) as string | number),
      metadata: { email_account_id, to_email: email_account_name },
    },
    update: {},
  });
}

export async function processWebhookJob(
  platform: string,
  payload: InstantlyWebhookPayload | PlusVibeWebhookPayload
) {
  if (platform === "instantly") {
    await processInstantlyWebhook(payload as InstantlyWebhookPayload);
  } else if (platform === "plusvibe") {
    await processPlusVibeWebhook(payload as PlusVibeWebhookPayload);
  }
}
