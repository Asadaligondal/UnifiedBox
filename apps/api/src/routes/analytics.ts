import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/overview", async (req: AuthRequest, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const [repliesCount, sentReplies, aiDraftsCount, conversationsByStatus] = await Promise.all([
    prisma.message.count({ where: { direction: "IN", sentAt: { gte: start, lte: end } } }),
    prisma.outgoingReply.count({ where: { status: "SENT", sentAt: { gte: start, lte: end } } }),
    prisma.aiDraft.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.conversation.groupBy({
      by: ["status"],
      _count: true,
      where: { createdAt: { gte: start, lte: end } },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    conversationsByStatus.map((s: { status: string; _count: number }) => [s.status, s._count])
  );

  res.json({
    repliesReceived: repliesCount,
    repliesSent: sentReplies,
    aiDraftsGenerated: aiDraftsCount,
    conversationsByStatus: statusCounts,
    period: { start, end },
  });
});

router.get("/by-campaign", async (req: AuthRequest, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const campaigns = await prisma.conversation.groupBy({
    by: ["campaignId", "campaignName"],
    _count: true,
    where: {
      campaignId: { not: null },
      createdAt: { gte: start, lte: end },
    },
  });

  const result = campaigns.map((c: { campaignId: string | null; campaignName: string | null; _count: number }) => ({
    campaignId: c.campaignId,
    campaignName: c.campaignName || "Unknown",
    conversationCount: c._count,
  }));

  res.json(result);
});

router.get("/response-time", async (req: AuthRequest, res) => {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate as string) : new Date();

  const replies = await prisma.outgoingReply.findMany({
    where: { status: "SENT", sentAt: { gte: start, lte: end } },
    include: {
      message: true,
      conversation: {
        include: {
          messages: {
            where: { direction: "IN" },
            orderBy: { sentAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const responseTimes: number[] = [];
  for (const reply of replies) {
    const lastInMessage = reply.conversation.messages[0];
    if (lastInMessage && reply.sentAt) {
      responseTimes.push((reply.sentAt.getTime() - lastInMessage.sentAt.getTime()) / (1000 * 60));
    }
  }

  const avgMinutes = responseTimes.length
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;

  res.json({ averageResponseTimeMinutes: Math.round(avgMinutes), sampleCount: responseTimes.length });
});

export const analyticsRouter = router;
