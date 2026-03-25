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
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 28px" }}>
      {/* Header Area */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="font-barlow" style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "0.05em", color: "var(--text-primary)", textTransform: "uppercase" }}>
            User Management
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif" }}>
            Control access roles, charity allocations, and subscription statuses.
          </p>
        </div>
      </div>

      <div className="hea-card" style={{ padding: "0", background: "rgba(255,255,255,0.015)", backdropFilter: "blur(10px)", overflow: "hidden" }}>
        {/* Search & Stats Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <form onSubmit={onSearch} style={{ position: "relative", flex: 1, maxWidth: 400 }}>
            <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="var(--text-muted)" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="SEARCH BY NAME OR EMAIL..." 
              className="hea-input"
              style={{ paddingLeft: 40, width: "100%", fontSize: "0.75rem", letterSpacing: "0.05em" }} 
            />
          </form>
          {message && (
            <div style={{ background: "rgba(52,199,89,0.1)", padding: "8px 16px", borderRadius: 4, border: "1px solid var(--green)", color: "var(--green)", fontSize: "0.75rem", fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif" }}>
              {message.toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="hea-table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "16px 24px", color: "var(--text-muted)" }}>USER IDENTITY</th>
                <th style={{ padding: "16px 24px", color: "var(--text-muted)" }}>ROLE</th>
                <th style={{ padding: "16px 24px", color: "var(--text-muted)", textAlign: "center" }}>CHARITY %</th>
                <th style={{ padding: "16px 24px", color: "var(--text-muted)" }}>SUBSCRIPTION</th>
                <th style={{ padding: "16px 24px", color: "var(--text-muted)", textAlign: "right" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <p style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>{user.full_name || "Anonymous"}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "'Inter', sans-serif" }}>{user.email}</p>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <select 
                      defaultValue={user.role} 
                      className="hea-input"
                      style={{ padding: "4px 10px", fontSize: "0.8rem", width: 100, background: "var(--bg-deep)" }}
                      onChange={async (e) => {
                        await admin.updateUser({ user_id: user.id, role: e.target.value });
                        setMessage(`Updated ${user.email} to ${e.target.value}`);
                        setTimeout(() => setMessage(null), 3000);
                        await loadUsers(search);
                      }}
                    >
                      <option value="user">USER</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <input 
                        type="number" 
                        min={10} 
                        max={100}
                        defaultValue={user.charity_percent} 
                        className="hea-input"
                        style={{ width: 60, padding: "4px 8px", textAlign: "center", background: "var(--bg-deep)" }}
                        onBlur={async (e) => {
                          await admin.updateUser({ user_id: user.id, charity_percent: Number(e.target.value) });
                          setMessage("CHARITY PERCENTAGE UPDATED");
                          setTimeout(() => setMessage(null), 3000);
                        }} 
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ 
                      padding: "4px 10px", borderRadius: 4, fontSize: "0.7rem", fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif",
                      background: user.subscriptions?.[0]?.status === "active" ? "rgba(52,199,89,0.1)" : "rgba(255,255,255,0.05)",
                      color: user.subscriptions?.[0]?.status === "active" ? "var(--green)" : "var(--text-muted)",
                      border: user.subscriptions?.[0]?.status === "active" ? "1px solid var(--green)" : "1px solid var(--border)"
                    }}>
                      {(user.subscriptions?.[0]?.status || "NONE").toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", textAlign: "right" }}>
                    {user.subscriptions?.[0]?.status && user.subscriptions[0].status !== "none" ? (
                      <button 
                        className="btn-danger" 
                        style={{ padding: "6px 12px", fontSize: "0.7rem" }}
                        onClick={async () => {
                          if (confirm(`Cancel subscription for ${user.email}?`)) {
                            await admin.cancelSubscription(user.id);
                            setMessage("SUBSCRIPTION CANCELLED");
                            setTimeout(() => setMessage(null), 3000);
                            await loadUsers(search);
                          }
                        }}
                      >
                        TERMINATE
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontStyle: "italic" }}>NO ACTIVE SUB</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
                    NO USERS FOUND MATCHING YOUR CRITERIA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
