import { Router } from "express";
import type { InstantlyWebhookPayload, PlusVibeWebhookPayload } from "../types.js";
import { processWebhookJob } from "../workers/webhook.processor.js";

const router = Router();

let redis: InstanceType<typeof import("ioredis").default> | null = null;
let webhookQueue: import("bullmq").Queue | null = null;

async function initQueue() {
  if (webhookQueue) return;
  try {
    const { webhookQueue: q, connection: conn } = await import("../lib/queue.js");
    redis = conn;
    webhookQueue = q;
  } catch (e) {
    console.warn("Redis/Queue not available:", (e as Error).message);
  }
}

const IDEMPOTENCY_TTL = 86400;

async function checkIdempotency(key: string): Promise<boolean> {
  if (!redis) return false;
  try {
    const exists = await redis.get(`webhook:id:${key}`);
    if (exists) return true;
    await redis.setex(`webhook:id:${key}`, IDEMPOTENCY_TTL, "1");
    return false;
  } catch {
    return false;
  }
}

async function processWebhook(platform: string, payload: InstantlyWebhookPayload | PlusVibeWebhookPayload) {
  await initQueue();
  if (webhookQueue) {
    await webhookQueue.add(platform, payload);
  } else {
    await processWebhookJob(platform, payload);
  }
}

router.post("/instantly", async (req, res) => {
  try {
    const payload = req.body as InstantlyWebhookPayload;
    if (!["reply_received", "auto_reply_received"].includes(payload.event_type || "")) {
      return res.status(200).json({ received: true });
    }
    const idempotencyKey = `instantly:${payload.timestamp}:${payload.lead_email}:${payload.campaign_id}:${payload.email_id}`;
    const duplicate = await checkIdempotency(idempotencyKey);
    if (duplicate) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    await processWebhook("instantly", payload);
    res.status(200).json({ received: true });
  } catch (e) {
    console.error("Instantly webhook error:", e);
    res.status(200).json({ received: true });
  }
});

router.post("/plusvibe", async (req, res) => {
  try {
    const payload = req.body as PlusVibeWebhookPayload;
    if (!["ALL_EMAIL_REPLIES", "FIRST_EMAIL_REPLIES", "ALL_POSITIVE_REPLIES"].includes(payload.webhook_event || "")) {
      return res.status(200).json({ received: true });
    }
    const idempotencyKey = `plusvibe:${payload.webhook_id}`;
    const duplicate = await checkIdempotency(idempotencyKey);
    if (duplicate) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    await processWebhook("plusvibe", payload);
    res.status(200).json({ received: true });
  } catch (e) {
    console.error("PlusVibe webhook error:", e);
    res.status(200).json({ received: true });
  }
});

export const webhooksRouter = router;
