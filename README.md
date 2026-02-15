# Unified Inbox Platform

A full-stack unified inbox platform that aggregates replies from Instantly and PlusVibe campaigns.

## Quick Start

1. **Start local services:**
   ```bash
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup database:**
   ```bash
   npm run db:push
   ```

4. **Run development:**
   ```bash
   npm run dev:api   # Terminal 1 - Backend (port 3001)
   npm run dev:web   # Terminal 2 - Frontend (port 3000)
   ```

5. **Create an account:** Go to http://localhost:3000/login and register.

## Project Structure

- `apps/web` - Next.js frontend (Vercel)
- `apps/api` - Node.js backend (Render)
- `packages/shared` - Shared types, Prisma schema

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.
