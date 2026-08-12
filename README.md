# SMS Order Group Manager (Local)

Local Node.js + Twilio dashboard for managing SMS "order groups" — each
group is an order number tied to a list of phone numbers that should
receive the same SMS.

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/akshaysain-dev/twilio-sms-app.git
```

### 2. Go to the project directory
```bash
cd twilio-sms-app
```

### 3. Install Node.js dependencies
Install all dependencies from `package.json` (this installs `express`,
`twilio`, and `dotenv` together, plus their sub-dependencies, into a
local `node_modules/` folder):
```bash
npm install
```

### 4. Install Express (if installing separately)
```bash
npm install express
```
`express` runs the local web server and the REST API
(`/api/groups`, `/api/groups/:id`, `/api/groups/:id/execute`) that the
dashboard talks to.

### 5. Install Twilio (if installing separately)
```bash
npm install twilio
```
`twilio` is used for connecting to the Twilio API and sending SMS
messages (`services/twilioService.js`).

### 6. Install dotenv (if installing separately)
```bash
npm install dotenv
```
`dotenv` loads environment variables from the `.env` file so Twilio
credentials never sit directly in the code.

### 7. Create the environment file
Create a `.env` file in the project root:
```env
TWILIO_SID=your_twilio_account_sid
TWILIO_AUTH=your_twilio_auth_token
TWILIO_PHONE=your_twilio_phone_number
PORT=3000
```
Example:
```env
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH=your_auth_token
TWILIO_PHONE=+1234567890
PORT=3000
```
**Important:** Never commit the `.env` file to GitHub — it contains
sensitive Twilio credentials. It's already listed in `.gitignore`.

### 8. Run the application
```bash
node server.js
```
If the server starts successfully:
```text
SMS Order Group Manager running at http://localhost:3000
```

Then open **http://localhost:3000** in your browser to use the
dashboard.

> Note: the original standalone script still works too —
> `node index.js` sends SMS straight from `orders.json` to
> `twilio-response.json`, exactly as before. `server.js` is the new
> dashboard on top of the same Twilio logic; it doesn't replace or
> break the old script.

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
├── package.json               # lists express, twilio, dotenv as dependencies
├── package-lock.json           # exact installed versions (created by npm install)
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

## Login / Basic Auth

The moment this app is reachable from anywhere other than your own
`localhost`, anyone who finds the URL can add groups, delete groups, and
**send real SMS through your Twilio account** — no login was needed
before because only you could reach `localhost:3000`.

Set these in `.env` before deploying:
```env
ADMIN_USER=admin
ADMIN_PASS=change-this-password
```
Every request (page, API, everything) then requires that username/password
via the browser's built-in login prompt. If you leave these blank the
server still runs, but prints a warning and skips auth — fine for local
testing only.

## Deploying to a server

This app is a plain Node.js + Express process — it doesn't need anything
exotic. Two common paths:

### Option A — PaaS (Render, Railway, Fly.io) — easiest

1. Push this project to a GitHub repo (make sure `.env` stays out of it —
   `.gitignore` already excludes it).
2. Create a new "Web Service" on the platform, connect your repo.
3. Set the **start command** to `node server.js`.
4. In the platform's dashboard, add these as environment variables
   (not in a committed `.env` file):
   ```
   TWILIO_SID=...
   TWILIO_AUTH=...
   TWILIO_PHONE=...
   ADMIN_USER=...
   ADMIN_PASS=...
   PORT=3000
   ```
   Most platforms inject their own `PORT` automatically — that's fine,
   `server.js` already reads `process.env.PORT` first.
5. Deploy. You get a public HTTPS URL automatically — no domain,
   Nginx, or SSL setup needed.

### Option B — Your own VPS (DigitalOcean, AWS EC2, Hostinger VPS, etc.)

1. **SSH into the server**, install Node.js (v18+ recommended):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
2. **Get the code onto the server**:
   ```bash
   git clone https://github.com/akshaysain-dev/twilio-sms-app.git
   cd twilio-sms-app
   npm install
   ```
3. **Create `.env` directly on the server** (never commit it):
   ```bash
   nano .env
   ```
   Paste in `TWILIO_SID`, `TWILIO_AUTH`, `TWILIO_PHONE`, `ADMIN_USER`,
   `ADMIN_PASS`, `PORT`.
4. **Keep it running with PM2** (so it survives SSH disconnects and
   auto-restarts on crash or server reboot):
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name sms-manager
   pm2 save
   pm2 startup
   ```
5. **Put it behind Nginx** so you can use port 80/443 and a real domain
   instead of `:3000`. Example `/etc/nginx/sites-available/sms-manager`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```
   Then:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sms-manager /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
6. **Add free HTTPS** with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
7. **Open the firewall** for HTTP/HTTPS only (keep port 3000 closed to
   the outside world — Nginx talks to it over `localhost`):
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

Either way, once it's live: set `ADMIN_USER`/`ADMIN_PASS`, double-check
`.env` isn't in your git history, and you're good to go.

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
- Running `npm install` creates a `node_modules/` folder here containing
  `express`, `twilio`, `dotenv`, and their own sub-dependencies. It's
  listed in `.gitignore` and safe to delete any time — just run
  `npm install` again to rebuild it.
