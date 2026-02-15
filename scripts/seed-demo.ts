/**
 * Seed demo data for testing the Unified Inbox prototype.
 * Run: npx tsx scripts/seed-demo.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get or create a user
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

  // Create workspace
  let workspace = await prisma.workspace.findFirst({ where: { externalId: "demo-ext-1" } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Demo Workspace", externalId: "demo-ext-1" },
    });
  }

  // Create demo leads
  const leads = await Promise.all([
    prisma.lead.upsert({
      where: {
        email_workspaceId_sourcePlatform: {
          email: "john@acme.com",
          workspaceId: workspace.id,
          sourcePlatform: "INSTANTLY",
        },
      },
      create: {
        email: "john@acme.com",
        firstName: "John",
        lastName: "Smith",
        companyName: "Acme Corp",
        workspaceId: workspace.id,
        sourcePlatform: "INSTANTLY",
      },
      update: {},
    }),
    prisma.lead.upsert({
      where: {
        email_workspaceId_sourcePlatform: {
          email: "sarah@techstart.io",
          workspaceId: workspace.id,
          sourcePlatform: "PLUSVIBE",
        },
      },
      create: {
        email: "sarah@techstart.io",
        firstName: "Sarah",
        lastName: "Johnson",
        companyName: "TechStart",
        workspaceId: workspace.id,
        sourcePlatform: "PLUSVIBE",
      },
      update: {},
    }),
  ]);

  // Create demo conversations with messages
  const conv1 = await prisma.conversation.upsert({
    where: {
      platform_externalThreadId: { platform: "INSTANTLY", externalThreadId: "demo-thread-1" },
    },
    create: {
      leadId: leads[0].id,
      platform: "INSTANTLY",
      externalThreadId: "demo-thread-1",
      campaignId: "camp-1",
      campaignName: "Q1 Outreach",
      status: "OPEN",
      lastMessageAt: new Date(),
    },
    update: {},
  });

  const conv2 = await prisma.conversation.upsert({
    where: {
      platform_externalThreadId: { platform: "PLUSVIBE", externalThreadId: "demo-thread-2" },
    },
    create: {
      leadId: leads[1].id,
      platform: "PLUSVIBE",
      externalThreadId: "demo-thread-2",
      campaignId: "camp-2",
      campaignName: "Product Launch",
      status: "PENDING",
      lastMessageAt: new Date(),
    },
    update: {},
  });

  // Add messages to conversations
  await prisma.message.upsert({
    where: {
      platform_externalMessageId: { platform: "INSTANTLY", externalMessageId: "demo-msg-1" },
    },
    create: {
      conversationId: conv1.id,
      platform: "INSTANTLY",
      externalMessageId: "demo-msg-1",
      direction: "IN",
      subject: "Re: Your outreach",
      bodyText: "Hi, thanks for reaching out! I'd love to learn more about your product. Can we schedule a call next week?",
      fromEmail: "john@acme.com",
      toEmail: "you@company.com",
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: { eaccount: "you@company.com" },
    },
    update: {},
  });

  await prisma.message.upsert({
    where: {
      platform_externalMessageId: { platform: "INSTANTLY", externalMessageId: "demo-msg-2" },
    },
    create: {
      conversationId: conv1.id,
      platform: "INSTANTLY",
      externalMessageId: "demo-msg-2",
      direction: "OUT",
      subject: "Re: Your outreach",
      bodyText: "Great to hear from you John! I'll send over a calendar link.",
      fromEmail: "you@company.com",
      toEmail: "john@acme.com",
      sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      metadata: {},
    },
    update: {},
  });

  await prisma.message.upsert({
    where: {
      platform_externalMessageId: { platform: "PLUSVIBE", externalMessageId: "demo-msg-3" },
    },
    create: {
      conversationId: conv2.id,
      platform: "PLUSVIBE",
      externalMessageId: "demo-msg-3",
      direction: "IN",
      subject: "Re: Product Launch",
      bodyText: "This looks interesting! What pricing do you offer for startups?",
      fromEmail: "sarah@techstart.io",
      toEmail: "you@company.com",
      sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      metadata: { to_email: "you@company.com" },
    },
    update: {},
  });

  // Add labels
  await prisma.conversationLabel.upsert({
    where: { conversationId_label: { conversationId: conv1.id, label: "INTERESTED" } },
    create: { conversationId: conv1.id, label: "INTERESTED" },
    update: {},
  });

  // Add a note
  await prisma.conversationNote.create({
    data: {
      conversationId: conv1.id,
      userId: user.id,
      content: "Follow up with pricing deck",
    },
  }).catch(() => {});

  console.log("Demo data seeded successfully!");
  console.log("- 2 conversations in Inbox");
  console.log("- Try: Inbox > select conversation > Generate AI draft > Send reply");
  console.log("- Try: Labels, status, notes, Analytics");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
