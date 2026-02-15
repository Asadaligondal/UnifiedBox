"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { api } from "@/lib/api";

interface Overview {
  repliesReceived: number;
  repliesSent: number;
  aiDraftsGenerated: number;
  conversationsByStatus: Record<string, number>;
  period: { start: string; end: string };
}

interface CampaignStat {
  campaignId: string | null;
  campaignName: string;
  conversationCount: number;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([]);
  const [responseTime, setResponseTime] = useState<{ averageResponseTimeMinutes: number; sampleCount: number } | null>(null);

  useEffect(() => {
    api<Overview>("/api/analytics/overview").then(setOverview).catch(() => setOverview(null));
    api<CampaignStat[]>("/api/analytics/by-campaign").then(setCampaigns).catch(() => setCampaigns([]));
    api<{ averageResponseTimeMinutes: number; sampleCount: number }>("/api/analytics/response-time")
      .then(setResponseTime)
      .catch(() => setResponseTime(null));
  }, []);

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-sm text-slate-500">Replies received</div>
          <div className="text-2xl font-bold">{overview?.repliesReceived ?? "-"}</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-sm text-slate-500">Replies sent</div>
          <div className="text-2xl font-bold">{overview?.repliesSent ?? "-"}</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-sm text-slate-500">AI drafts generated</div>
          <div className="text-2xl font-bold">{overview?.aiDraftsGenerated ?? "-"}</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="text-sm text-slate-500">Avg response time</div>
          <div className="text-2xl font-bold">
            {responseTime ? `${responseTime.averageResponseTimeMinutes} min` : "-"}
          </div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Conversations by status</h2>
        <div className="flex gap-4">
          {overview?.conversationsByStatus
            ? Object.entries(overview.conversationsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700"
                >
                  <span className="text-slate-500">{status}:</span>{" "}
                  <span className="font-semibold">{count}</span>
                </div>
              ))
            : "-"}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">By campaign</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3">Campaign</th>
                <th className="text-right py-2 px-3">Conversations</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.campaignId || c.campaignName} className="border-b border-slate-800">
                  <td className="py-2 px-3">{c.campaignName}</td>
                  <td className="py-2 px-3 text-right">{c.conversationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
