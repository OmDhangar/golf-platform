import Link from "next/link";

export default function PaymentPendingPage() {
    return (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
            <h1 className="text-3xl font-bold">Payment pending</h1>
            <p className="text-zinc-600">
                We are waiting for your payment confirmation. This can take a couple of minutes.
            </p>
            <Link href="/subscribe" className="w-fit rounded-lg border border-zinc-300 px-4 py-2 font-semibold">
                Back to subscription status
            </Link>
        </main>
    );
}
