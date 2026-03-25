"use client";

import { FormEvent, useEffect, useState } from "react";
import { admin } from "@/lib/api/endpoints/admin";

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  charity_percent: number;
  subscriptions?: { status: string }[];
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function loadUsers(query?: string): Promise<void> {
    const data = (await admin.users({ search: query, limit: 50 })) as { users?: AdminUser[] };
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    let active = true;

    void admin.users({ limit: 50 }).then((data) => {
      if (!active) return;
      const payload = data as { users?: AdminUser[] };
      setUsers(payload.users ?? []);
    });

    return () => {
      active = false;
    };
  }, []);

  async function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadUsers(search);
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <form onSubmit={onSearch} className="flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" className="w-full rounded border px-3 py-2" />
        <button className="rounded bg-zinc-900 px-4 py-2 text-white">Search</button>
      </form>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="pb-2">User</th><th className="pb-2">Role</th><th className="pb-2">Charity %</th><th className="pb-2">Subscription</th><th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t align-top">
                <td className="py-2 pr-4"><p className="font-medium">{user.full_name}</p><p className="text-zinc-500">{user.email}</p></td>
                <td className="py-2 pr-4">
                  <select defaultValue={user.role} className="rounded border px-2 py-1" onChange={async (e) => {
                    await admin.updateUser({ user_id: user.id, role: e.target.value });
                    setMessage("User updated");
                    await loadUsers(search);
                  }}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="py-2 pr-4">
                  <input type="number" min={10} defaultValue={user.charity_percent} className="w-20 rounded border px-2 py-1" onBlur={async (e) => {
                    await admin.updateUser({ user_id: user.id, charity_percent: Number(e.target.value) });
                    setMessage("User updated");
                  }} />
                </td>
                <td className="py-2 pr-4">{user.subscriptions?.[0]?.status ?? "none"}</td>
                <td className="py-2">
                  <button className="rounded border border-red-300 px-3 py-1 text-red-700" onClick={async () => {
                    await admin.cancelSubscription(user.id);
                    setMessage("Subscription cancelled");
                    await loadUsers(search);
                  }}>Cancel subscription</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
