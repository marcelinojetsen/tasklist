# Tasklist — Personal Backlog (Kanban)

An Asana-style kanban board to manage your personal backlog, built with
**Next.js + Tailwind + @dnd-kit + Supabase**.

## Features

- **Kanban board** with drag & drop between columns and reordering within a column
- **Add / rename / delete columns**
- **Add tasks** inline, open a **detail modal** to edit
- **Mark done** from the card or the detail view
- **Assign** tasks to a **team member**
- **Start date** and **due date** (overdue tasks highlighted)

## Setup

### 1. Configure Supabase

Create `.env.local` from the example and fill in your project values
(Supabase dashboard → **Project Settings → API**):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

### 2. Create the database schema

Open the Supabase **SQL Editor** and run the contents of
[`supabase/schema.sql`](supabase/schema.sql). This creates the `columns`,
`tasks`, and `team_members` tables, sets up permissive RLS policies (personal
single-user app, no login), and seeds three default columns.

### 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Notes

- Auth is intentionally omitted — RLS currently allows anonymous full access.
  If you later add Supabase Auth, tighten the policies in `schema.sql`.
- Task ordering is stored in a numeric `position` column, recomputed on drop.
