import type { SubscriptionStatus } from "@/types";

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
    created: "Created",
    authenticated: "Authenticated",
    active: "Active",
    paused: "Paused",
    cancelled: "Cancelled",
    completed: "Completed",
    expired: "Expired",
};

export function isActiveSubscription(status: SubscriptionStatus | null | undefined): boolean {
    return status === "active";
}

export function getSubscriptionTone(status: SubscriptionStatus | null | undefined): string {
    switch (status) {
        case "active":
            return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "created":
        case "authenticated":
            return "bg-blue-100 text-blue-800 border-blue-200";
        case "paused":
            return "bg-amber-100 text-amber-800 border-amber-200";
        case "cancelled":
        case "expired":
        case "completed":
            return "bg-rose-100 text-rose-800 border-rose-200";
        default:
            return "bg-zinc-100 text-zinc-800 border-zinc-200";
    }
}
