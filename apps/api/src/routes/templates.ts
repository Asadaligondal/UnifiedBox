import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

const createTemplateSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  content: z.string(),
  variables: z.array(z.string()).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().optional(),
  content: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

router.get("/", async (req: AuthRequest, res) => {
  const { workspaceId } = req.query;
  const templates = await prisma.replyTemplate.findMany({
    where: workspaceId ? { workspaceId: workspaceId as string } : undefined,
    orderBy: { name: "asc" },
  });
  res.json(templates);
});

router.post("/", async (req: AuthRequest, res) => {
  const body = createTemplateSchema.parse(req.body);
  const template = await prisma.replyTemplate.create({
    data: {
      workspaceId: body.workspaceId,
      name: body.name,
      content: body.content,
      variables: body.variables || [],
    },
  });
  res.json(template);
});

router.patch("/:id", async (req: AuthRequest, res) => {
  const body = updateTemplateSchema.parse(req.body);
  const template = await prisma.replyTemplate.update({
    where: { id: req.params.id },
    data: body,
  });
  res.json(template);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  await prisma.replyTemplate.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export const templatesRouter = router;
