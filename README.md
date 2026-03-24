# Golf Charity Platform

A modern, full-stack Next.js application that combines golf scoring, charity donations, and a monthly subscription prize pool. Built with Next.js App Router, Supabase, and Razorpay.

## 🚀 Backend Features

This platform leverages a robust backend architecture built directly into Next.js API Routes and powered by Supabase PostgreSQL.

### 1. Authentication & Authorization (Supabase Auth)
- **Role-Based Access Control (RBAC):** Three predefined roles - Public (Anon), User, and Admin.
- **Middleware Protection:** Custom Next.js middleware restricts access to dashboard and admin routes, redirecting unauthenticated users cleanly.

### 2. Subscriptions & Payments (Razorpay)
- **Recurring Plans:** Support for Monthly and Yearly subscription models.
- **Webhook Integration:** Seamless capture of Razorpay webhooks (`webhook/razorpay`) to manage subscription lifecycles (created, active, paused, cancelled).
- **Automated Financial Splits:** On successful payment, the backend automatically calculates and stores the percentage allocated to the **Prize Pool** (e.g., 50%) and **Charity Contributions** (user-selected, minimum 10%).

### 3. Charity Directory & Donations
- **Comprehensive Profiles:** Storage for charity details, logos, and upcoming events. Full-text search enabled directly in PostgreSQL.
- **Donation Tracking:** Supports both automated subscription-share donations and one-off independent donations.

### 4. Golf Scores Tracking System
- **Stableford Logging:** Strict validation (1-45 range limits) using Zod.
- **Rolling 5 Logic:** Enforced natively via a PostgeSQL database trigger. When a user logs a 6th score, the database autonomously drops the oldest one, ensuring exactly 5 most recent scores are kept.

### 5. Monthly Draw Engine
- **Draw Lifecycle:** Draft -> Simulation -> Published states.
- **Prize Pool & Jackpot:** Automatically scales based on the monthly active subscriber count. If the 5-match tier is not won, the prize money safely **rolls over** into the next month's jackpot.

### 6. Winner Verification Workflow
- **Claim Lifecycle:** Pending -> Proof Submitted -> Approved/Rejected -> Paid.
- **Proof of Score:** Winners upload a screenshot verifying their external platform score, which admins review directly from the platform. 
- **Equitable Split:** If multiple users match a tier (e.g., three 4-match winners), the prize pool for that tier is split equally.

### 7. Database & Security
- **Fully Relational Postgres Schema:** Handcrafted schema with robust foreign key constraints.
- **Row Level Security (RLS):** Policies mapped on *every* single table ensuring users only see/mutate their own data, and only admins access global configurations.
- **Structured Logging:** Powered by `winston` for monitoring webhook payloads, API faults, and critical system events.

---

## 🛠 Technologies Used

- **Framework:** [Next.js](https://nextjs.org/) (App Router, API Routes)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, pgcrypto, RLS)
- **Payments:** [Razorpay](https://razorpay.com/) (Subscriptions & Webhooks)
- **Validation:** [Zod](https://zod.dev/)
- **Logging:** [winston](https://github.com/winstonjs/winston)
- **Email:** [Resend](https://resend.com/) (Planned/Integrated for transactional alerts)

---

## ⚙️ Setup & Local Development

Follow these steps to run the Golf Charity Platform on your local machine.

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- A [Supabase](https://supabase.com/) account (Free tier works perfectly)
- A [Razorpay](https://razorpay.com/) account (Test mode)

### 2. Clone and Install
```bash
git clone <repository-url>
cd golf-charity-platform
npm install
```

### 3. Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and populate the fields:
   - **Supabase Keys:** Obtain your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project settings.
   - **Razorpay Keys:** Get your test mode `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Note: You will need to create Monthly and Yearly subscription plans in the Razorpay dashboard and paste their IDs here.
   - **Emails:** (Optional for local dev) Add your `RESEND_API_KEY`.

### 4. Database Initialization
This project relies on a comprehensive schema that establishes tables, indexing, RLS policies, and triggers.
1. Copy the contents of `/supabase/schema.sql`.
2. Go to your Supabase Project Dashboard -> **SQL Editor**.
3. Paste the contents and click **Run**.
*(This will also seed initial charities and admin config settings into the database so you can start testing immediately).*

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. API routes are available at `http://localhost:3000/api/*`.

### 6. Webhook Testing (Optional but Recommended)
To test Razorpay subscription lifecycle events locally:
1. Use a tool like [Ngrok](https://ngrok.com/) to expose your local server: `ngrok http 3000`.
2. Grab the forwarded HTTPS URL (e.g., `https://xyz.ngrok.io`).
3. Add a webhook endpoint in your Razorpay Dashboard pointing to `https://xyz.ngrok.io/api/webhook/razorpay` and subscribe to `subscription.charged`, `subscription.cancelled`, and `subscription.halted` events.
4. Ensure your `RAZORPAY_WEBHOOK_SECRET` in `.env.local` matches the one specified during webhook creation in Razorpay.

---

*This application prioritizes secure fund routing, fault-tolerant state handling via webhooks, and equitable prize distribution mechanics.*
