/**
 * Seed demo data for testing the Unified Inbox prototype.
 * Run: npm run seed:demo
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_LEADS = [
  { email: "john@acme.com", firstName: "John", lastName: "Smith", company: "Acme Corp", platform: "INSTANTLY" as const },
  { email: "sarah@techstart.io", firstName: "Sarah", lastName: "Johnson", company: "TechStart", platform: "PLUSVIBE" as const },
  { email: "mike@growthlabs.co", firstName: "Mike", lastName: "Chen", company: "GrowthLabs", platform: "INSTANTLY" as const },
  { email: "emma@innovate.io", firstName: "Emma", lastName: "Williams", company: "Innovate Inc", platform: "PLUSVIBE" as const },
  { email: "david@scaleup.com", firstName: "David", lastName: "Brown", company: "ScaleUp", platform: "INSTANTLY" as const },
  { email: "lisa@startupx.com", firstName: "Lisa", lastName: "Martinez", company: "StartupX", platform: "PLUSVIBE" as const },
  { email: "james@enterprise.co", firstName: "James", lastName: "Taylor", company: "Enterprise Solutions", platform: "INSTANTLY" as const },
  { email: "anna@cloudbase.io", firstName: "Anna", lastName: "Garcia", company: "CloudBase", platform: "PLUSVIBE" as const },
  { email: "robert@dataflow.com", firstName: "Robert", lastName: "Lee", company: "DataFlow", platform: "INSTANTLY" as const },
  { email: "julia@automate.io", firstName: "Julia", lastName: "Anderson", company: "Automate.io", platform: "PLUSVIBE" as const },
];

const DEMO_CONVERSATIONS = [
  { campaign: "Q1 Outreach", status: "OPEN" as const, labels: ["INTERESTED"], platform: "INSTANTLY" },
  { campaign: "Product Launch", status: "PENDING" as const, labels: [], platform: "PLUSVIBE" },
  { campaign: "Enterprise Sales", status: "OPEN" as const, labels: ["FOLLOW_UP"], platform: "INSTANTLY" },
  { campaign: "Startup Program", status: "CLOSED" as const, labels: ["INTERESTED"], platform: "PLUSVIBE" },
  { campaign: "Q1 Outreach", status: "OPEN" as const, labels: ["NOT_INTERESTED"], platform: "INSTANTLY" },
  { campaign: "Product Launch", status: "PENDING" as const, labels: ["INTERESTED"], platform: "PLUSVIBE" },
  { campaign: "Enterprise Sales", status: "OPEN" as const, labels: [], platform: "INSTANTLY" },
  { campaign: "Startup Program", status: "OPEN" as const, labels: ["FOLLOW_UP"], platform: "PLUSVIBE" },
  { campaign: "Q1 Outreach", status: "CLOSED" as const, labels: ["WRONG_PERSON"], platform: "INSTANTLY" },
  { campaign: "Product Launch", status: "PENDING" as const, labels: ["INTERESTED"], platform: "PLUSVIBE" },
];

const MESSAGE_TEMPLATES = {
  interested: [
    { dir: "IN" as const, text: "Hi, thanks for reaching out! I'd love to learn more about your product. Can we schedule a call next week?" },
    { dir: "OUT" as const, text: "Great to hear from you! I'll send over a calendar link. Does Tuesday or Wednesday work for you?" },
    { dir: "IN" as const, text: "Wednesday afternoon works perfectly. Looking forward to it!" },
  ],
  pricing: [
    { dir: "IN" as const, text: "This looks interesting! What pricing do you offer for startups?" },
    { dir: "OUT" as const, text: "Happy to share our pricing. We have a startup plan starting at $99/mo. I'll send the full breakdown." },
    { dir: "IN" as const, text: "Thanks! Can we also discuss enterprise options? We're scaling quickly." },
  ],
  notInterested: [
    { dir: "IN" as const, text: "Thanks for the email but we're not looking to switch vendors right now. Maybe next quarter." },
    { dir: "OUT" as const, text: "No problem at all. I'll reach out in Q2. Good luck with your launch!" },
  ],
  followUp: [
    { dir: "IN" as const, text: "Hey, we spoke last month. Wanted to check if the new features we discussed are live?" },
    { dir: "OUT" as const, text: "Yes! We just shipped the API integrations. I'll send you a demo link." },
    { dir: "IN" as const, text: "Perfect, that was the blocker. Let's set up a trial." },
  ],
  wrongPerson: [
    { dir: "IN" as const, text: "I think you have the wrong person - I'm in marketing, not sales. You might want to reach out to our VP Sales." },
    { dir: "OUT" as const, text: "Apologies for the mix-up! I'll update our records. Thanks for letting me know." },
  ],
  enterprise: [
    { dir: "IN" as const, text: "We're evaluating solutions for our 500-person team. Do you have case studies from similar companies?" },
    { dir: "OUT" as const, text: "Absolutely. I'll send over 3 case studies from companies in your space. We also offer a custom demo." },
    { dir: "IN" as const, text: "That would be great. Our procurement process takes 4-6 weeks - is that okay?" },
    { dir: "OUT" as const, text: "No problem. I'll include our enterprise terms. When would you like to schedule the demo?" },
  ],
};

function pickTemplate(idx: number) {
  const templates = Object.values(MESSAGE_TEMPLATES);
  return templates[idx % templates.length];
}

async function main() {
  let user = await prisma.user.findFirst();
  if (!user) {
    const bcrypt = await import("bcryptjs");
    user = await prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
        passwordHash: await bcrypt.hash("password123", 10),
        role: "ADMIN",
      },
    });
    console.log("Created demo user: demo@example.com / password123");
  }

  let workspace = await prisma.workspace.findFirst({ where: { externalId: "demo-ext-1" } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Demo Workspace", externalId: "demo-ext-1" },
    });
  }

  // Create leads
  const leads = await Promise.all(
    DEMO_LEADS.map((l) =>
      prisma.lead.upsert({
        where: {
          email_workspaceId_sourcePlatform: {
            email: l.email,
            workspaceId: workspace!.id,
            sourcePlatform: l.platform,
          },
        },
        create: {
          email: l.email,
          firstName: l.firstName,
          lastName: l.lastName,
          companyName: l.company,
          workspaceId: workspace!.id,
          sourcePlatform: l.platform,
        },
        update: {},
      })
    )
  );

  let msgId = 1;
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  for (let i = 0; i < DEMO_CONVERSATIONS.length; i++) {
    const conf = DEMO_CONVERSATIONS[i];
    const lead = leads[i % leads.length];
    const threadId = `demo-thread-${i + 1}`;

    const conv = await prisma.conversation.upsert({
      where: {
        platform_externalThreadId: { platform: lead.sourcePlatform, externalThreadId: threadId },
      },
      create: {
        leadId: lead.id,
        platform: lead.sourcePlatform,
        externalThreadId: threadId,
        campaignId: `camp-${(i % 4) + 1}`,
        campaignName: conf.campaign,
        status: conf.status,
        lastMessageAt: new Date(now - i * 2 * hour),
      },
      update: {},
    });

    const template = pickTemplate(i);
    for (let j = 0; j < template.length; j++) {
      const m = template[j];
      const extId = `demo-msg-${msgId++}`;
      const sentAt = new Date(now - (i * 2 * hour + (template.length - j) * 4 * hour));

      await prisma.message.upsert({
        where: {
          platform_externalMessageId: { platform: lead.sourcePlatform, externalMessageId: extId },
        },
        create: {
          conversationId: conv.id,
          platform: lead.sourcePlatform,
          externalMessageId: extId,
          direction: m.dir,
          subject: `Re: ${conf.campaign}`,
          bodyText: m.text,
          fromEmail: m.dir === "IN" ? lead.email : "you@company.com",
          toEmail: m.dir === "IN" ? "you@company.com" : lead.email,
          sentAt,
          metadata: m.dir === "IN" ? { eaccount: "you@company.com", to_email: "you@company.com" } : {},
        },
        update: {},
      });
    }

    for (const label of conf.labels) {
      await prisma.conversationLabel.upsert({
        where: { conversationId_label: { conversationId: conv.id, label } },
        create: { conversationId: conv.id, label },
        update: {},
      });
    }

    if (i < 4) {
      const notes = [
        "Follow up with pricing deck",
        "Schedule demo for next week",
        "Send case studies",
        "Check in on trial",
      ];
      await prisma.conversationNote.create({
        data: {
          conversationId: conv.id,
          userId: user.id,
          content: notes[i],
        },
      }).catch(() => {});
    }
  }

  // Add some outgoing replies for analytics
  const convs = await prisma.conversation.findMany({ take: 5, include: { messages: { where: { direction: "OUT" }, take: 1 } } });
  for (const c of convs) {
    const msg = c.messages[0];
    if (msg) {
      const existing = await prisma.outgoingReply.findFirst({
        where: { conversationId: c.id, messageId: msg.id },
      });
      if (!existing) {
        await prisma.outgoingReply.create({
          data: {
            messageId: msg.id,
            conversationId: c.id,
            platform: c.platform,
            status: "SENT",
            sentAt: new Date(now - 1 * day),
          },
        });
      }
    }
  }

  console.log("Demo data seeded successfully!");
  console.log("- 10 conversations with varied statuses and labels");
  console.log("- Multiple messages per thread (back-and-forth chats)");
  console.log("- Notes on first 4 conversations");
  console.log("- Sample outgoing replies for analytics");
  console.log("- Run: npm run seed:demo (again to refresh)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
