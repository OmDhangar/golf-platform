"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api/endpoints/auth";
import { subscriptions } from "@/lib/api/endpoints/subscriptions";
import { saveOnboardingState } from "@/lib/onboarding/store";
import { ApiClientError } from "@/lib/api/client";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [planType, setPlanType] = useState<"monthly" | "yearly">("monthly");
    const [charityId, setCharityId] = useState("");
    const [charityPercent, setCharityPercent] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (charityPercent < 10) {
            setError("Charity percentage must be at least 10.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await auth.signup({
                email,
                password,
                full_name: fullName,
                plan_type: planType,
                charity_id: charityId,
                charity_percent: charityPercent,
            });

            saveOnboardingState({
                email,
                plan_type: planType,
                charity_id: charityId,
                charity_percent: charityPercent,
            });

            await auth.login({ email, password });

            const subscription = await subscriptions.create({
                plan_type: planType,
                charity_id: charityId,
                charity_percent: charityPercent,
            });

            window.location.assign(subscription.payment_url);
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError("Signup failed. Please try again.");
            }
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
            <h1 className="mb-6 text-3xl font-semibold">Sign up</h1>

            <form className="space-y-4" onSubmit={onSubmit}>
                <label className="block">
                    <span className="mb-1 block text-sm">Email</span>
                    <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm">Password</span>
                    <input
                        required
                        type="password"
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm">Full name</span>
                    <input
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm">Plan type</span>
                    <select
                        value={planType}
                        onChange={(e) => setPlanType(e.target.value as "monthly" | "yearly")}
                        className="w-full rounded border px-3 py-2"
                    >
                        <option value="monthly">monthly</option>
                        <option value="yearly">yearly</option>
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm">Charity ID</span>
                    <input
                        required
                        type="text"
                        value={charityId}
                        onChange={(e) => setCharityId(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm">Charity percent</span>
                    <input
                        required
                        type="number"
                        min={10}
                        max={100}
                        value={charityPercent}
                        onChange={(e) => setCharityPercent(Number(e.target.value))}
                        className="w-full rounded border px-3 py-2"
                    />
                </label>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                >
                    {loading ? "Creating account..." : "Create account"}
                </button>
            </form>

            <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-4 text-left text-sm underline"
            >
                Already have an account? Log in
            </button>
        </main>
    );
}
