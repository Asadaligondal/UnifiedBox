import "dotenv/config";
import express from "express";

// Start worker if Redis is available
if (process.env.REDIS_URL) {
  import("./workers/index.js").catch((e) =>
    console.warn("Webhook worker not started:", e.message)
  );
}
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { conversationsRouter } from "./routes/conversations.js";
import { webhooksRouter } from "./routes/webhooks.js";
import { platformRouter } from "./routes/platform.js";
import { repliesRouter } from "./routes/replies.js";
import { templatesRouter } from "./routes/templates.js";
import { aiRouter } from "./routes/ai.js";
import { analyticsRouter } from "./routes/analytics.js";
import { syncRouter } from "./routes/sync.js";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check for Render
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Public routes
app.use("/api/auth", authRouter);
app.use("/api/webhooks", webhooksRouter);

// Protected routes
app.use("/api/platform", authMiddleware, platformRouter);
app.use("/api/conversations", authMiddleware, conversationsRouter);
app.use("/api/replies", authMiddleware, repliesRouter);
app.use("/api/templates", authMiddleware, templatesRouter);
app.use("/api/ai", authMiddleware, aiRouter);
app.use("/api/analytics", authMiddleware, analyticsRouter);
app.use("/api/sync", authMiddleware, syncRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
