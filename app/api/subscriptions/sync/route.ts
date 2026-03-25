/**
 * app/api/subscriptions/sync/route.ts
 * 
 * Provides a way for the frontend to manually trigger a subscription status sync
 * with Razorpay. This is useful as a fallback when webhooks are delayed or 
 * blocked (e.g., in a local development environment).
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromHeader, createAdminClient } from "@/lib/server/supabase";
import { createRouteLogger, logAndBuildError } from "@/lib/server/logger";
import { razorpay } from "@/lib/server/razorpay";
import type { ApiResponse } from "@/types/index";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
    const log = createRouteLogger("POST /api/subscriptions/sync");

    try {
        const authHeader = req.headers.get("Authorization");
        const user = await getUserFromHeader(authHeader);

        if (!user) {
            return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
        }

        const supabase = createAdminClient() as any;

        // 1. Get the latest non-active subscription for this user
        const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .in("status", ["created", "authenticated"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (subError || !subscription) {
            return NextResponse.json({ 
                success: true, 
                data: { synced: false, message: "No pending subscription found to sync." } 
            });
        }

        const sub = subscription as any;

        log.info("Syncing subscription status", { 
            subscriptionId: sub.id, 
            razorpayId: sub.razorpay_subscription_id 
        });

        // 2. Fetch latest status from Razorpay
        let rzpSub: any;
        try {
            rzpSub = await razorpay.subscriptions.fetch(sub.razorpay_subscription_id);
        } catch (err) {
            log.error("Failed to fetch subscription from Razorpay", { error: err });
            return NextResponse.json({ success: false, error: "Failed to communicate with payment gateway" }, { status: 502 });
        }

        // 3. Update DB if status has changed to 'active'
        // Razorpay statuses: created, authenticated, active, cancelled, completed, expired, halted
        if (rzpSub.status === "active" || rzpSub.status === "authenticated") {
            const currentEnd = rzpSub.current_end ? new Date(rzpSub.current_end * 1000).toISOString() : null;
            const currentStart = rzpSub.current_start ? new Date(rzpSub.current_start * 1000).toISOString() : new Date().toISOString();

            await supabase
                .from("subscriptions")
                .update({
                    status: "active",
                    current_period_start: currentStart,
                    current_period_end: currentEnd,
                    updated_at: new Date().toISOString()
                })
                .eq("id", sub.id);

            log.info("Subscription synced to active", { subscriptionId: sub.id });

            return NextResponse.json({ 
                success: true, 
                data: { synced: true, status: "active", subscription_id: sub.id } 
            });
        }

        return NextResponse.json({ 
            success: true, 
            data: { synced: true, status: rzpSub.status, subscription_id: sub.id } 
        });

    } catch (error) {
        const err = logAndBuildError(log, error, "Subscription sync failed");
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
