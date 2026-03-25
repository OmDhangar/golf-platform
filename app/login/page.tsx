"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, type LoginResponse } from "@/lib/api/endpoints/auth";
import { ApiClientError } from "@/lib/api/client";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await auth.login({ email, password });
            const role = getRole(response);

            if (role === "admin") {
                router.push("/admin");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            if (err instanceof ApiClientError) {
                setError(err.message);
            } else {
                setError("Login failed. Please try again.");
            }
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-10">
            <h1 className="mb-6 text-3xl font-semibold">Log in</h1>

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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    />
                </label>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
                >
                    {loading ? "Signing in..." : "Log in"}
                </button>
            </form>
        </main>
    );
}

function getRole(response: LoginResponse): string {
    const user = response.user as { role?: string } | null;
    return user?.role ?? "user";
}
