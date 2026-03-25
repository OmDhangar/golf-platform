import Link from "next/link";

export default function PaymentSuccessPage() {
    return (
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-16">
            <h1 className="text-3xl font-bold">Payment successful</h1>
            <p className="text-zinc-600">
                Thanks! Your subscription payment was received. You can continue to your dashboard.
            </p>
            <Link href="/dashboard" className="w-fit rounded-lg bg-black px-4 py-2 font-semibold text-white">
                Continue to dashboard
            </Link>
        </main>
    );
}
