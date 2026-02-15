import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";
import { sendReplyViaInstantly } from "../integrations/instantly.js";
import { sendReplyViaPlusVibe } from "../integrations/plusvibe.js";

const prisma = new PrismaClient();
const router = Router();

const sendReplySchema = z.object({
  conversationId: z.string(),
  body: z.string(),
  subject: z.string().optional(),
});

router.post("/send", async (req: AuthRequest, res) => {
  try {
    const { conversationId, body, subject } = sendReplySchema.parse(req.body);
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        messages: {
          where: { direction: "IN" },
          orderBy: { sentAt: "desc" },
          take: 1,
        },
      },
    });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const lastMessage = conversation.messages[0];
    if (!lastMessage) return res.status(400).json({ error: "No message to reply to" });

    const connection = await prisma.platformConnection.findFirst({
      where: { userId: req.userId!, platform: conversation.platform },
    });
    if (!connection) return res.status(400).json({ error: "Platform not connected" });

    const replySubject = subject || (lastMessage.subject.startsWith("Re:") ? lastMessage.subject : `Re: ${lastMessage.subject}`);

    let result: { success: boolean; error?: string };
    if (conversation.platform === "INSTANTLY") {
      result = await sendReplyViaInstantly(connection, lastMessage, replySubject, body);
    } else {
      result = await sendReplyViaPlusVibe(connection, lastMessage, replySubject, body);
    }

    if (!result.success) {
      await prisma.outgoingReply.create({
        data: {
          messageId: lastMessage.id,
          conversationId,
          platform: conversation.platform,
          status: "FAILED",
          errorMessage: result.error,
        },
      });
      return res.status(500).json({ error: result.error });
    }

    const outgoing = await prisma.outgoingReply.create({
      data: {
        messageId: lastMessage.id,
        conversationId,
        platform: conversation.platform,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "conversation",
        entityId: conversationId,
        action: "reply_sent",
        userId: req.userId!,
        metadata: { outgoingReplyId: outgoing.id },
      },
    });

    res.json({ success: true, outgoingReplyId: outgoing.id });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});

export const repliesRouter = router;
