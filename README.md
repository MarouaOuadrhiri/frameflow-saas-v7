# FrameFlow SaaS — Production Control Center

A full-stack SaaS rebuild of the FrameFlow studio dashboard:

- **frontend/** — Next.js 15 (App Router) + SCSS, dark gold design system
- **backend/** — Express REST API with JWT auth, multi-tenant (all data scoped per user)
- **database/** — MySQL 8 schema + seed data

## Installation en un clic (PC du client)

1. Copy the whole project folder onto the client's Windows PC (needs XAMPP
   installed with MySQL — `C:\xampp`).
2. **Double-click `INSTALLER.bat`** at the project root (it asks for admin
   rights once).

That's it. The installer does everything, in order:

1. Checks Node.js (installs the LTS via winget if missing).
2. Installs MySQL as an auto-start Windows service (from XAMPP) and starts it.
3. Creates the `frameflow` database and imports `database/schema.sql`.
4. Generates `backend/.env` (random JWT secret, no `CORS_ORIGIN` so the API
   stays open for LAN access) and `frontend/.env.local`.
5. Runs `npm install` in `backend/` and `frontend/` (skipped if already done).
6. Asks for the **2 teammate accounts** (name / email / password) and creates
   them.
7. Runs `scripts/setup-windows.ps1`: silent boot start, `http://project-management`
   hostname, port 80 → 3000 proxy, firewall rules, and generates
   `ACCES-AUTRES-PC.bat` for the teammate's PC.
8. Starts everything now and opens **http://project-management** in the browser.

The installer is **idempotent** — safe to run twice; it never deletes existing
data, `.env` files, or accounts. After a reboot the app starts by itself
(scheduled task `FrameFlowSilentStart`, trigger **ONSTART + 1 minute delay**,
running as SYSTEM, no CMD window), even if nobody logs in.

Existing database? Also run any new files in `database/migrations/` that you
haven't applied yet (e.g. `007_notifications_project_id.sql`).

## Auto-start on Windows (manual setup — fallback)

If you prefer to configure things by hand instead of `INSTALLER.bat`,
right-click **`scripts/setup-windows.ps1`** → **Run as administrator**
(it self-elevates if needed), then restart the PC.

What the script does:

1. **Silent boot start** — creates the scheduled task `FrameFlowSilentStart`
   (trigger: ONSTART with a 1-minute delay, runs as SYSTEM, highest run level)
   which runs `scripts/run-silent.vbs`. At every boot the backend (port 5000)
   and frontend (port 3000) start in the background with **no CMD window at all**,
   even before anyone logs in.
2. **MySQL auto-start** — installs MySQL as a Windows service (from XAMPP's
   `mysqld.exe` if no MySQL service exists yet) and sets it to start
   automatically. No more opening XAMPP or clicking "Start MySQL".
3. **Easy URL** — adds `127.0.0.1 project-management` to the hosts file and a
   port-80 → 3000 proxy (`netsh portproxy`), so the client just opens
   **http://project-management** (no `:3000`).
4. **Firewall** — allows inbound TCP on ports **80, 3000, 5000**
   (rules `FrameFlow-80/3000/5000`), so other PCs on the same Wi-Fi can connect.
5. **Generates `ACCES-AUTRES-PC.bat`** at the project root, pre-filled with
   this PC's LAN IP.

The script is idempotent — safe to run again if something changes.

`start-windows.bat` still exists for a **manual visible start** (two minimized
windows + browser opens automatically).

## Quick start (run everything with one command)

```bash
./dev.sh
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

Press **Ctrl+C** to stop both. The app does **not** create the database
automatically — create it first as explained below.

First login: create your teammate accounts with
`npm run create-admin` (see below), then sign in at
http://localhost:3000. (Testing with demo data?
import `database/seed.demo.sql` and use
**yassine@frameflow.studio** / **demo1234**.)

## Shared team workspace

This SaaS is built for **the studio's two-person team**: both teammates log
in and **see/edit everything** — it is one shared workspace, and there is
**no public sign-up**. The studio's clients never log in — they are simple
contact records under the **Clients** page, not user accounts.

- `POST /api/auth/register` is disabled (returns 403).
- Create one account per teammate with:

```bash
cd backend
npm run create-admin -- "Full Name" teammate@studio.com secret123
```

(run it once per teammate)

The install ships **empty** — no demo users, no demo data — so the studio
starts clean and fills in its own projects, clients and equipment. If you
want the demo dataset for testing instead, import `database/seed.demo.sql`
after `schema.sql` and log in with **yassine@frameflow.studio** / **demo1234**.

## Two PCs on the same Wi-Fi (live sync)

Both teammates can use FrameFlow at the same time from two computers on the
same Wi-Fi. Edits appear instantly on the other screen (Socket.IO live sync).

**On the main PC** (the one running the backend): run
`scripts/setup-windows.ps1` **as administrator** once — it opens the firewall
ports and creates **`ACCES-AUTRES-PC.bat`** at the project root with this PC's
LAN IP baked in.

**On the second PC** (same Wi-Fi), pick one:

- **Option A (recommended):** copy `ACCES-AUTRES-PC.bat` to the second PC,
  right-click → **Run as administrator** **once**. From then on it can open
  **http://project-management** exactly like the main PC.
- **Option B (no setup):** just open `http://<SERVER-IP>` in the browser
  (e.g. `http://192.168.1.42`) and log in with the second teammate account.

No per-PC config needed anymore: the frontend automatically resolves the API
URL from the hostname the browser used, so the same build works on
`localhost`, `http://project-management`, and `http://192.168.x.x`.

Both sessions stay in sync: creating a project, moving a task, or adding an
expense on one PC refreshes the other PC automatically.

## Database setup (phpMyAdmin)

Database name: **`frameflow`**. The app never creates it on its own — you
must create it once, then import the two SQL files in this order:

1. Open phpMyAdmin (usually http://localhost/phpmyadmin), go to the
   **Databases** tab, type `frameflow` and click **Create**.
2. Select the `frameflow` database → **Import** tab →
   choose `database/schema.sql` → **Go**. (creates the tables)
3. Same **Import** tab → choose `database/seed.sql` → **Go**.
   (empty install — the studio starts with no data)

> **Updating an existing install?** Run the migration files once, in order,
> against your existing database:
> `database/migrations/001_project_files.sql`, then `002_equipment_photo.sql`,
> then `003_drop_project_team.sql`, `004_drop_activity_log.sql`,
> `005_equipment_revamp.sql` (drops issues/checklists tables, replaces
> equipment `status` with a `damaged` flag, adds event times + reminder links)
> and `006_project_production_notes.sql` (adds the optional production notes
> field on projects).
> New installs don't need them — `schema.sql` already includes everything.

Then configure the backend connection:

```bash
cd backend
cp .env.example .env   # set DB_USER / DB_PASSWORD to your MySQL user,
                       # DB_NAME must stay: frameflow
npm install
```

## Manual start (without dev.sh)

```bash
cd backend  && npm run dev   # http://localhost:5000
cd frontend && npm run dev   # http://localhost:3000
```

(FIRST time only, in each folder: `npm install`, and copy the `.env.example`
files to `.env` / `.env.local` as shown above.)

## Project structure

```
frameflow-saas/
├── dev.sh                  # run backend + frontend together
├── frontend/               # Next.js 15 App Router + SCSS
│   └── src/
│       ├── app/            # (auth)/login, (auth)/register, (app)/* 14 pages
│       ├── components/     # Sidebar, Topbar, charts, modals, …
│       ├── lib/            # api client, auth context, formatters, icons
│       └── styles/         # SCSS design system
├── backend/                # Express API
│   └── src/
│       ├── routes/         # auth, projects, clients, equipment, expenses,
│       │                   # payments, purchase, issues, tasks, checklists,
│       │                   # events, notifications, dashboard, activity, files
│       ├── middleware/     # JWT auth, error handling
│       └── db.js           # mysql2 pool
├── database/
│   ├── schema.sql
│   ├── seed.sql            # empty install (no demo data)
│   ├── seed.demo.sql       # optional demo dataset for testing
│   └── migrations/         # one-time SQL for existing databases
```

## API overview

All endpoints are prefixed with `/api` and (except auth + health) require
`Authorization: Bearer <jwt>`. Success responses are `{ "data": … }`,
errors are `{ "error": { "message": … } }`.

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Create account → `{user, token}` |
| POST | /api/auth/login | Login → `{user, token}` |
| GET | /api/auth/me | Current user |
| GET | /api/dashboard | KPIs, active projects, alerts, timeline |
| GET/POST | /api/projects | List / create (filter `?status=`) |
| GET/PUT/DELETE | /api/projects/:id | Read / update / delete |
| GET | /api/projects/:id/summary | Budget, profit, expenses, payments |
| GET/POST | /api/clients, /api/equipment, /api/expenses, /api/payments | … |
| GET/POST/PUT/DELETE | /api/purchase-items, /api/issues, /api/tasks, /api/events | … |
| GET | /api/checklists | Templates with groups + items |
| PUT | /api/checklists/items/:id | Toggle checklist item |
| GET | /api/notifications | List |
| PUT | /api/notifications/:id/read, /read-all | Mark read |
| GET | /api/activity | Recent activity |
| GET | /api/files?project_id= | File folders |

## Notes

- Currency is Moroccan Dirham (DH) throughout.
- Every table carries `user_id` — users only ever see their own studio data.
- Seed data mirrors the original demo (6 projects, 14 equipment items, …).
