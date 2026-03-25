"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/nav-bar";

export default function AdminDrawsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [drawMonth, setDrawMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [description, setDescription] = useState("");
  const [prizePool, setPrizePool] = useState<number>(0);

  // Prizes
  const [prizes, setPrizes] = useState([
    { label: "", file: null as File | null, preview: null as string | null },
    { label: "", file: null as File | null, preview: null as string | null },
    { label: "", file: null as File | null, preview: null as string | null },
  ]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newPrizes = [...prizes];
      newPrizes[index].file = file;
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
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: b64, folder: "prizes" })
    });
    const d = await res.json();
    if (!res.ok || !d.success) throw new Error(d.error || "Image upload failed");
    return d.data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload Cloudinary Images
      const uploadedUrls = await Promise.all(
        prizes.map(p => (p.file ? uploadImage(p.file) : null))
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

      const res = await fetch("/api/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Failed saving draw configuration");

      setSuccess(true);
      router.refresh();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <h1 className="font-barlow" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 24, textTransform: "uppercase" }}>
        Configure Monthly Draw
      </h1>

      {error && (
        <div style={{ background: "rgba(255,59,48,0.1)", borderLeft: "4px solid var(--red)", padding: "16px", marginBottom: 24 }}>
          <p style={{ color: "var(--red)", fontSize: "0.9rem", margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div style={{ background: "rgba(52,199,89,0.1)", borderLeft: "4px solid var(--green)", padding: "16px", marginBottom: 24 }}>
          <p style={{ color: "var(--green)", fontSize: "0.9rem", margin: 0 }}>Draw successfully configured!</p>
        </div>
      )}

      <div className="hea-card" style={{ padding: "32px", background: "var(--bg-card)" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* General info */}
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Draw Month (YYYY-MM)</label>
              <input
                type="month"
                className="hea-input"
                value={drawMonth}
                onChange={e => setDrawMonth(e.target.value)}
                required
                style={{ width: "100%", colorScheme: "dark" }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Total Prize Pool ($)</label>
              <input
                type="number"
                min="0"
                className="hea-input"
                value={prizePool}
                onChange={e => setPrizePool(parseInt(e.target.value))}
                required
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div>
            <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Draw Description</label>
            <textarea
              className="hea-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Internal notes or public description for this draw..."
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <hr style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />

          {/* Prizes */}
          <div>
            <h2 className="font-barlow" style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>Prize Configurations</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: "flex", gap: 24, alignItems: "center" }}>
                  <div
                    style={{
                      width: 140, height: 100,
                      border: "2px dashed var(--border)",
                      borderRadius: 6,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", background: "var(--bg-deep)", flexShrink: 0
                    }}
                  >
                    {prizes[i].preview ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={prizes[i].preview!} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>Prize {i+1} Image</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Prize {i+1} Label</label>
                    <input
                      type="text"
                      className="hea-input"
                      value={prizes[i].label}
                      onChange={e => {
                        const newPrizes = [...prizes];
                        newPrizes[i].label = e.target.value;
                        setPrizes(newPrizes);
                      }}
                      placeholder={`e.g. ${i === 0 ? 'Custom Titleist Iron Set' : i === 1 ? '$500 Pro Shop Credit' : 'Whoop 1-Year Pro Membership'}`}
                      style={{ width: "100%", marginBottom: 12 }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileChange(i, e)}
                      style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--green)",
                color: "var(--bg-deep)",
                border: "none",
                padding: "16px 32px",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: "1.1rem",
                letterSpacing: "0.05em",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "SAVING..." : "SAVE DRAW CONFIGURATION"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
