export default function UnauthorizedPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-deep)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 500,
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 24px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "2px solid var(--red)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="var(--red)" strokeWidth="2" />
            <path d="M12 8V12" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1" fill="var(--red)" />
          </svg>
        </div>

        {/* Content Card */}
        <div className="hea-card" style={{ padding: 32 }}>
          <h1
            className="font-barlow"
            style={{
              fontWeight: 800,
              fontSize: "2rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            Unauthorized
          </h1>

          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            You do not have permission to access this area.
          </p>
        </div>
      </div>
    </main>
  );
}
