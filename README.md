# SkillSwap

## Hackathon ID

AZIS-U348YE

## Overview

SkillSwap is a Next.js marketplace connecting clients with authenticated creators through Supabase-backed profiles, gigs, project requests, projects, conversations, and messages.

## Current Architecture

- Next.js App Router with TypeScript
- Supabase Auth and PostgreSQL
- Browser and server Supabase clients using `@supabase/ssr`
- Realtime subscriptions for requests, projects, notifications, and messages
- Authenticated creator workspace under `/creator/workspace/*`
- Client marketplace under `/creators`, `/find-creators`, and `/projects`

## Verified Demo Flow

1. Sign in as a client and open `/find-creators`.
2. Select a creator whose profile is stored in Supabase.
3. Submit a project request with a deadline and requirements.
4. Sign in as the assigned creator and open `/creator/workspace/requests`.
5. Open `/creator/workspace/messages` to exchange persisted realtime messages.

## Database

The schema links `auth.users` to `profiles`, creator-specific data to `creator_profiles`, services to creators, requests to client and creator IDs, projects to accepted requests, and messages to participant-only conversations. Apply migrations in `supabase/migrations/` in order. The additive `007_hackathon_hardening.sql` migration protects profile roles and enables required realtime tables.

## Running Locally

```bash
npm install
npm run dev
```

Apply the Supabase schema using the project migrations or the consolidated production setup, then configure the environment variables below.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Standard API

Not implemented. The application uses Supabase client APIs, server routes, and database functions rather than a separately documented hackathon Standard API.

## Five Required Features

The repository does not contain the hackathon brief, so the exact five required features cannot be stated without inventing requirements. The currently implemented product capabilities are creator discovery, creator profiles and gigs, project requests, creator request management, projects, and realtime chat.

## Decision Points

The exact three Decision Points are not present in the repository or the available project context. They are recorded as unresolved in [DECISIONS.md](DECISIONS.md) rather than fabricated.

## Deployment

Deploy the Next.js application to Vercel and configure the documented Supabase environment variables. No production URL is committed because one has not been provided.
