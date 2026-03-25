"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiClientError } from "@/lib/api/client";
import { scores, type ScoreItem } from "@/lib/api/endpoints/scores";

type FormValues = {
    value: string;
    played_at: string;
    course_name: string;
};

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
    value: "",
    played_at: "",
    course_name: "",
};

export default function ScoresPage() {
    const router = useRouter();
    const [form, setForm] = useState<FormValues>(EMPTY_FORM);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [subscriptionRequired, setSubscriptionRequired] = useState(false);
    const [entries, setEntries] = useState<ScoreItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loadingList, setLoadingList] = useState(true);
    const [saving, setSaving] = useState(false);

    const isEditing = useMemo(() => editingId !== null, [editingId]);

    useEffect(() => {
        void refreshScores();
    }, []);

    async function refreshScores(): Promise<void> {
        try {
            setLoadingList(true);
            const data = await scores.list({ skipRedirect: true });
            setEntries(data.scores.slice(0, 5));
        } catch (err) {
            setFormError(err instanceof ApiClientError ? err.message : "Failed to load scores.");
        } finally {
            setLoadingList(false);
        }
    }

    function validate(values: FormValues): FieldErrors {
        const nextErrors: FieldErrors = {};
        const parsed = Number(values.value);

        if (!Number.isInteger(parsed)) {
            nextErrors.value = "Score must be a whole number.";
        } else if (parsed < 1 || parsed > 45) {
            nextErrors.value = "Score must be between 1 and 45.";
        }

        if (!values.played_at) {
            nextErrors.played_at = "Date is required.";
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.played_at)) {
            nextErrors.played_at = "Date must be in YYYY-MM-DD format.";
        }

        return nextErrors;
    }

    function setFormField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const clientErrors = validate(form);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        setErrors({});
        setFormError(null);
        setSubscriptionRequired(false);
        setSaving(true);

        const payload = {
            value: Number(form.value),
            played_at: form.played_at,
            course_name: form.course_name.trim() || undefined,
        };

        try {
            if (editingId) {
                await scores.update({ score_id: editingId, ...payload }, { skipRedirect: true });
            } else {
                await scores.create(payload, { skipRedirect: true });
            }

            setForm(EMPTY_FORM);
            setEditingId(null);
            router.refresh();
            await refreshScores();
        } catch (err) {
            if (err instanceof ApiClientError) {
                if (err.status === 422) {
                    applyBackendValidation(err.details);
                } else if (err.status === 403) {
                    setSubscriptionRequired(true);
                    setFormError(err.message);
                } else {
                    setFormError(err.message);
                }
            } else {
                setFormError("Unable to save score. Please try again.");
            }
        } finally {
            setSaving(false);
        }
    }

    function applyBackendValidation(details: unknown): void {
        const fieldErrors =
            typeof details === "object" && details !== null && "fieldErrors" in details
                ? (details as { fieldErrors?: Record<string, string[] | undefined> }).fieldErrors
                : undefined;

        const backendErrors: FieldErrors = {};
        if (fieldErrors?.value?.[0]) backendErrors.value = fieldErrors.value[0];
        if (fieldErrors?.played_at?.[0]) backendErrors.played_at = fieldErrors.played_at[0];
        if (fieldErrors?.course_name?.[0]) backendErrors.course_name = fieldErrors.course_name[0];

        setErrors(backendErrors);
        setFormError("Please fix the highlighted fields.");
    }

    function startEdit(entry: ScoreItem): void {
        setEditingId(entry.id);
        setErrors({});
        setFormError(null);
        setSubscriptionRequired(false);
        setForm({
            value: String(entry.value),
            played_at: entry.played_at,
            course_name: entry.course_name ?? "",
        });
    }

    function cancelEdit(): void {
        setEditingId(null);
        setErrors({});
        setFormError(null);
        setSubscriptionRequired(false);
        setForm(EMPTY_FORM);
    }

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-10">
            <header>
                <p className="text-sm uppercase tracking-wide text-zinc-500">Scores</p>
                <h1 className="text-3xl font-semibold">Track your latest rounds</h1>
            </header>

            <section className="rounded-xl border p-5">
                <h2 className="text-xl font-medium">{isEditing ? "Edit score" : "Add score"}</h2>

                <form className="mt-4 space-y-4" onSubmit={onSubmit}>
                    <label className="block">
                        <span className="mb-1 block text-sm">Value (1-45)</span>
                        <input
                            required
                            type="number"
                            min={1}
                            max={45}
                            step={1}
                            value={form.value}
                            onChange={(e) => setFormField("value", e.target.value)}
                            className="w-full rounded border px-3 py-2"
                        />
                        {errors.value ? <p className="mt-1 text-sm text-red-600">{errors.value}</p> : null}
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm">Played at</span>
                        <input
                            required
                            type="date"
                            value={form.played_at}
                            onChange={(e) => setFormField("played_at", e.target.value)}
                            className="w-full rounded border px-3 py-2"
                        />
                        {errors.played_at ? <p className="mt-1 text-sm text-red-600">{errors.played_at}</p> : null}
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm">Course name (optional)</span>
                        <input
                            type="text"
                            value={form.course_name}
                            onChange={(e) => setFormField("course_name", e.target.value)}
                            className="w-full rounded border px-3 py-2"
                        />
                        {errors.course_name ? <p className="mt-1 text-sm text-red-600">{errors.course_name}</p> : null}
                    </label>

                    {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

                    {subscriptionRequired ? (
                        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                            Subscription required to add or edit scores. <Link href="/subscribe" className="underline">Subscribe now</Link>.
                        </div>
                    ) : null}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
                        >
                            {saving ? "Saving..." : isEditing ? "Save changes" : "Add score"}
                        </button>
                        {isEditing ? (
                            <button type="button" onClick={cancelEdit} className="rounded border px-4 py-2">
                                Cancel
                            </button>
                        ) : null}
                    </div>
                </form>
            </section>

            <section className="rounded-xl border p-5">
                <h2 className="text-xl font-medium">Latest 5 scores</h2>

                {loadingList ? (
                    <p className="mt-4 text-sm text-zinc-600">Loading scores...</p>
                ) : entries.length === 0 ? (
                    <p className="mt-4 text-sm text-zinc-600">No scores saved yet.</p>
                ) : (
                    <ul className="mt-4 space-y-3">
                        {entries.map((entry) => (
                            <li key={entry.id} className="rounded border p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-medium">{entry.value} points</p>
                                    <button type="button" onClick={() => startEdit(entry)} className="text-sm underline">
                                        Edit
                                    </button>
                                </div>
                                <p className="text-sm text-zinc-600">{entry.played_at}</p>
                                <p className="text-sm text-zinc-600">{entry.course_name || "Unknown course"}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
