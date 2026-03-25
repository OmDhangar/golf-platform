# 🚀 Deployment Guide: Golf Charity Platform (HEA)

This document provides a step-by-step roadmap to hosting your application on a production-ready environment using **Vercel** and **Supabase**.

---

## 1. Frontend & API (Vercel)
Since this is a Next.js App Router project, Vercel is the recommended hosting platform.

### Step-by-Step Vercel Setup:
1.  **Push your code to GitHub/GitLab:**
    Ensure your project is in a repository.
2.  **Import to Vercel:**
    Login to [Vercel](https://vercel.com/) and click **"Add New" -> "Project"**. Import your repository.
3.  **Configure Environment Variables:**
    Under the **Environment Variables** section, copy every key from your `.env` file. 
    *   **CRITICAL:** Update `NEXT_PUBLIC_APP_URL` to your production URL (e.g., `https://your-domain.vercel.app`).
    *   *Note:* Ensure `NODE_ENV` is set to `production`.

---

## 2. Database & Auth (Supabase)
Your Supabase instance is already live, but you must ensure it's production-ready.

### Checklist:
1.  **Schema Migration:**
    Ensure the latest `supabase/schema.sql` has been run in the Supabase SQL Editor.
2.  **Row Level Security (RLS):**
    Verify that RLS is toggled **ON** for all tables (especially `users`, `draws`, and `winners`). The schema includes policies that prevent users from seeing each other's private data.
3.  **Authentication:**
    *   In Supabase **Auth -> Providers -> Email**, disable "Confirm Email" if you want instant test signups, or enable it for production security.
    *   Add your Vercel URL to **Auth -> Site URL** and **Redirect URLs**.

---

## 3. Payments (Razorpay)
When moving from **Test Mode** to **Live Mode**:

1.  **Live API Keys:** Generate new Live Keys in the Razorpay Dashboard.
2.  **Update IDs:** Your `RAZORPAY_PLAN_MONTHLY_ID` and `RAZORPAY_PLAN_YEARLY_ID` will be different in Live Mode. Create them in the Razorpay Dashboard and update your environment variables.
3.  **Webhooks:**
    *   Go to **Settings -> Webhooks**.
    *   Add a new webhook pointing to `https://your-domain.vercel.app/api/webhook/razorpay`.
    *   Events to subscribe to: `order.paid`, `subscription.charged`, `subscription.cancelled`.
    *   Ensure the `RAZORPAY_WEBHOOK_SECRET` in Vercel matches exactly what you set in the Razorpay Dashboard.

---

## 4. Media Storage (Cloudinary)
1.  **Storage:** Ensure your Cloudinary credentials are correct in the environment variables.
2.  **Upload Presets:** (Optional) You can create an upload preset in Cloudinary and add it to your `app/api/upload` logic for better folder organization.

---

## 5. Domain & Final Polish
1.  **Custom Domain:** Connect your domain (e.g., `www.charitygolf.com`) in the Vercel **Settings -> Domains** tab.
2.  **Production Build:**
    Vercel will automatically build the project. If there are errors, run `npm run build` locally first to debug.
3.  **Email (Resend):**
    Verify your sender domain in [Resend](https://resend.com/) so emails don't go to spam. Update `RESEND_API_KEY` in Vercel.

---

## 💡 Troubleshooting
*   **500 Errors:** Check Vercel **Runtime Logs**. Common issues are missing environment variables.
*   **Redirect Loops:** Ensure `NEXT_PUBLIC_APP_URL` does not have a trailing slash unless expected.
*   **Webhook 400/500:** Use the Razorpay "Webhook View" to see the delivery attempts. Most failures are due to incorrect `RAZORPAY_WEBHOOK_SECRET`.

---

*For technical support or complex architecture questions, contact the development lead.*
