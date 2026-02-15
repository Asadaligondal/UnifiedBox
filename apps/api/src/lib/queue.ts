import { Queue, Worker } from "bullmq";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Redis = require("ioredis");

export const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const webhookQueue = new Queue("webhook-processing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 1000 },
  },
});

export function createWebhookWorker(processor: (job: { name: string; data: unknown }) => Promise<void>) {
  return new Worker(
    "webhook-processing",
    async (job) => {
      await processor({ name: job.name, data: job.data });
    },
    {
      connection,
      concurrency: 5,
    }
  );
}
