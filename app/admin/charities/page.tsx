"use client";

import { FormEvent, useEffect, useState } from "react";
import { admin } from "@/lib/api/endpoints/admin";

type Charity = { id: string; name: string; description: string; is_featured: boolean };

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load(): Promise<void> {
    const data = (await admin.listCharities()) as { charities?: Charity[] };
    setCharities(data.charities ?? []);
  }

  useEffect(() => {
    let active = true;

    void admin.listCharities().then((data) => {
      if (!active) return;
      const payload = data as { charities?: Charity[] };
      setCharities(payload.charities ?? []);
    });

    return () => {
      active = false;
    };
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    await admin.createCharity({ name, description, is_featured: false });
    setName("");
    setDescription("");
    await load();
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <form onSubmit={onCreate} className="grid gap-2 md:grid-cols-3">
        <input className="rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="rounded border px-3 py-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <button className="rounded bg-zinc-900 px-4 py-2 text-white">Create</button>
      </form>

      {charities.map((charity) => (
        <article key={charity.id} className="rounded border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{charity.name}</p>
              <p className="text-sm text-zinc-600">{charity.description}</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-3 py-1" onClick={async () => {
                const updatedName = window.prompt("New charity name", charity.name);
                if (!updatedName) return;
                await admin.updateCharity({ charity_id: charity.id, name: updatedName });
                await load();
              }}>Edit</button>
              <button className="rounded border border-red-300 px-3 py-1 text-red-700" onClick={async () => {
                await admin.deleteCharity(charity.id);
                await load();
              }}>Delete</button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
