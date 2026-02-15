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
      <h1 className="text-[22px] font-semibold mb-6 text-[#37352f]">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-lg bg-white border border-[rgba(55,53,47,0.09)] shadow-sm">
          <div className="text-[13px] text-[#6b6b6b] mb-1">Replies received</div>
          <div className="text-2xl font-semibold text-[#37352f]">{overview?.repliesReceived ?? "-"}</div>
        </div>
        <div className="p-5 rounded-lg bg-white border border-[rgba(55,53,47,0.09)] shadow-sm">
          <div className="text-[13px] text-[#6b6b6b] mb-1">Replies sent</div>
          <div className="text-2xl font-semibold text-[#37352f]">{overview?.repliesSent ?? "-"}</div>
        </div>
        <div className="p-5 rounded-lg bg-white border border-[rgba(55,53,47,0.09)] shadow-sm">
          <div className="text-[13px] text-[#6b6b6b] mb-1">AI drafts generated</div>
          <div className="text-2xl font-semibold text-[#37352f]">{overview?.aiDraftsGenerated ?? "-"}</div>
        </div>
        <div className="p-5 rounded-lg bg-white border border-[rgba(55,53,47,0.09)] shadow-sm">
          <div className="text-[13px] text-[#6b6b6b] mb-1">Avg response time</div>
          <div className="text-2xl font-semibold text-[#37352f]">
            {responseTime ? `${responseTime.averageResponseTimeMinutes} min` : "-"}
          </div>
        </div>
      </div>
      <div className="mb-8">
        <h2 className="text-[15px] font-semibold mb-4 text-[#37352f]">Conversations by status</h2>
        <div className="flex gap-3 flex-wrap">
          {overview?.conversationsByStatus
            ? Object.entries(overview.conversationsByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="px-4 py-2.5 rounded-md bg-white border border-[rgba(55,53,47,0.09)] shadow-sm"
                >
                  <span className="text-[13px] text-[#6b6b6b]">{status}:</span>{" "}
                  <span className="font-semibold text-[#37352f]">{count}</span>
                </div>
              ))
            : "-"}
        </div>
      </div>
      <div>
        <h2 className="text-[15px] font-semibold mb-4 text-[#37352f]">By campaign</h2>
        <div className="overflow-x-auto rounded-lg border border-[rgba(55,53,47,0.09)] bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgba(55,53,47,0.09)]">
                <th className="text-left py-3 px-4 text-[13px] font-medium text-[#6b6b6b]">Campaign</th>
                <th className="text-right py-3 px-4 text-[13px] font-medium text-[#6b6b6b]">Conversations</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.campaignId || c.campaignName} className="border-b border-[rgba(55,53,47,0.06)] last:border-0 hover:bg-[rgba(55,53,47,0.04)] transition">
                  <td className="py-3 px-4 text-[14px] text-[#37352f]">{c.campaignName}</td>
                  <td className="py-3 px-4 text-right text-[14px] text-[#37352f] font-medium">{c.conversationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
