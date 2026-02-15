import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";
import { listEmails as listInstantlyEmails } from "../integrations/instantly.js";
import { listEmails as listPlusVibeEmails } from "../integrations/plusvibe.js";

const prisma = new PrismaClient();
const router = Router();

router.post("/run", async (req: AuthRequest, res) => {
  try {
    const connections = await prisma.platformConnection.findMany({
      where: { userId: req.userId! },
    });
    let processed = 0;

    for (const conn of connections) {
      const apiKey = Buffer.from(conn.apiKeyEncrypted, "base64").toString("utf8");
      if (conn.platform === "INSTANTLY") {
        const emails = await listInstantlyEmails(apiKey, { limit: 50 });
        const emailList = Array.isArray(emails) ? emails : [];
        for (const em of emailList) {
          const e = em as { id?: string; lead?: string; campaign_id?: string; thread_id?: string; organization_id?: string; body?: { text?: string; html?: string }; subject?: string; from_address_email?: string; to_address_email_list?: string; timestamp_email?: string; eaccount?: string };
          if (!e.id || !e.lead) continue;
          const orgId = e.organization_id || "instantly-default";
          const workspace = await prisma.workspace.findFirst({ where: { externalId: orgId } })
            || await prisma.workspace.create({ data: { externalId: orgId, name: "Workspace" } });
          const lead = await prisma.lead.upsert({
            where: { email_workspaceId_sourcePlatform: { email: e.lead, workspaceId: workspace.id, sourcePlatform: "INSTANTLY" } },
            create: { email: e.lead, workspaceId: workspace.id, sourcePlatform: "INSTANTLY" },
            update: {},
          });
          const threadId = `instantly-${e.thread_id || e.id}-${lead.id}`;
          const conv = await prisma.conversation.upsert({
            where: { platform_externalThreadId: { platform: "INSTANTLY", externalThreadId: threadId } },
            create: { leadId: lead.id, platform: "INSTANTLY", externalThreadId: threadId, campaignId: e.campaign_id, lastMessageAt: new Date(e.timestamp_email || Date.now()) },
            update: { lastMessageAt: new Date(e.timestamp_email || Date.now()) },
          });
          await prisma.message.upsert({
            where: { platform_externalMessageId: { platform: "INSTANTLY", externalMessageId: e.id } },
            create: {
              conversationId: conv.id,
              platform: "INSTANTLY",
              externalMessageId: e.id,
              direction: "IN",
              subject: e.subject || "Re:",
              bodyText: e.body?.text,
              bodyHtml: e.body?.html,
              fromEmail: e.from_address_email || e.lead,
              toEmail: e.to_address_email_list || "",
              sentAt: new Date(e.timestamp_email || Date.now()),
              metadata: { eaccount: e.eaccount },
            },
            update: {},
          });
          processed++;
        }
      } else if (conn.platform === "PLUSVIBE" && conn.workspaceId) {
        const data = await listPlusVibeEmails(apiKey, conn.workspaceId, {});
        const emails = (data as { data?: unknown[] }).data || [];
        for (const em of emails) {
          const e = em as { id?: string; lead?: string; lead_id?: string; campaign_id?: string; thread_id?: string; body?: { text?: string; html?: string }; subject?: string; from_address_email?: string; to_address_email_list?: string; timestamp_created?: string; eaccount?: string };
          if (!e.id || !e.lead) continue;
          const workspace = await prisma.workspace.findFirst({ where: { externalId: conn.workspaceId } })
            || await prisma.workspace.create({ data: { externalId: conn.workspaceId!, name: "Workspace" } });
          const lead = await prisma.lead.upsert({
            where: { email_workspaceId_sourcePlatform: { email: e.lead, workspaceId: workspace.id, sourcePlatform: "PLUSVIBE" } },
            create: { email: e.lead, workspaceId: workspace.id, sourcePlatform: "PLUSVIBE", externalLeadId: e.lead_id },
            update: {},
          });
          const threadId = `plusvibe-${e.thread_id || e.id}`;
          const conv = await prisma.conversation.upsert({
            where: { platform_externalThreadId: { platform: "PLUSVIBE", externalThreadId: threadId } },
            create: { leadId: lead.id, platform: "PLUSVIBE", externalThreadId: threadId, campaignId: e.campaign_id, lastMessageAt: new Date(e.timestamp_created || Date.now()) },
            update: { lastMessageAt: new Date(e.timestamp_created || Date.now()) },
          });
          await prisma.message.upsert({
            where: { platform_externalMessageId: { platform: "PLUSVIBE", externalMessageId: e.id } },
            create: {
              conversationId: conv.id,
              platform: "PLUSVIBE",
              externalMessageId: e.id,
              direction: "IN",
              subject: e.subject || "Re:",
              bodyText: e.body?.text,
              bodyHtml: e.body?.html,
              fromEmail: e.from_address_email || e.lead,
              toEmail: e.to_address_email_list || "",
              sentAt: new Date(e.timestamp_created || Date.now()),
              metadata: { to_email: e.to_address_email_list, eaccount: e.eaccount },
            },
            update: {},
          });
          processed++;
        }
      }
    }

    res.json({ success: true, processed });
  } catch (e) {
    console.error("Sync error:", e);
    res.status(500).json({ error: String(e) });
  }
});

export const syncRouter = router;
