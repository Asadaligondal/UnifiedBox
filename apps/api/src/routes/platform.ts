import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import type { AuthRequest } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

const createConnectionSchema = z.object({
  platform: z.enum(["INSTANTLY", "PLUSVIBE"]),
  apiKey: z.string().min(1),
  workspaceId: z.string().optional(),
  organizationId: z.string().optional(),
});

// Simple encryption - in production use proper encryption (e.g. crypto.createCipheriv)
function encryptApiKey(apiKey: string): string {
  return Buffer.from(apiKey, "utf8").toString("base64");
}

function decryptApiKey(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf8");
}

router.get("/connections", async (req: AuthRequest, res) => {
  const connections = await prisma.platformConnection.findMany({
    where: { userId: req.userId! },
    select: {
      id: true,
      platform: true,
      workspaceId: true,
      organizationId: true,
      createdAt: true,
    },
  });
  res.json(connections);
});

router.post("/connections", async (req: AuthRequest, res) => {
  try {
    const body = createConnectionSchema.parse(req.body);
    const connection = await prisma.platformConnection.create({
      data: {
        userId: req.userId!,
        platform: body.platform,
        apiKeyEncrypted: encryptApiKey(body.apiKey),
        workspaceId: body.workspaceId,
        organizationId: body.organizationId,
      },
      select: {
        id: true,
        platform: true,
        workspaceId: true,
        organizationId: true,
        createdAt: true,
      },
    });
    res.json(connection);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors });
    }
    throw e;
  }
});

router.delete("/connections/:id", async (req: AuthRequest, res) => {
  await prisma.platformConnection.deleteMany({
    where: { id: req.params.id, userId: req.userId! },
  });
  res.json({ success: true });
});

export const platformRouter = router;
