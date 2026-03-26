"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api/client";

export default function AdminCharitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [category, setCategory] = useState("ENVIRONMENT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(f);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload Logo to Cloudinary via our API
      let logo_url = null;
      if (file) {
        const base64Data = await toBase64(file);
        const uploadData = await apiFetch<any>("/api/upload", {
          method: "POST",
          body: { data: base64Data, folder: "charities" },
          protectedRoute: true,
        });
        logo_url = uploadData.secure_url;
      }

      // 2. Submit Charity to DB
      const charityPayload = {
        name,
        description,
        website_url: websiteUrl || null,
        logo_url,
        is_featured: isFeatured,
        category,
        total_generated_paise: 0,
      };

      await apiFetch("/api/charities", {
        method: "POST",
        body: charityPayload,
        protectedRoute: true,
      });

      setSuccess(true);
      setName("");
      setDescription("");
      setWebsiteUrl("");
      setCategory("ENVIRONMENT");
      setIsFeatured(false);
      setFile(null);
      setPreviewUrl(null);
      
      // Optionally router.refresh() to update layout data
      router.refresh();

    } catch (err: any) {
      setError(err instanceof ApiClientError ? err.message : (err.message || "Failed to save charity"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      <h1 className="font-barlow" style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 24, textTransform: "uppercase" }}>
        Add New Charity
      </h1>

      {error && (
        <div style={{ background: "rgba(255,59,48,0.1)", borderLeft: "4px solid var(--red)", padding: "16px", marginBottom: 24 }}>
          <p style={{ color: "var(--red)", fontSize: "0.9rem", margin: 0 }}>{error}</p>
        </div>
      )}

      {success && (
        <div style={{ background: "rgba(52,199,89,0.1)", borderLeft: "4px solid var(--green)", padding: "16px", marginBottom: 24 }}>
          <p style={{ color: "var(--green)", fontSize: "0.9rem", margin: 0 }}>Charity successfully created!</p>
        </div>
      )}

      <div className="hea-card" style={{ padding: "32px", background: "var(--bg-card)" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Charity Name</label>
              <input
                type="text"
                className="hea-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="e.g. Ocean Conservancy"
                style={{ width: "100%" }}
              />
            </div>
            
            <div style={{ width: 180 }}>
              <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Category</label>
              <select
                className="hea-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: "100%", background: "var(--bg-card)", color: "var(--text-primary)" }}
              >
                <option value="ENVIRONMENT">Environment</option>
                <option value="YOUTH ATHLETICS">Youth Athletics</option>
                <option value="HEALTH & WELLNESS">Health & Wellness</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Description</label>
            <textarea
              className="hea-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Brief summary of their mission..."
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>

          <div>
            <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Website URL (Optional)</label>
            <input
              type="url"
              className="hea-input"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label className="label-caps" style={{ display: "block", marginBottom: 8 }}>Logo / Header Image</label>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  width: 140, height: 100,
                  border: "2px dashed var(--border)",
                  borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", background: "var(--bg-deep)"
                }}
              >
                {previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No Image</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={e => setIsFeatured(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--green)" }}
            />
            <label htmlFor="isFeatured" style={{ color: "var(--text-primary)", fontSize: "0.9rem", cursor: "pointer" }}>
              Feature this charity (shows prominently on main page)
            </label>
          </div>

          <div style={{ paddingTop: 24, borderTop: "1px solid var(--border)", marginTop: 8 }}>
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
              {loading ? "SAVING..." : "SAVE CHARITY"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
