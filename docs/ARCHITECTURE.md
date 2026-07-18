# CEO Executive Dashboard — Architecture

Personal command center for Kory. **Not** the company-wide IFG dashboard (HubSpot and IFG Asana live there).

## Scope

| In scope | Out of scope |
|----------|----------------|
| Asana **Kory NON-IFG** only | HubSpot, IFG Tasks board |
| All Outlook calendars (primary, shared, family, master) | Company metrics dashboards |
| LinkedIn (later) | |
| Health logs + chat (later, local DB) | |
| Hermes + Anthropic for AI (later) | |

## Integrations (Composio)

| Toolkit | Connected account env | Purpose |
|---------|----------------------|---------|
| Asana | `COMPOSIO_ASANA_CONNECTED_ACCOUNT_ID` | Personal tasks |
| Outlook | `COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID` | Mail + **all calendars** |

Both share `COMPOSIO_API_KEY` and `COMPOSIO_USER_ID` (entity id).

Calendar sync reads **every** calendar returned by `OUTLOOK_LIST_CALENDARS`, then `OUTLOOK_GET_CALENDAR_VIEW` per calendar. Duplicate “(copy)” events from aggregated calendars are deduped.

## Hermes agent

| Phase | Where | Notes |
|-------|--------|------|
| **Now** | Local machine | Hermes daemon + Composio MCP; briefing / prioritization / meeting prep |
| **Later** | Hostinger VPS | Same Hermes config; dashboard on Hostinger calls `HERMES_BASE_URL` for AI jobs |

The Next.js app does **not** embed Hermes. It:

1. Pulls structured data via Composio (Asana, Outlook).
2. Calls Hermes HTTP API for AI artifacts (when implemented).
3. Stores or displays cached results.

## Auth (optional)

Disabled unless `REQUIRE_AUTH=true`. For Kory-only local use, open the app directly at `/`. Enable auth before Hostinger deploy so the site isn’t public on the internet.

## Deployment target (Hostinger)

1. Node 20+ app (Next.js `standalone` build).
2. Env vars in Hostinger panel (never in git).
3. Hermes on same VPS or private network; set `HERMES_BASE_URL`.
4. Cron on server for 4:45 AM MT daily briefing (future).

## API routes (current)

| Route | Description |
|-------|-------------|
| `GET /api/asana/tasks` | Kory NON-IFG tasks |
| `GET /api/outlook/meetings` | Today’s meetings (all calendars) |
| `GET /api/outlook/events?range=today\|week\|month` | Raw calendar events |
| `GET /api/outlook/calendars` | Calendar list |
| `POST /api/auth/login` | Session cookie |
| `POST /api/auth/logout` | Clear session |

## Probes

```bash
npm run probe:asana
npm run probe:outlook
```
