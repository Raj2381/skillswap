# SkillSwap

## Hackathon ID

AZIS-U348YE

## Overview

SkillSwap is a creator gig marketplace where creators publish services and clients discover and book those services. The authenticated application also supports creator workspaces, project requests, projects, and realtime chat.

The public hackathon demo is isolated from authenticated production records so graders can use the required flow without creating an account.

## Five Required Features

### 1. Post a Gig
Creators can publish gigs with a title, category, rate, and description from `/creator/workspace/post-gig`. The public demo includes seeded gigs for evaluation.

### 2. Browse & Search
Open `/marketplace` to browse demo gigs, search by title, creator, category, or description, and filter by category. Results are deterministic and seeded in Supabase.

### 3. Book a Gig
Open any gig from `/marketplace`, submit a name and requirements, and receive a persisted `Pending` booking confirmation at `/bookings`.

### 4. Creator Dashboard
Open `/creator-demo` to view public demo bookings and Accept or Decline them. Acceptance is blocked when that gig already has an accepted booking.

### 5. My Bookings
Open `/bookings` to see persisted Pending, Accepted, and Declined bookings. Declined records remain visible and the marketplace link remains available.

## Decision Points

See [DECISIONS.md](DECISIONS.md) for the implemented Rejection, Double Booking, and Discovery decisions.

## Demo Flow

1. Open `/marketplace` without logging in.
2. Search for a gig and filter by category.
3. Open a gig detail page.
4. Submit a booking.
5. Open `/bookings` and verify `Pending`.
6. Open `/creator-demo` and Accept or Decline the booking.
7. Return to `/bookings` and verify `Accepted` or `Declined`.
8. Repeat with another booking to demonstrate the double-booking rule.

## Authentication

No account is required to demonstrate the five public hackathon features. The existing authenticated creator/client workspace remains available for the full production workflow.

## Technology

- Next.js App Router
- TypeScript
- React
- Supabase/PostgreSQL
- Supabase Realtime
- Tailwind CSS

## Standard API

Not implemented. The application uses its existing Next.js/Supabase APIs rather than a separately implemented hackathon Standard API.

## Database

The public demo uses the additive `demo_gigs` and `demo_bookings` tables from `supabase/migrations/010_hackathon_demo_mode.sql`. Authenticated production data continues to use profiles, creator_profiles, gigs, project_requests, projects, conversations, and messages.

## Running Locally

```bash
npm install
npm run dev
```

Apply the Supabase migrations, then configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Deployment

Production URL: TO_BE_FILLED_AFTER_DEPLOYMENT
