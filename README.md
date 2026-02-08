# Exora — Universal Work Accountability

One system for **remote**, **onsite**, and **field** work. Event-based work logs with proof, weekly commitments, and weekly reviews. No manager approvals; admin manages and configures everything.

## Stack

- **Next.js 15** (App Router), TypeScript, Tailwind CSS
- **PostgreSQL** + Prisma
- **Auth:** JWT in HTTP-only cookie (admin vs employee)
- **Proof storage:** Local `public/uploads/` (replace with S3/R2 in production)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — PostgreSQL connection string (see below)
   - `JWT_SECRET` — at least 32 characters
   - `ADMIN_PASSWORD` — used when seeding the first admin (optional; default `admin123`)

   **Database credentials (fixing P1000 authentication errors):**

   - Use the **username and password** that your PostgreSQL server actually uses. Common cases:
     - **Local install:** The password you set for the `postgres` user during installation (or leave blank if you set it to no password: `postgresql://postgres:@localhost:5432/ExoraOps?schema=public`).
     - **Docker:** Same as in your `POSTGRES_USER` / `POSTGRES_PASSWORD` (e.g. `postgres` / `postgres` if you used the default).
     - **Cloud (e.g. Supabase, Neon):** Use the connection string they give you (username, password, host, port, database).
   - Create the database if it doesn’t exist. In `psql` or any SQL client: `CREATE DATABASE "ExoraOps";` (or `CREATE DATABASE exoraops;` and use `exoraops` in the URL).
   - Ensure PostgreSQL is running and reachable at the host/port in the URL.

3. **Database**

   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   - App: http://localhost:3000  
   - Login as admin: `admin@exora.local` / `admin123` (or the password you set in `.env`)

## How to test the web app

1. **Apply schema and seed data** (if you haven’t yet):
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

3. **Open in a browser:** http://localhost:3000

4. **Log in as admin:** `admin@exora.local` / `admin123` (or the password in your `.env`). You should land on the Admin dashboard.

5. **Quick test as admin:**
   - **Config** — Week definition, work types, proof types (seed adds defaults).
   - **Teams** — Add a team (e.g. “Operations”).
   - **Employees** — Add a test employee (email, name, password); remember the password.
   - **Tasks** — Add a milestone, add a task, add subtasks, assign the task to the test employee (or assign subtasks to them).
   - **Commitments / Work logs / Reviews** — View lists (empty until employees submit).

6. **Test as employee:** Sign out, then log in with the test employee. Try:
   - **My tasks** — See assigned task, expand it, mark subtasks done.
   - **Weekly commitment** — Submit “This week, success means: …”
   - **Work logs** — Add a log (date, work type, description, at least one proof: upload a file or paste a URL).
   - **Weekly review** — Answer Yes/No for the week.

7. **Back as admin:** Log in as admin again and check **Dashboard**, **Commitments**, **Work logs**, **Reviews** to see the employee’s data.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production
- `npm run db:push` — apply Prisma schema
- `npm run db:seed` — seed admin, work modes, proof types, week definition
- `npm run db:studio` — Prisma Studio

## Policy

See [POLICY.md](POLICY.md) for the one-page internal accountability policy.
