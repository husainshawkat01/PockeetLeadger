# 💰 PocketLedger

> A private, single-user personal finance tracker with a premium glassmorphism UI.  
> Built with **HTML · CSS · JavaScript · Supabase** — deployable to Vercel in minutes.

---

## ✨ Features

| Module | What it does |
|--------|-------------|
| **Dashboard** | Summary cards + recent transactions |
| **Income** | Track money received (family, work, etc.) |
| **Expenses** | 11 default categories + notes + receipt image |
| **People Ledger** | Track who gave/owe/borrowed with ON/OFF toggles |
| **Bills** | Recurring bills with paid/unpaid status |
| **Reports** | 4 live charts (income/expense, category, debt, balance) |
| **Notes** | Pinnable private notes/reminders |
| **Settings** | Theme, language (EN/বাংলা), currency, export |
| **Export** | CSV · JSON · PDF (Print) |

---

## 🚀 Quick Start

### 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Copy your **Project URL** and **anon public key** from  
   *Settings → API*

### 2 — Run the Schema

Open **SQL Editor** in Supabase and paste the entire contents of `schema.sql`, then click **Run**.

This creates:
- `incomes` · `expenses` · `people_ledger` · `bills` · `notes` · `settings`
- Row Level Security (RLS) policies on every table
- Auto-update triggers for `updated_at`

### 3 — Create Your Admin Account

In Supabase → **Authentication → Users → Invite user**  
Enter your email and set a password. This is the only user who can log in.

*(Or enable Email confirmations off and use "Sign up" then manually confirm.)*

### 4 — Configure `app.js`

Open `app.js` and replace the placeholders at the top:

```js
const SUPABASE_URL = 'https://xxxx.supabase.co';   // ← your project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIs...';    // ← your anon key
```

### 5 — (Optional) Storage for Receipts

In Supabase → **Storage → New Bucket**
- Name: `receipts`
- Public: **No**

Then uncomment the storage RLS policies at the bottom of `schema.sql` and run them.

---

## 🌐 Deploy to Vercel

```bash
# Install Vercel CLI (once)
npm i -g vercel

# From the project folder
vercel deploy
```

Or drag-and-drop the folder into [vercel.com/new](https://vercel.com/new).

No build step required — this is pure static HTML/CSS/JS.

---

## 📁 File Structure

```
PocketLedger/
├── index.html        Login page
├── dashboard.html    Full single-page dashboard
├── style.css         Design system (glassmorphism, dark/light)
├── app.js            All logic: auth, CRUD, charts, export
├── schema.sql        Supabase database schema + RLS
└── README.md         This file
```

---

## 🗂 Database Tables

### `incomes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Auto |
| user_id | uuid FK | auth.users |
| amount | numeric | > 0 |
| source | text | Who/what |
| transaction_date | date | |
| note | text | Optional |

### `expenses`
Same structure as incomes + `category text` + `receipt_url text`

### `people_ledger`
| Column | Type | Notes |
|--------|------|-------|
| person_name | text | |
| amount | numeric | |
| gave_money | boolean | I gave to them |
| took_money | boolean | I received from them |
| owes_me | boolean | They owe me (unsettled) |
| i_owe | boolean | I owe them (unsettled) |
| is_settled | boolean | Cleared/paid |

### `bills`
title · amount · due_date · is_paid · note

### `notes`
title · content · is_pinned

---

## 🔒 Security

- **Row Level Security** on every table — data is user-scoped
- **Protected dashboard** — redirects to login if no session
- **Auto logout** after 30 minutes of inactivity
- **Single admin account** — no public sign-up

---

## 🎨 Design

- Dark navy base (`#090d1a`) with gold (`#d4af37`) accents
- Glassmorphism cards with `backdrop-filter: blur`
- Fonts: **Playfair Display** (headings) + **DM Sans** (body)
- Fully responsive: sidebar on desktop, bottom nav + FAB on mobile
- Light/Dark mode toggle with localStorage persistence
- Bangla/English language toggle

---

## 📤 Export Formats

| Format | Contents |
|--------|----------|
| CSV | All incomes, expenses, ledger, bills |
| JSON | Full backup of all tables |
| PDF | Browser print dialog (Ctrl+P) |

---

## 🛠 Customisation

**Add a new expense category:**  
In `dashboard.html` — find both `<select id="expense-category">` and `<select id="expense-cat-filter">` and add your `<option>`.

**Change inactivity timeout:**  
In `app.js` — `const INACTIVITY_LIMIT = 30 * 60 * 1000;` (milliseconds)

**Change currency symbol:**  
Settings → Currency dropdown (BDT/USD). To add more, extend the `fmt()` function in `app.js`.

---

## 📄 License

Private personal use. Not for redistribution.
