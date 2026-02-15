# Testing the Unified Inbox Prototype

## Quick Start (Demo Mode - No API Keys Needed)

1. **Seed demo data** (creates sample conversations):
   ```bash
   npm run seed:demo
   ```

2. **Log in** at http://localhost:3000/login
   - Use your existing account, or register a new one
   - Demo seed also creates: `demo@example.com` / `password123`

3. **Go to Inbox** at http://localhost:3000/inbox
   - You should see 2 demo conversations (John from Acme, Sarah from TechStart)

4. **Test each feature:**
   - **Select a conversation** → View thread, messages, labels
   - **Generate AI draft** → Click "Generate AI draft" (requires OPENAI_API_KEY in .env)
   - **Add labels** → Click INTERESTED, NOT_INTERESTED, etc.
   - **Change status** → Use dropdown: Open / Pending / Closed
   - **Add note** → Type in "Add internal note" and click Add note
   - **Analytics** → Go to http://localhost:3000/analytics

---

## Full Testing (With Real Instantly + PlusVibe)

### What You Need

| Item | Where to Get |
|------|--------------|
| Instantly API key | Instantly dashboard → Settings → API (Growth plan+) |
| PlusVibe API key | PlusVibe → Settings → API Access (Business plan) |
| PlusVibe Workspace ID | PlusVibe URL or API response |

### Setup Steps

1. **Add platform connections** at http://localhost:3000/settings
   - Instantly: Paste API key, optional workspace/org ID
   - PlusVibe: Paste API key + Workspace ID (required)

2. **Sync conversations** in Inbox
   - Click "Sync from platforms" to pull replies via API

3. **Configure webhooks** (for real-time replies)
   - Instantly: Settings → Webhooks → Add `http://localhost:3001/api/webhooks/instantly`
   - PlusVibe: Webhook settings → Add `http://localhost:3001/api/webhooks/plusvibe`
   - Events: reply_received (Instantly), ALL_EMAIL_REPLIES (PlusVibe)

4. **Test reply sending**
   - Select a conversation with an IN message
   - Generate AI draft or type manually
   - Click "Send reply" (sends via Instantly/PlusVibe API)

---

## Feature Checklist

- [ ] Login / Register
- [ ] Inbox list with filters (campaign, status, platform)
- [ ] Conversation thread view
- [ ] AI draft generation
- [ ] Send reply (demo data: will fail without real API; that's expected)
- [ ] Labels (Interested, Not Interested, etc.)
- [ ] Status (Open / Pending / Closed)
- [ ] Internal notes
- [ ] Analytics dashboard
- [ ] Settings: Add/remove platform connections

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Empty inbox | Run `npm run seed:demo` for demo data |
| AI draft fails | Ensure OPENAI_API_KEY is in `.env` |
| Send reply fails | Need real Instantly/PlusVibe connection with valid API key |
| CORS errors | Backend must run on port 3001, frontend on 3000 |
