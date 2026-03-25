"use client"
import Link from "next/link";

const mechanics = [
  {
    title: "CHOOSE YOUR STAKES",
    desc: "Join the collective roster. Track your play, book the full experience of the NBA ecosystem with ties to each.",
    icon: "🎯",
  },
  {
    title: "SCORE",
    desc: "Hit the links and record every round. Each score entry can become practical support for causes you care about.",
    icon: "📊",
  },
  {
    title: "GIVE BACK",
    desc: "A percentage of every entry is allocated to verify good causes, see your impact grow through monthly analytics.",
    icon: "🤝",
  },
  {
    title: "WIN CLAIMS",
    desc: "Pro members are automatically entered into monthly draws for exclusive prizes, drawn randomly from the vault.",
    icon: "🏆",
  },
];

const pricingPlans = [
  {
    name: "AMATEUR",
    price: "$0",
    period: "/month",
    features: [
      "Basic Score Logging",
      "Charity Selection",
      "Dashboard Access",
      "Community Features",
    ],
    cta: "JOIN FREE",
    highlighted: false,
  },
  {
    name: "PROFESSIONAL",
    price: "$24",
    period: "/month",
    features: [
      "Unlimited Score Logging",
      "Sharing & Analytics Dashboard",
      "Monthly Draw Eligibility",
      "Premium Insights & Analytics Dashboard",
    ],
    cta: "SUBSCRIBE NOW",
    highlighted: true,
  },
];

const charities = [
  {
    name: "OCEAN CONSERVANCY",
    category: "ENVIRONMENT",
    amount: "$125,000",
  },
  {
    name: "YOUTH ON COURSE",
    category: "YOUTH ATHLETICS",
    amount: "$430,000",
  },
  {
    name: "WOUNDED WARRIOR",
    category: "HEALTH & WELLNESS",
    amount: "$315,000",
  },
  {
    name: "FIRST TEE",
    category: "YOUTH ATHLETICS",
    amount: "$210,000",
  },
];

const tutorialSteps = [
  {
    step: "01",
    title: "CREATE YOUR ACCOUNT",
    desc: "Sign up in seconds and select your preferred charity to support.",
  },
  {
    step: "02",
    title: "CHOOSE YOUR PLAN",
    desc: "Pick between Amateur (free) or Professional ($24/mo) to unlock draw entries.",
  },
  {
    step: "03",
    title: "LOG YOUR SCORES",
    desc: "Record every round. Each score contributes to your chosen charity.",
  },
  {
    step: "04",
    title: "WIN MONTHLY",
    desc: "Professional members are automatically entered—published results, zero surprises.",
  },
];

export default function HomePage() {
  return (
    <main style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}>
      {/* Hero Section */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Navigation */}
        <header
          style={{
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border)",
            padding: "16px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  background: "var(--green)",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 13 L8 2 L13 13"
                    stroke="#000"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5 9 L11 9"
                    stroke="#000"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                High-Energy Athletic
              </span>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <Link
                href="/login"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  padding: "8px 0",
                  transition: "color 0.15s",
                }}
              >
                Log in
              </Link>
              <button
                style={{
                  background: "var(--green)",
                  color: "#000",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "none",
                  borderRadius: 4,
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  transition: "background 0.15s",
                }}
                onClick={() => (window.location.href = "/signup")}
              >
                START YOUR JOURNEY
              </button>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px",
            textAlign: "center",
          }}
        >
          <p
            className="label-caps"
            style={{ color: "var(--green)", marginBottom: 16 }}
          >
            GOLF CHARITY PLATFORM
          </p>

          <h1
            className="font-barlow"
            style={{
              fontWeight: 800,
              fontSize: "5.5rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              marginBottom: 12,
              maxWidth: 900,
            }}
          >
            PLAY.
            <br />
            <span style={{ color: "var(--green)" }}>GIVE.</span>
            <br />
            WIN.
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              maxWidth: 600,
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            Fueling competitive self-performance training with philanthropic
            giving and high-stakes monthly prize pools. Stop playing for nothing.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button
              className="btn-primary"
              onClick={() => (window.location.href = "/signup")}
              style={{ cursor: "pointer" }}
            >
              START YOUR JOURNEY
            </button>
            <button
              className="btn-ghost"
              onClick={() => (window.location.href = "/draws")}
              style={{ cursor: "pointer" }}
            >
              VIEW PRIZE POOL
            </button>
          </div>
        </div>
      </section>

      {/* The Mechanics Section */}
      <section style={{ padding: "60px 24px", background: "var(--bg-deep)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            className="label-caps"
            style={{
              color: "var(--green)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            THE MECHANICS
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {mechanics.map((item) => (
              <div
                key={item.title}
                className="hea-card"
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transition: "border-color 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--green)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{ fontSize: "2.5rem" }}>{item.icon}</div>
                <h3
                  className="label-caps"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Stakes - Pricing */}
      <section style={{ padding: "60px 24px", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            className="label-caps"
            style={{
              color: "var(--green)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            CHOOSE YOUR STAKES
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 32,
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className="hea-card"
                style={{
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  border: plan.highlighted
                    ? "2px solid var(--green)"
                    : "1px solid var(--border)",
                  position: "relative",
                }}
              >
                {plan.highlighted && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--green)",
                      color: "#000",
                      padding: "4px 12px",
                      borderRadius: 3,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    FEATURED
                  </div>
                )}

                <div>
                  <h3
                    className="label-caps"
                    style={{ color: "var(--text-primary)", marginBottom: 12 }}
                  >
                    {plan.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 4,
                    }}
                  >
                    <span
                      className="font-barlow"
                      style={{
                        fontWeight: 800,
                        fontSize: "2.5rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {plan.price}
                    </span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <span style={{ color: "var(--green)" }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className="btn-primary"
                  style={{
                    width: "100%",
                    marginTop: "auto",
                    cursor: "pointer",
                    background: plan.highlighted
                      ? "var(--green)"
                      : "var(--green)",
                  }}
                  onClick={() => (window.location.href = "/signup")}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Charities */}
      <section style={{ padding: "60px 24px", background: "var(--bg-deep)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            className="label-caps"
            style={{
              color: "var(--green)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            FEATURED PARTNER CHARITIES
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {charities.map((charity) => (
              <div
                key={charity.name}
                className="hea-card"
                style={{
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  borderLeft: "3px solid var(--green)",
                }}
              >
                <div>
                  <p
                    className="label-caps"
                    style={{
                      color: "var(--green)",
                      marginBottom: 8,
                    }}
                  >
                    {charity.category}
                  </p>
                  <h3
                    className="label-caps"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {charity.name}
                  </h3>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span
                    className="font-barlow"
                    style={{
                      fontWeight: 800,
                      fontSize: "1.8rem",
                      color: "var(--green)",
                    }}
                  >
                    {charity.amount}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    GENERATED
                  </span>
                </div>

                <Link
                  href="/charities"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--green)",
                    textDecoration: "none",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  LEARN MORE →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link href="/charities" className="btn-ghost">
              VIEW ALL CHARITIES
            </Link>
          </div>
        </div>
      </section>

      {/* How To Play Tutorial */}
      <section style={{ padding: "60px 24px", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2
            className="label-caps"
            style={{
              color: "var(--green)",
              textAlign: "center",
              marginBottom: 48,
            }}
          >
            HOW TO PLAY
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 28,
            }}
          >
            {tutorialSteps.map((tutorial) => (
              <div
                key={tutorial.step}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    background: "var(--bg-card)",
                    border: "2px solid var(--green)",
                    borderRadius: 50,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                  }}
                >
                  <span
                    className="font-barlow"
                    style={{
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      color: "var(--green)",
                    }}
                  >
                    {tutorial.step}
                  </span>
                </div>
                <h3
                  className="label-caps"
                  style={{ color: "var(--text-primary)" }}
                >
                  {tutorial.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}
                >
                  {tutorial.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "80px 24px",
          background: "var(--bg-deep)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            className="font-barlow"
            style={{
              fontWeight: 800,
              fontSize: "3rem",
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            READY TO HIT
            <br />
            THE LINKS?
          </h2>

          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            Join the elite group of golfers taking performance seriously. Logging scores never felt so rewarding.
          </p>

          <button
            className="btn-primary"
            style={{ cursor: "pointer" }}
            onClick={() => (window.location.href = "/signup")}
          >
            CREATE ACCOUNT NOW
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "32px 24px",
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            © 2024 High-Energy Athletic. All rights reserved.
          </p>
          <div
            style={{
              display: "flex",
              gap: 24,
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Link
              href="/charities"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              Charities
            </Link>
            <Link
              href="/draws"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              Monthly Draw
            </Link>
            <a
              href="#"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}