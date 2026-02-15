import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req: AuthRequest, res) => {
  const { campaignId, status, platform, label, assignedTo } = req.query;
  const conversations = await prisma.conversation.findMany({
    where: {
      ...(campaignId && { campaignId: campaignId as string }),
      ...(status && { status: status as "OPEN" | "PENDING" | "CLOSED" }),
      ...(platform && { platform: platform as "INSTANTLY" | "PLUSVIBE" }),
      ...(label && {
        labels: { some: { label: label as string } },
      }),
      ...(assignedTo && { assignedTo: assignedTo as string }),
    },
    include: {
      lead: true,
      labels: true,
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });
  res.json(conversations);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: {
      lead: true,
      labels: true,
      notes: { include: { user: { select: { name: true, email: true } } } },
      messages: { orderBy: { sentAt: "asc" } },
      assignments: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!conversation) return res.status(404).json({ error: "Not found" });
  res.json(conversation);
});

const updateSchema = z.object({
  status: z.enum(["OPEN", "PENDING", "CLOSED"]).optional(),
  assignedTo: z.string().nullable().optional(),
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const body = updateSchema.parse(req.body);
    const conversation = await prisma.conversation.update({
      where: { id: req.params.id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      },
      include: { lead: true, labels: true },
    });
    await prisma.auditLog.create({
      data: {
        entityType: "conversation",
        entityId: req.params.id,
        action: "updated",
        userId: req.userId!,
        metadata: body,
      },
    });
    res.json(conversation);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});

const addLabelSchema = z.object({ label: z.string() });
router.post("/:id/labels", async (req: AuthRequest, res) => {
  const { label } = addLabelSchema.parse(req.body);
  await prisma.conversationLabel.upsert({
    where: {
      conversationId_label: { conversationId: req.params.id, label },
    },
    create: { conversationId: req.params.id, label },
    update: {},
  });
  res.json({ success: true });
});

router.delete("/:id/labels/:label", async (req: AuthRequest, res) => {
  await prisma.conversationLabel.deleteMany({
    where: {
      conversationId: req.params.id,
      label: decodeURIComponent(req.params.label),
    },
  });
  res.json({ success: true });
});

const addNoteSchema = z.object({ content: z.string() });
router.post("/:id/notes", async (req: AuthRequest, res) => {
  const { content } = addNoteSchema.parse(req.body);
  const note = await prisma.conversationNote.create({
    data: {
      conversationId: req.params.id,
      userId: req.userId!,
      content,
    },
    include: { user: { select: { name: true, email: true } } },
  });
  res.json(note);
});

export const conversationsRouter = router;
