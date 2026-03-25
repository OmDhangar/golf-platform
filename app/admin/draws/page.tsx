"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/nav-bar";
import { apiFetch, ApiClientError } from "@/lib/api/client";

export default function AdminDrawsPage() {
  const router = useRouter();
  const [draws, setDraws] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedDraw, setSelectedDraw] = useState<any>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const [winnersLoading, setWinnersLoading] = useState(false);

  const [drawMonth, setDrawMonth] = useState(() => {
    // Default to current month but if there's already one, maybe next?
    return new Date().toISOString().slice(0, 7)
  }); 
  const [description, setDescription] = useState("");
  const [prizePool, setPrizePool] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Prizes
  const [prizes, setPrizes] = useState([
    { label: "", file: null as File | null, preview: null as string | null, existingUrl: null as string | null },
    { label: "", file: null as File | null, preview: null as string | null, existingUrl: null as string | null },
    { label: "", file: null as File | null, preview: null as string | null, existingUrl: null as string | null },
  ]);

  const fetchDraws = async () => {
    setListLoading(true);
    try {
      const data = await apiFetch<any>("/api/draws?list=all", { protectedRoute: true });
      if (data.success) {
        setDraws(data.data.draws);
        // Auto select first one if none selected
        if (!selectedDraw && data.data.draws.length > 0) {
          handleSelectDraw(data.data.draws[0]);
        }
      }
    } catch (err) {}
    setListLoading(false);
  };

  useEffect(() => {
    void fetchDraws();
  }, []);

  const handleSelectDraw = async (draw: any) => {
    setSelectedDraw(draw);
    setWinners([]);
    if (draw.status === "published") {
      setWinnersLoading(true);
      try {
        const data = await apiFetch<any>(`/api/admin/draws/winners?draw_id=${draw.id}`, { protectedRoute: true });
        if (data.success) setWinners(data.data.winners);
      } catch (err) {}
      setWinnersLoading(false);
    }
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPrizes = [...prizes];
      newPrizes[index].file = file;
      newPrizes[index].existingUrl = null;
      newPrizes[index].preview = URL.createObjectURL(file);
      setPrizes(newPrizes);
    }
  };

  const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = err => reject(err);
  });

  const uploadImage = async (f: File) => {
    const b64 = await toBase64(f);
    const data = await apiFetch<any>("/api/upload", {
      method: "POST",
      body: { data: b64, folder: "prizes" },
      protectedRoute: true
    });
    return data.secure_url;
  };

  const handleCopy = (draw: any) => {
    // Auto-fill form with existing draw data
    // Increment month by 1 for convenience
    const [y, m] = draw.draw_month.split("-").map(Number);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    setDrawMonth(`${nextY}-${String(nextM).padStart(2, "0")}`);
    
    setDescription(draw.description || "");
    setPrizePool((draw.prize_pool_total_paise || 0) / 100);
    setPrizes([
      { label: draw.prize_1_label || "", file: null, preview: draw.prize_1_image_url || null, existingUrl: draw.prize_1_image_url || null },
      { label: draw.prize_2_label || "", file: null, preview: draw.prize_2_image_url || null, existingUrl: draw.prize_2_image_url || null },
      { label: draw.prize_3_label || "", file: null, preview: draw.prize_3_image_url || null, existingUrl: draw.prize_3_image_url || null },
    ]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload Cloudinary Images (only if new file selected)
      const uploadedUrls = await Promise.all(
        prizes.map(p => {
          if (p.file) return uploadImage(p.file);
          return p.existingUrl; // Reuse existing if copying
        })
      );

      // 2. Submit Draw Config
      const payload = {
        draw_month: drawMonth,
        description,
        prize_pool_total_paise: prizePool * 100, // Convert to paise
        prize_1_label: prizes[0].label || null,
        prize_1_image_url: uploadedUrls[0] || null,
        prize_2_label: prizes[1].label || null,
        prize_2_image_url: uploadedUrls[1] || null,
        prize_3_label: prizes[2].label || null,
        prize_3_image_url: uploadedUrls[2] || null,
      };

      await apiFetch("/api/draws", {
        method: "POST",
        body: payload,
        protectedRoute: true
      });

      setSuccess(true);
      void fetchDraws();
      
    } catch (err: any) {
      setError(err instanceof ApiClientError ? err.message : (err.message || "Failed saving draw configuration"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h1 className="font-barlow" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, textTransform: "uppercase" }}>
          Draw Management
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Configure prize pools and audit historical results.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 340px", gap: 32, alignItems: "start" }}>
        
        {/* HISTORY LIST (SIDEBAR LEFT) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 className="label-caps" style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Search History</h2>
          
          {listLoading ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Loading vault...</p>
          ) : draws.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>No history found.</p>
          ) : (
            draws.map(d => (
              <div 
                key={d.id} 
                onClick={() => handleSelectDraw(d)}
                style={{ 
                  padding: "16px", 
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: selectedDraw?.id === d.id ? "1px solid var(--green)" : "1px solid var(--border)",
                  background: selectedDraw?.id === d.id ? "rgba(34,197,94,0.05)" : "var(--bg-card)",
                  borderRadius: 4
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p className="font-barlow" style={{ fontSize: "1.05rem", fontWeight: 700, color: selectedDraw?.id === d.id ? "var(--green)" : "var(--text-primary)" }}>{d.draw_month}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.status === "published" ? "var(--text-muted)" : "var(--green)" }} />
                      <p className="label-caps" style={{ fontSize: "0.5rem", color: d.status === "published" ? "var(--text-muted)" : "var(--green)" }}>{d.status}</p>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p className="label-caps" style={{ fontSize: "0.45rem", color: "var(--text-muted)" }}>WINNERS</p>
                    <p className="font-barlow" style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{d.winners_count || 0}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="label-caps" style={{ fontSize: "0.45rem", color: "var(--text-muted)" }}>POOL</p>
                    <p className="font-barlow" style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-secondary)" }}>${((d.prize_pool_total_paise || 0)/100).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CENTER PANEL: DETAILED RESULTS OR CONFIG */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {selectedDraw?.status === "published" ? (
            <div className="hea-card" style={{ padding: 40, position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <h2 className="font-barlow" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.1em" }}>{selectedDraw.draw_month} RESULTS</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Draw officially published on {new Date(selectedDraw.published_at).toLocaleString()}</p>
                </div>
                <button className="btn-ghost" onClick={() => handleCopy(selectedDraw)} style={{ padding: "8px 16px" }}>CLONE CONFIG</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 40 }}>
                <div>
                  <p className="label-caps" style={{ color: "var(--green)", marginBottom: 16 }}>OFFICIAL NUMBERS</p>
                  <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
                    {(selectedDraw.winning_numbers || []).map((n: number) => (
                      <div key={n} style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--green)", color: "#000", fontWeight: 800, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 4 }}>
                      <p className="label-caps" style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>TOTAL PAYOUT</p>
                      <p className="font-barlow" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>${((selectedDraw.prize_pool_total_paise - (selectedDraw.jackpot_rollover_paise || 0))/100).toLocaleString()}</p>
                    </div>
                    <div style={{ padding: 16, background: "rgba(251,191,36,0.05)", borderRadius: 4, borderLeft: "3px solid var(--amber)" }}>
                      <p className="label-caps" style={{ fontSize: "0.6rem", color: "var(--amber)" }}>ROLLOVER TO NEXT MONTH</p>
                      <p className="font-barlow" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--amber)" }}>${((selectedDraw.jackpot_rollover_paise || 0)/100).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="label-caps" style={{ color: "var(--text-muted)", marginBottom: 16 }}>WINNERS REGISTRY</p>
                  <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 4 }}>
                    {winnersLoading ? (
                      <p style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Fetching official logs...</p>
                    ) : winners.length === 0 ? (
                      <p style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>No winners found for this cycle.</p>
                    ) : (
                      <table style={{ width: "100%", fontSize: "0.8rem", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.02)", textAlign: "left" }}>
                            <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>PLAYER</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>TIER</th>
                            <th style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}>PRIZE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {winners.map(w => (
                            <tr key={w.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                              <td style={{ padding: "12px" }}>
                                <p style={{ fontWeight: 600 }}>{w.users?.full_name || "Unknown"}</p>
                                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{w.users?.email}</p>
                              </td>
                              <td style={{ padding: "12px", textTransform: "uppercase", color: w.tier === "five" ? "var(--amber)" : "var(--text-primary)" }}>{w.tier}</td>
                              <td style={{ padding: "12px", fontWeight: 700 }}>${(w.prize_amount_paise/100).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", background: "rgba(255,255,255,0.01)", border: "1px dashed var(--border)", borderRadius: 8 }}>
              <p>Select a <b>Published Draw</b> from the history to view detailed winner logs and prize distribution data.</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: CREATE / EDIT (ALWAYS VISIBLE) */}
        <div className="hea-card" style={{ padding: "28px", background: "var(--bg-card)" }}>
          <h2 className="label-caps" style={{ color: "var(--green)", marginBottom: 20, fontSize: "0.75rem" }}>New Cycle Config</h2>
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label className="label-caps" style={{ display: "block", marginBottom: 6, fontSize: "0.55rem" }}>Draw Month</label>
                <input
                  type="month"
                  className="hea-input"
                  value={drawMonth}
                  onChange={e => setDrawMonth(e.target.value)}
                  required
                  style={{ width: "100%", colorScheme: "dark", padding: "8px" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label-caps" style={{ display: "block", marginBottom: 6, fontSize: "0.55rem" }}>Prize Pool ($)</label>
                <input
                  type="number"
                  min="0"
                  className="hea-input"
                  value={prizePool}
                  onChange={e => setPrizePool(parseInt(e.target.value))}
                  required
                  style={{ width: "100%", padding: "8px" }}
                />
              </div>
            </div>

            <div>
              <label className="label-caps" style={{ display: "block", marginBottom: 6, fontSize: "0.55rem" }}>Description</label>
              <textarea
                className="hea-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="PROMO DETAILS..."
                style={{ width: "100%", fontSize: "0.8rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 60, height: 44, border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", background: "var(--bg-deep)", flexShrink: 0 }}>
                    {prizes[i].preview ? (
                      <img src={prizes[i].preview!} alt="P" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.4rem", color: "var(--text-muted)" }}>REWARD {i+1}</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="hea-input"
                      value={prizes[i].label}
                      onChange={e => {
                        const newPrizes = [...prizes];
                        newPrizes[i].label = e.target.value;
                        setPrizes(newPrizes);
                      }}
                      placeholder={`PRIZE ${i+1}...`}
                      style={{ width: "100%", marginBottom: 4, fontSize: "0.7rem", padding: "4px 8px" }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileChange(i, e)}
                      style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <p style={{ color: "var(--red)", fontSize: "0.7rem" }}>{error}</p>}
            {success && <p style={{ color: "var(--green)", fontSize: "0.7rem" }}>✓ Configured.</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", background: "var(--green)", color: "#000", fontWeight: 800, padding: "12px" }}
            >
              {loading ? "SAVING..." : "SAVE CONFIG"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
