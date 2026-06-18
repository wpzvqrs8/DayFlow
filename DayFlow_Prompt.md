# DayFlow — Full-Stack AI Agent Build Prompt

> **Use this prompt with any AI coding agent (Cursor, Windsurf, Lovable, v0, Claude Code, etc.)**
> Copy the entire contents of this file as your initial prompt.

---

## 🧠 Project Identity

You are building **DayFlow** — a personal productivity and self-tracking web application built **exclusively for a single user**. The app must feel premium, calm, and distraction-free. Think of it as a private journal meets analytics dashboard.

**Core Constraint:** This application is designed for exactly one user — you. Every feature, authentication layer, and data boundary must enforce this single-user architecture. No sign-ups, no multi-user support, no social features.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL) — `https://rzzlnmvinarratyazuwv.supabase.co/rest/v1/` |
| Auth | Custom Password Gate (httpOnly JWT cookie, see Security section) |
| Charts | Recharts |
| Icons | Lucide React |
| Date Handling | date-fns |
| Font | Inter or Plus Jakarta Sans (via `next/font`) |
| State Management | React Context + SWR for server state |
| Deployment | Vercel |

---

## 🔐 Authentication — CRITICAL REQUIREMENT

> This app is **single-user only**. No registration. No OAuth. No email. Just a password.

### Philosophy
Traditional multi-user auth (NextAuth, OAuth, email/password registration) is overkill and introduces unnecessary attack surface. Instead, implement a **stateless password gate** that is both secure and frictionless.

### How it works:
1. On every full page load (or after session expiry), the user sees a **full-screen lock screen** — no dashboard content is rendered or fetched until authenticated.
2. User enters a single password.
3. A Next.js API route fetches the bcrypt hash from `app_config` in Supabase and compares using `bcryptjs`.
4. On success, a **signed JWT** is issued (secret from env var) with **24-hour expiry** and stored in an **httpOnly cookie** (`dayflow_session`).
5. A Next.js **middleware** validates this cookie on every page and API route request.
6. On expiry or invalid cookie, user is redirected back to the lock screen.
7. A **Lock** button in the sidebar clears the cookie and returns to the gate.

### Rate Limiting:
- 5 failed attempts per minute per IP (enforced in middleware or API route)
- After 5 failures: 60-second cooldown with countdown timer displayed

### First-Run Setup:
- If `setup_complete = false` in `app_config`, the lock screen shows **"Create Your Password"** instead of "Enter Password"
- User sets password (min 8 chars, strength indicator shown)
- Password is hashed and stored; 5 default tasks are seeded; `setup_complete` set to `true`
- User is authenticated and redirected to dashboard

### Lock Screen UI:
- Full viewport, `#F6F4F8` background
- Centered white card: 420px max-width, 24px padding, 20px radius
- Lock icon in `--accent-purple` container (48px)
- Title: "Welcome Back" (24px/600)
- Subtitle: "Enter your password to access DayFlow" (14px, `--text-secondary`)
- Single password input with show/hide eye icon toggle
- "Unlock DayFlow" button — full-width, `--accent-blue`, loading spinner on submit
- Subtle tagline: *"Personal. Private. Yours."*
- Wrong password: horizontal shake animation (400ms) + red error text
- No "forgot password" link — you know your password
- Optional: very subtle animated gradient background for premium feel

### Utility Script — `scripts/hash-password.js`:
```js
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('your_chosen_password', 10);
console.log(hash);
// Paste this output into your app_config Supabase row
```

### `app_config` table schema:
```sql
create table app_config (
  id integer primary key default 1,
  password_hash varchar(255) not null,
  setup_complete boolean default false,
  created_at timestamptz default now()
);
```

### Session Details:
- JWT secret: `DAYFLOW_JWT_SECRET` env variable (min 32 chars)
- Cookie name: `dayflow_session`
- Expiry: 24 hours
- No refresh tokens — simplicity for single user
- All `/api/*` routes and pages protected via Next.js middleware

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

### `daily_reports`
```sql
create table daily_reports (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  score integer check (score >= 0 and score <= 100) default 50,
  accomplishments text,
  challenges text,
  reflections text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

> **Score is 0–100** (not 0–10). This gives finer-grained daily tracking. Display as a large number with color coding.

### `tasks`
```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title varchar(255) not null,
  is_default boolean default false,
  date date not null,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Seed default tasks for today (replace date with actual today's date or handle in app)
insert into tasks (title, is_default, date) values
  ('Morning Routine', true, current_date),
  ('Deep Work Block', true, current_date),
  ('Exercise / Movement', true, current_date),
  ('Reading / Learning', true, current_date),
  ('Evening Review', true, current_date);
```

> Default tasks auto-populate for each new day if not already present (handled in API route on first fetch of the day).

### `daily_notes`
```sql
create table daily_notes (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### `app_config`
*(See Authentication section above)*

### Row Level Security (RLS):
Enable RLS on all tables. Since this is single-user, policies can be permissive for service-role authenticated requests — the JWT middleware layer ensures only the owner accesses data.

---

## 📐 Design System — STRICT

### CSS Variables (add to `globals.css`):
```css
:root {
  /* Backgrounds */
  --bg-primary: #F6F4F8;
  --bg-secondary: #F8F7FA;
  --bg-card: #FFFFFF;

  /* Borders */
  --border-soft: #E7E5EA;

  /* Text */
  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;

  /* Accents */
  --accent-blue: #3B82F6;
  --accent-purple: #A855F7;
  --accent-green: #22C55E;
  --accent-orange: #F59E0B;
  --accent-red: #EF4444;

  /* Accent tints (icon container backgrounds) */
  --accent-blue-bg: rgba(59, 130, 246, 0.1);
  --accent-purple-bg: rgba(168, 85, 247, 0.1);
  --accent-green-bg: rgba(34, 197, 94, 0.1);
  --accent-orange-bg: rgba(245, 158, 11, 0.1);
  --accent-red-bg: rgba(239, 68, 68, 0.1);
}
```

### Tailwind Config Extension:
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#F6F4F8',
        card: '#FFFFFF',
        border: '#E7E5EA',
        accent: {
          blue: '#3B82F6',
          purple: '#A855F7',
          green: '#22C55E',
          orange: '#F59E0B',
          red: '#EF4444',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        }
      },
      borderRadius: {
        card: '16px',
        'card-lg': '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    }
  }
}
```

### Typography Scale:
| Role | Size | Weight | Use |
|---|---|---|---|
| Display | 32px | 700 | Page titles |
| H1 | 24px | 600 | Section headers |
| H2 | 18px | 600 | Card titles |
| Body | 14px | 400 | Standard text |
| Caption | 12px | 500 | Labels, metadata |
| Small | 11px | 500 | Timestamps, badges |

### Spacing System:
- Base unit: 4px
- Card padding: 24px
- Section gap: 24px
- Inner element gap: 12–16px
- Page horizontal padding: 32px (desktop), 16px (mobile)
- Max content width: 1280px, centered

### Component Primitives:

**Cards:**
- Background: `#FFFFFF`
- Border: `1px solid #E7E5EA`
- Border Radius: 16px (standard), 20px (feature cards)
- Shadow: `0 1px 3px rgba(0,0,0,0.04)` — extremely subtle
- Hover shadow: `0 4px 12px rgba(0,0,0,0.06)` + `translateY(-2px)`

**Icon Containers:**
- Size: 40×40px, border-radius: 12px
- Background: tinted accent (e.g., `--accent-blue-bg`)
- Icon: 20px, respective accent color

**Buttons:**
- Primary: `--accent-blue` bg, white text, 8px vertical / 16px horizontal padding, 10px radius
- Secondary: White bg, `--border-soft` border, `--text-primary` text
- Ghost: Transparent, hover `--bg-secondary`

**Inputs:**
- Background: `#FFFFFF`
- Border: `1px solid --border-soft`, radius 12px
- Focus: `2px --accent-blue` ring
- Padding: 12px 16px

---

## 📁 File & Folder Structure

```
src/
├── app/
│   ├── page.tsx                    # Lock screen / redirect to dashboard
│   ├── dashboard/
│   │   └── page.tsx                # Main dashboard
│   ├── calendar/
│   │   └── page.tsx                # Full calendar view
│   ├── analytics/
│   │   └── page.tsx                # Stats & insights
│   ├── settings/
│   │   └── page.tsx                # App settings
│   ├── api/
│   │   ├── auth/verify/route.ts
│   │   ├── auth/logout/route.ts
│   │   ├── reports/[date]/route.ts
│   │   ├── tasks/route.ts
│   │   ├── tasks/[id]/route.ts
│   │   ├── notes/[date]/route.ts
│   │   ├── analytics/route.ts
│   │   └── export/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── auth/
│   │   └── LockScreen.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   ├── dashboard/
│   │   ├── ScoreGraph.tsx
│   │   ├── ScoreInput.tsx
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── DailyNote.tsx
│   │   ├── MiniCalendar.tsx
│   │   ├── DateHeader.tsx
│   │   └── StreakBadge.tsx
│   ├── analytics/
│   │   ├── WeeklyTrend.tsx
│   │   ├── Heatmap.tsx
│   │   └── StatCard.tsx
│   └── shared/
│       ├── IconContainer.tsx
│       ├── AutoSaveIndicator.tsx
│       └── ProgressBar.tsx
├── lib/
│   ├── supabase.ts
│   ├── auth.ts                     # JWT helpers
│   ├── utils.ts
│   └── constants.ts                # Default tasks, color maps
├── hooks/
│   ├── useAuth.ts
│   ├── useDailyReport.ts
│   ├── useTasks.ts
│   └── useNotes.ts
├── types/
│   └── index.ts
├── middleware.ts                   # JWT validation on all routes
└── styles/
    └── globals.css
```

---

## 🖥️ Dashboard Layout

**Structure:** Fixed Sidebar (240px) + Scrollable Main Content Area

### Sidebar:
- Logo + "DayFlow" wordmark at top (24px padding)
- Nav items with icons: Dashboard, Calendar, Analytics, Settings
- Active state: `--accent-blue-bg` background, `--accent-blue` text + icon
- Hover: `--bg-secondary`
- Bottom section: "You" pill with green dot + **Lock** button

### Top Bar (64px, sticky):
- Left: Greeting ("Good morning ☀️") + full date ("Thursday, June 19, 2026")
- Right: **Today** button (jumps to current date) + session expiry bell icon

### Main Content Grid:
- Desktop: 12-column grid
- Tablet: 8-column
- Mobile: Single column stack

### Layout Order:
1. **Date Header** — large date display + score input
2. **Score Graph** — full width
3. **Two-column row** — Task List (left) + Daily Note (right)
4. **Mini Calendar** — below or in sidebar panel

---

## 📊 Feature 1 — Daily Score Graph

### Data & Logic:
- Score range: **0–100**
- X-axis: Last 30 days (abbreviated dates: "Jun 19")
- Y-axis: 0–100
- Missing days: show default score of `50` rendered as dashed/muted line segment
- Time range switcher: **7 days / 30 days / All time** (tabs above graph)

### Recharts Config:
- Chart type: `AreaChart`
- Line: `--accent-blue`, 2px stroke, `type="monotone"`
- Area fill: gradient from `--accent-blue` at 20% opacity → transparent
- Dots: 6px, `--accent-blue` fill, 2px white stroke
- Today's dot: 8px, `--accent-purple` fill
- Grid: horizontal lines only, `--border-soft` at 0.5px opacity
- Animation: line draws on mount over 1 second

### Interactivity:
- Hover tooltip: date + score + note preview (first 60 chars)
- Click any point: navigate to that day's detail view
- Empty state (< 2 entries): flat line at 50 + message "Start logging your days to see trends"

### Card UI:
- Title: "Progress" with purple icon container
- Subtitle: `🔥 N day streak` (via `StreakBadge` component)
- Graph height: 220px

---

## ✅ Feature 2 — Task List

### Data Model:
- Tasks are **date-scoped** — each day has its own instance of the default 5 tasks
- Default tasks auto-populate on first API fetch for a new date
- Custom tasks are also date-scoped

### UI Per Task Row:
- Custom checkbox: 20×20px, 6px radius
  - Unchecked: white bg, `--border-soft` border
  - Checked: `--accent-green` bg, white ✓
- Title: 14px, strikethrough + `--text-muted` when checked
- Completion time shown when checked (e.g., "Completed at 9:42 AM")
- Hover: `--bg-secondary` row background
- Delete button (trash icon): appears on hover, only for custom tasks

### Card Header:
- Title: "Today's Tasks" with blue icon container
- Progress bar: 4px height, `--accent-green` fill, `--bg-secondary` track
- Badge: "4 / 5 done today"

### Sections:
- **Default Tasks** (labeled)
- Separator
- **Custom Tasks** (labeled, or hidden if empty with subtle message)
- "Add a task..." inline input at bottom → press Enter or click `+` to add

### Optimistic Updates:
- Checkbox toggle updates UI immediately; syncs to API in background
- If API fails, revert and show subtle error toast

---

## 📝 Feature 3 — Daily Notes

### Data:
- One note per date, stored in `daily_notes` table
- Markdown supported (bold, italic, bullet lists)

### Editor:
- `<textarea>` (or lightweight Markdown editor)
- Minimal toolbar: Bold, Italic, Bullet list (icon-only buttons above textarea)
- `min-height: 200px`, `max-height: 400px` (scrollable)
- Background: `--bg-secondary`, border: `1px solid --border-soft`, radius 12px
- Padding: 16px, font: 14px / 1.6 line-height
- Placeholder: *"Write about your day, ideas, or reflections..."*

### Auto-save:
- Debounce: 1 second after typing stops
- Status indicator (bottom-right of card):
  - Typing: nothing
  - Saving: "Saving…" in `--text-muted`
  - Saved: "Saved ✓" in `--accent-green`, fades out after 2s

### Historical View:
- When viewing a past date: note is **read-only** with `--bg-secondary` background
- "Edit" toggle button to enable editing for past dates

### Card UI:
- Title: "Daily Notes" with orange icon container
- Word count badge: "124 words" (top right of card)
- Bottom row: char count (left) + save status (right)

---

## 📅 Feature 4 — Calendar

### Mini Calendar (Dashboard):
- Month view, 7-column grid
- Month/Year header with `‹` `›` prev/next arrows
- Today: `--accent-blue` filled circle, white text
- Selected date: `--accent-purple` filled circle, white text
- Data indicators (4px dot below date number):
  - Score 80–100: `--accent-green` dot
  - Score 60–79: `--accent-blue` dot
  - Score 40–59: `--accent-orange` dot
  - Score 0–39: `--accent-red` dot
  - Note present (no score): `--accent-blue` dot, outlined
  - No data: no dot
- Other-month days: `--text-muted` at 50% opacity
- Keyboard navigation: arrow keys + Enter

### Full Calendar Page (`/calendar`):
- Large month grid with bigger cells
- Each cell shows: date number, score badge (colored), task completion mini-bar, note indicator icon
- Click cell: navigate to that day's dashboard view
- Month/year navigation

---

## 📄 Day Detail View

**Trigger:** Click a graph point or calendar date → dashboard updates to that date, OR navigate to `/dashboard?date=YYYY-MM-DD`

### Date Header Component:
- Large date: "Wednesday, June 18, 2025" (32px/700)
- `←` Previous day / `→` Next day arrows
- "Back to Today" button if viewing past

### Score Display:
- Large number (48px) with label "Daily Score"
- Color coded: 80–100 `--accent-green`, 60–79 `--accent-blue`, 40–59 `--accent-orange`, 0–39 `--accent-red`
- Today: editable (slider or number input with +/− buttons)
- Past dates: read-only colored badge

### Daily Report Fields (auto-saving textareas):
- **Accomplishments**: "What did you achieve today?"
- **Challenges**: "What obstacles did you face?"
- **Reflections**: "Any thoughts or insights?"

---

## 📈 Feature 5 — Analytics Page (`/analytics`)

Four stat cards in a 2×2 grid:

### Weekly Trend:
- Bar chart (Recharts): last 7 days, score per day
- Bars: `--accent-blue` fill, 12px top radius
- Dashed `--accent-purple` horizontal average line
- X-axis: day abbreviations (Mon, Tue…)

### Monthly Heatmap:
- GitHub-style contribution grid: 7 rows (days) × 5–6 columns (weeks)
- Color intensity by score: light `--accent-blue-bg` → dark `--accent-blue`
- Hover tooltip: date + score
- Legend: "Low → High" color scale

### Consistency Streak:
- Large number: "12 day streak"
- Flame icon in `--accent-orange` container
- Subtitle: "Keep it up!" or "Start your streak today!"

### Task Completion Rate:
- Donut chart: completed vs total tasks (last 30 days)
- Center text: "87%"
- Colors: `--accent-green` (completed), `--bg-secondary` (remaining)

### Average Score Card:
- Large metric: "72.4"
- Trend indicator: "+2.3 vs last month" with up/down arrow

---

## ⚙️ Feature 6 — Settings Page (`/settings`)

### Security Section:
- Change Password: current password → new password → confirm
- Session info: "Active since [time], expires in [countdown]"
- "Lock Now" button

### Data Management:
- **Export Data**: Download all records as JSON (via `/api/export`)
- Last export date display
- **Danger Zone**: "Clear All Data" button → confirmation modal with typed confirmation ("DELETE")

### Preferences Section:
- **Default Tasks Editor**: Add / remove / reorder the 5 default task titles
- Start of week: Sunday / Monday toggle
- Theme: Light (default) / Dark (future)

---

## 🧩 shadcn/ui Components to Install

```bash
npx shadcn-ui@latest add button card input textarea checkbox badge
npx shadcn-ui@latest add separator scroll-area skeleton dialog tooltip
npx shadcn-ui@latest add popover slider
```

---

## ⚙️ API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/verify` | POST | Verify password, issue JWT cookie |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/reports/[date]` | GET / POST / PUT | Daily report CRUD |
| `/api/tasks` | GET / POST | List/create tasks for a date |
| `/api/tasks/[id]` | PUT / DELETE | Update/complete/delete task |
| `/api/notes/[date]` | GET / POST / PUT | Daily note CRUD |
| `/api/analytics` | GET | Aggregated stats (streak, avg, rates) |
| `/api/export` | GET | Full data export as JSON |

**All routes protected by middleware JWT check. Return `401` for unauthorized.**

---

## 🌱 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rzzlnmvinarratyazuwv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
DAYFLOW_JWT_SECRET=your_256bit_secret_minimum_32_chars
DAYFLOW_COOKIE_NAME=dayflow_session

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the **service role key** only in server-side API routes. Never expose it to the client. Initialize Supabase client in a single `lib/supabase.ts` file.

---

## 🌀 State Management

### Global Context (`AppContext`):
```ts
{
  selectedDate: string;       // "YYYY-MM-DD", default today
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### Data Fetching:
- Use **SWR** for all server state
- Optimistic updates for task completion (revert on error)
- Revalidate on window focus for real-time sync feel

### Local State:
- Form inputs before auto-save
- UI toggles (sidebar collapsed, calendar month)

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, bottom nav bar, full-width cards |
| Tablet | 640–1024px | 2-column grid, collapsible sidebar |
| Desktop | > 1024px | Full fixed sidebar, 3-column dashboard grid |

---

## 🎨 Animations & Micro-interactions

| Element | Animation |
|---|---|
| Page transitions | Fade + `translateY(20px → 0)`, 300ms ease-out |
| Card hover | `translateY(-2px)` + deeper shadow |
| Checkbox check | Scale bounce (`1 → 1.2 → 1`) + color fill animation |
| Score number | Count-up animation when value changes |
| Auto-save indicator | Fade in/out, 200ms |
| Password wrong | Horizontal shake, 400ms |
| Graph on mount | SVG stroke draw animation, 1s |
| Calendar day select | Scale pulse on click |
| Lock screen | Fade out → dashboard fades in on success |

---

## 🚀 First-Run Initialization Flow

1. Run `node scripts/hash-password.js` → copy the output hash
2. Insert hash into Supabase `app_config` table (or let first-run UI handle it)
3. Run all SQL migrations to create tables
4. Set env variables in `.env.local`
5. `npm run dev` → lock screen appears
6. Enter your password → dashboard loads for the first time
7. Default tasks are auto-seeded for today
8. Set today's score, check tasks, write your first note

---

## ✅ Done Definition — Success Criteria

- [ ] Lock screen blocks ALL content on every fresh load; valid 24h session skips it
- [ ] Password is never in client-side code; only bcrypt hash in DB
- [ ] Middleware protects every page and API route
- [ ] Dashboard shows graph, tasks, note, and calendar
- [ ] Score is 0–100, color-coded, editable for today, read-only for past
- [ ] Graph renders 30-day history; missing days default to 50 (dashed)
- [ ] Clicking graph point or calendar date loads that day's data
- [ ] Default tasks auto-populate for each new date
- [ ] Tasks save completion per-date; unchecking restores correctly
- [ ] Note auto-saves with 1s debounce; past notes are read-only by default
- [ ] Calendar dots reflect score ranges with correct colors
- [ ] Analytics page renders all 4 stat widgets with real data
- [ ] Settings: password change, data export, and default task editor all work
- [ ] All data persists in Supabase across sessions and devices
- [ ] Fully responsive: mobile, tablet, desktop
- [ ] Lock button returns to password gate immediately
- [ ] App is deployable to Vercel with env vars

---

## 🔑 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + /` | Focus date jump / search |
| Arrow keys | Navigate calendar days |
| `Enter` | Select calendar date |
| `Escape` | Close modals / popovers |

---

*Built for one. Yours alone. — DayFlow*
