import OpenAI from "openai";
import type { Conversation, Lead, Message } from "@prisma/client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAiDraft(
  conversation: Conversation & { lead: Lead; messages: Message[] },
  templateContent: string | null
): Promise<string> {
  const history = conversation.messages
    .map((m) => `${m.direction === "IN" ? "Lead" : "You"}: ${(m.bodyText || m.bodyHtml || "").slice(0, 500)}`)
    .join("\n\n");

  const systemPrompt = `You are a helpful sales assistant. Generate a professional, concise email reply based on the conversation history and lead context. Keep it under 150 words. Use a friendly but professional tone.`;

  const userPrompt = templateContent
    ? `Template to use as a base:\n${templateContent}\n\nConversation:\n${history}\n\nLead: ${conversation.lead.firstName || ""} ${conversation.lead.lastName || ""} (${conversation.lead.email}) at ${conversation.lead.companyName || "unknown company"}. Campaign: ${conversation.campaignName || "N/A"}. Generate a reply that incorporates the template style but is personalized.`
    : `Conversation:\n${history}\n\nLead: ${conversation.lead.firstName || ""} ${conversation.lead.lastName || ""} (${conversation.lead.email}) at ${conversation.lead.companyName || "unknown company"}. Campaign: ${conversation.campaignName || "N/A"}. Generate a professional reply.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 500,
  });

  return completion.choices[0]?.message?.content?.trim() || "Unable to generate draft.";
}
