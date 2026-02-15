import { createWebhookWorker } from "../lib/queue.js";
import { processWebhookJob } from "./webhook.processor.js";
import type { InstantlyWebhookPayload, PlusVibeWebhookPayload } from "../types.js";

const worker = createWebhookWorker(async (job) => {
  const { name, data } = job;
  await processWebhookJob(name, data as InstantlyWebhookPayload | PlusVibeWebhookPayload);
});

worker.on("completed", (job) => {
  console.log(`Webhook job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Webhook job ${job?.id} failed:`, err);
});

console.log("Webhook worker started");
