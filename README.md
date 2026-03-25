# Golf Charity Platform (HEA)

A high-performance, full-stack Next.js application that combines golf score tracking, charitable contributions, and a unique monthly subscription prize pool.

---

## 🧪 Quick Test Access
For immediate testing, use the following pre-configured credentials:

| Role          | Email                  | Password      | Capabilities                              |
|---------------|------------------------|---------------|-------------------------------------------|
| **Standard**  | `test@example.com`     | `Password123` | Log scores, Subscribe, View results       |
| **SysAdmin**  | `omdhangar24@gmail.com`| `Password123` | Execute draws, Manage users, Add charities|

---

## 🔄 Application Flow

### 1. User Journey (Golfers)
1.  **Onboarding:** User signs up and selects their preferred **Charity** to support.
2.  **Subscription:** User upgrades to a Monthly/Yearly plan via **Razorpay**.
    *   *System Action:* 40% of the sub fee goes to the Prize Pool, 10%+ goes to their chosen charity.
3.  **Active Engagement:** User logs their golf scores (Stableford 1-45).
    *   *System Action:* The database maintains the user's **Latest 5 Scores** (Rolling 5 Logic).
4.  **The Draw:** User participates in the monthly draw using their last 5 scores.
5.  **Winning:** If the user's scores match 3, 4, or 5 numbers in the monthly draw, they win a tier of the prize pool.

### 2. Administrator Journey (Platform Management)
1.  **System Monitoring:** View real-time reports on Revenue, User growth, and active ticket counts in the **Command Center**.
2.  **Charity Management:** Add or update verified charities with logos and missions.
3.  **The Draw Engine:**
    *   **Configure:** Set up the monthly prizes and pool details.
    *   **Simulate:** Run a test draw to see projected winners based on actual user scores.
    *   **Execute:** Officially publish the draw, commit results to the ledger, and notify winners.
4.  **Verification:** Review player score screenshots for high-value prize claims.

---

## 🛠 Tech Stack
-   **Frontend:** Next.js 15+ (App Router), React 19, Tailwind CSS
-   **Backend:** Next.js API Routes, Supabase (PostgreSQL)
-   **Auth:** Supabase Auth (JWT & Role-Based Access)
-   **Payments:** Razorpay (Subscription Modal + Webhooks)
-   **Storage:** Cloudinary (Charity logos & Winner proofs)
-   **Logic:** Custom Draw Engine (Random vs. Algorithmic modes)

---

## ⚙️ Setup & Local Development

### 1. Prerequisites
-   Node.js (v18.0.0 or higher)
-   A [Supabase](https://supabase.com/) account
-   A [Razorpay](https://razorpay.com/) account (Test mode)

### 2. Environment Configuration
Create a `.env.local` file and populate:
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Schema
Run the SQL found in `/supabase/schema.sql` in your Supabase SQL Editor. This initializes all tables, RLS policies, and triggers (including the Rolling 5 logic).

### 4. Running Locally
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` to begin.

---

*Copyright © 2026 Golf Charity Platform. All rights reserved.*
