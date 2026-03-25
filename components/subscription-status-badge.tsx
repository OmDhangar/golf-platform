import { STATUS_LABELS, getSubscriptionTone } from "@/lib/auth/subscriptions";
import type { SubscriptionStatus } from "@/types";

interface SubscriptionStatusBadgeProps {
    status: SubscriptionStatus | null | undefined;
}

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
    const label = status ? STATUS_LABELS[status] : "Unknown";

    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getSubscriptionTone(status)}`}
        >
            {label}
        </span>
    );
}
