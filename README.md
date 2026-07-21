# CEO Executive Dashboard — Iconic Founders

A full-featured executive command center built for Kory to manage daily activities, priorities, and team coordination at a glance.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Lucide React** for icons

## Features

### Top Priorities Banner
- Displays today's most critical action items across all platforms
- Flag/unflag items and mark tasks complete directly from the banner
- Priority levels: Critical, High, Medium, Low with color-coded indicators

### Unread Emails
- Inbox view with unread indicators, sender avatars, priority dots, and labels
- Filter by All / Unread / Flagged
- One-click flag and mark-read interactions

### Day's Meetings
- Full schedule with expandable cards showing attendee bios
- Agenda and prep notes per meeting
- Meeting type icons (Video, In-Person, Phone)
- One-click "Join Zoom/Meet" button for video meetings

### Calls & Follow-ups
- Scheduled calls, follow-ups, and missed incoming calls
- Notes per call, action buttons (Call Back / Note)
- Flag and mark-complete controls

### Asana Tasks
- Tasks by status: Overdue, Due Today, In Progress, Upcoming
- Subtask progress bars
- Filter by status, flag items

### LinkedIn Messages
- Unread message feed with sender roles and companies
- Connection degree indicators
- Flag and mark-read interactions

### Daily Briefing (4:45 AM)
- Auto-generated briefing delivered daily at 4:45 AM
- Key insights summary for the day
- Overdue tasks aggregated from all platforms
- Weather and daily outlook summary

### Health & Wellness Logs
- Protein tracking with goal progress ring
- Water intake tracking
- Sleep, weight, steps summary
- Workout log with exercises and notes
- Navigate between past days

## Color Palette

Derived from the Iconic Founders logo:
- Background: `#2e2e2e` (dark charcoal)
- Cards: `#3d3d3d`
- Gold primary: `#c9a044`
- Gold light: `#d4af60`
- White text: `#ffffff`

## Getting Started

Requires **Node.js 20.9+** (Next.js 16).

```bash
npm install
cp .env.example .env.local   # then fill in Composio values
npm run probe:asana          # verify Asana connection
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Asana (Kory NON-IFG only)

| Variable | Description |
|----------|-------------|
| `COMPOSIO_API_KEY` | From [Composio dashboard](https://platform.composio.dev) |
| `COMPOSIO_CONNECTED_ACCOUNT_ID` | Asana connected account (`ca_…`) |
| `COMPOSIO_USER_ID` | Entity user id from the connected account (`user_id` field) |
| `ASANA_PROJECT_NAME` | Default: `Kory NON-IFG` |
| `ASANA_PROJECT_GID` | Optional; auto-discovered via `npm run probe:asana` |

API routes:

- `GET /api/asana/status` — connection health
- `GET /api/asana/tasks` — live tasks for the personal board

Set `USE_MOCK_DATA=true` to skip Composio and use sample data in `src/lib/data.ts`.

### Outlook (all calendars)

| Variable | Description |
|----------|-------------|
| `COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID` | Outlook OAuth account (`ca_…`) |
| `npm run probe:outlook` | Lists calendars + today’s events |

Meetings and Travel read **every** calendar in the mailbox (primary, shared, family, master). Duplicate “(copy)” events are deduped.

### Auth (optional)

Login is **off by default** (single-user local dashboard). Before deploying to Hostinger, set `REQUIRE_AUTH=true`, `NEXT_PUBLIC_REQUIRE_AUTH=true`, plus `AUTH_SECRET`, `DASHBOARD_USERNAME`, and `DASHBOARD_PASSWORD`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for Hermes (local → Hostinger) and scope vs company dashboard.
