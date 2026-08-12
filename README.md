# SMS Order Group Manager (Local)

Local Node.js + Twilio dashboard for managing SMS "order groups" — each
group is an order number tied to a list of phone numbers that should
receive the same SMS.

## Setup

```
npm install
node server.js
```

Then open: **http://localhost:3000**

Your `.env` already has the working Twilio credentials carried over from
the original `index.js` script:

```
TWILIO_SID=...
TWILIO_AUTH=...
TWILIO_PHONE=...
PORT=3000
```

## What's in the dashboard

- **Order Groups table** — loaded live from `data/groups.json` via the API.
- **+ Add Order Group** — modal with an order number field and unlimited
  phone number rows (`+ Add Number` / `Remove`).
- **Edit** — same modal, pre-filled, updates `data/groups.json` on save.
- **Delete** — confirmation prompt, then removes the group.
- **Execute** — confirmation prompt, then sends
  `New Order received: <orderNumber>` to every number in that group.
  One failed number does not stop the others. Results are shown
  immediately (✓ / ✗ per number) and appended to
  `data/twilio-response.json`.

## API

| Method | Route                        | Purpose                     |
|--------|-------------------------------|------------------------------|
| GET    | `/api/groups`                 | List all groups              |
| GET    | `/api/groups/:id`              | Get one group                |
| POST   | `/api/groups`                 | Create a group                |
| PUT    | `/api/groups/:id`              | Update a group                |
| DELETE | `/api/groups/:id`              | Delete a group                |
| POST   | `/api/groups/:id/execute`      | Send SMS to every number in the group |

## Project structure

```
sms-manager/
├── server.js                 # Express app + API routes
├── index.js                  # original standalone script — untouched, still runs on its own
├── orders.json                # original data file — untouched
├── twilio-response.json       # original response log — untouched
├── .env
├── package.json
├── data/
│   ├── groups.json            # dashboard's live data source (has stable "id" per group)
│   └── twilio-response.json   # dashboard's execution history
├── services/
│   ├── twilioService.js       # sendSMS() / executeGroup() — same Twilio call as the original index.js
│   └── groupsStore.js         # read/write groups.json, with fallback if missing/invalid
└── public/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Notes

- `data/groups.json` is the source of truth for the dashboard. Groups get
  a stable `id` (e.g. `group-001`) so edits/deletes never rely on array
  position.
- If `data/groups.json` is missing, empty, or invalid JSON, the app falls
  back to a fixed default group instead of crashing.
- Phone numbers are validated for E.164 format (`+` followed by 8–15
  digits) both in the browser and on the server.
- `data/twilio-response.json` keeps growing with each execution — old
  results are never overwritten, just appended to.
- The original `index.js`, `orders.json`, and `twilio-response.json` files
  are left exactly as they were and still work with `node index.js` if
  you ever want to run the old script directly.
- This is local-only: no auth, no database, no webhooks, no hosting — as
  specified.
