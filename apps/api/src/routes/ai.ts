import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";
import { generateAiDraft } from "../lib/ai.js";

const prisma = new PrismaClient();
const router = Router();

const generateSchema = z.object({
  conversationId: z.string(),
  templateId: z.string().optional(),
});

router.post("/generate", async (req: AuthRequest, res) => {
  try {
    const { conversationId, templateId } = generateSchema.parse(req.body);
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        messages: { orderBy: { sentAt: "asc" } },
      },
    });
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    let templateContent: string | null = null;
    if (templateId) {
      const template = await prisma.replyTemplate.findUnique({
        where: { id: templateId },
      });
      templateContent = template?.content ?? null;
    }

    const draft = await generateAiDraft(conversation, templateContent);
    const aiDraft = await prisma.aiDraft.create({
      data: {
        conversationId,
        userId: req.userId!,
        promptContext: JSON.stringify({ templateId }),
        generatedContent: draft,
        editedContent: draft,
      },
    });
    res.json({ draft: aiDraft.editedContent || aiDraft.generatedContent, aiDraftId: aiDraft.id });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    throw e;
  }
});

const saveDraftSchema = z.object({
  aiDraftId: z.string(),
  editedContent: z.string(),
});

router.post("/save-draft", async (req: AuthRequest, res) => {
  const { aiDraftId, editedContent } = saveDraftSchema.parse(req.body);
  await prisma.aiDraft.update({
    where: { id: aiDraftId },
    data: { editedContent },
  });
  res.json({ success: true });
});

export const aiRouter = router;
