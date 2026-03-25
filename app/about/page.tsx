"use client"
import Link from "next/link";
import { Button } from '@/components/Button';

export default function AboutPage() {
  return (
    <main style={{ background: "var(--bg-deep)", color: "var(--text-primary)", minHeight: "100vh" }}>
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
              Merit Golf
            </span>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <Link
              href="/"
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
              Home
            </Link>
            <Link
              href="/about"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--green)",
                textDecoration: "none",
                padding: "8px 0",
                transition: "color 0.15s",
              }}
            >
              About
            </Link>
            <Link
              href="#mechanics"
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
              Mechanics
            </Link>
            <Link
              href="#pricing"
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
              Pricing
            </Link>
            <Button onClick={() => (window.location.href = "/signup")}>
              START YOUR JOURNEY
            </Button>
          </div>
        </div>
      </header>

      {/* About Content */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: 1000,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1
          className="font-barlow"
          style={{
            fontWeight: 800,
            fontSize: "3.5rem",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 24,
            color: "var(--text-primary)",
          }}
        >
          ABOUT
          <span style={{ color: "var(--green)" }}> HIGH ENERGY </span>
          ATHLETIC
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: 48,
            maxWidth: 800,
            margin: "0 auto 48px",
          }}
        >
          We're revolutionizing the golf experience by transforming every round into an opportunity for personal growth, charitable giving, and exciting rewards. Our platform connects passionate golfers with meaningful causes while creating a competitive environment that elevates your game.
        </p>

        {/* Mission Section */}
        <div
          className="hea-card"
          style={{
            padding: "48px",
            marginBottom: 48,
            textAlign: "left",
            borderLeft: "4px solid var(--green)",
          }}
        >
          <h2
            className="label-caps"
            style={{
              color: "var(--green)",
              marginBottom: 16,
              fontSize: "0.9rem",
            }}
          >
            OUR MISSION
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-primary)",
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            To create a community where golf enthusiasts can pursue excellence while making a tangible impact on causes they care about. We believe that every swing, every putt, and every round can contribute to something greater than the game itself.
          </p>
        </div>

        {/* Values Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 32,
            marginBottom: 48,
          }}
        >
          <div className="hea-card" style={{ padding: "32px" }}>
            <div
              style={{
                width: 60,
                height: 60,
                background: "var(--green-bg)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>⛳</span>
            </div>
            <h3
              className="label-caps"
              style={{
                color: "var(--text-primary)",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              EXCELLENCE
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              We push boundaries and inspire golfers to achieve their personal best through performance tracking and competitive incentives.
            </p>
          </div>

          <div className="hea-card" style={{ padding: "32px" }}>
            <div
              style={{
                width: 60,
                height: 60,
                background: "var(--green-bg)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>🤝</span>
            </div>
            <h3
              className="label-caps"
              style={{
                color: "var(--text-primary)",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              IMPACT
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Every game contributes to verified charitable causes, creating measurable positive change in communities worldwide.
            </p>
          </div>

          <div className="hea-card" style={{ padding: "32px" }}>
            <div
              style={{
                width: 60,
                height: 60,
                background: "var(--green-bg)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>🏆</span>
            </div>
            <h3
              className="label-caps"
              style={{
                color: "var(--text-primary)",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              REWARDS
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Premium members enjoy exclusive prizes and recognition for their performance and commitment to the community.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div
          style={{
            background: "var(--bg-card)",
            padding: "48px",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-barlow"
            style={{
              fontWeight: 800,
              fontSize: "2.5rem",
              letterSpacing: "-0.02em",
              marginBottom: 16,
              color: "var(--text-primary)",
            }}
          >
            READY TO JOIN THE
            <span style={{ color: "var(--green)" }}> MOVEMENT?</span>
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            Start your journey today and become part of a community that's changing the game, one round at a time.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <Button onClick={() => (window.location.href = "/signup")}>
              START YOUR JOURNEY
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = "/")}>
              BACK TO HOME
            </Button>
          </div>
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
        </div>
      </footer>
    </main>
  );
}
