"use client"
import Link from "next/link";
import { Button } from '@/components/Button';
import { ImageOverlayCard } from '@/components/ImageOverlayCard';
import { PricingCard } from '@/components/PricingCard';
import NavBar from '@/components/nav-bar';

const mechanics = [
  {
    step: "01",
    title: "INITIATE",
    desc: "Join the collective roster. Track your play, book the full experience of the golf ecosystem with ties to each.",
    image: "/mechanics-subscribe.png",
  },
  {
    step: "02",
    title: "EXECUTE",
    desc: "Hit the links and record every round. Each score entry can become practical support for causes you care about.",
    image: "/mechanics-score.png",
  },
  {
    step: "03",
    title: "IMPACT",
    desc: "A percentage of every entry is allocated to verified good causes, see your impact grow through monthly analytics.",
    image: "/mechanics-impact.png",
  },
  {
    step: "04",
    title: "REWARD",
    desc: "Pro members are automatically entered into monthly draws for exclusive prizes, drawn randomly from the vault.",
    image: "/mechanics-win.png",
  },
];

const pricingPlans = [
  {
    name: "AMATEUR",
    price: "$0",
    period: "/ month",
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
    name: "TOUR PRO",
    price: "$24",
    period: "/ month",
    features: [
      "Unlimited Score Logging",
      "Sharing & Analytics Dashboard",
      "Monthly Draw Eligibility",
      "Premium Insights & Analytics Dashboard",
    ],
    cta: "SIGN UP NOW",
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
        <NavBar variant="homepage" showAuthButtons={true} />

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
            backgroundImage: "url(/hero-golf-course.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            position: "relative",
          }}
        >
          {/* Dark overlay for text readability */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(to bottom, rgba(8, 15, 26, 0.4), rgba(8, 15, 26, 0.8))",
              zIndex: 1,
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <h1
              className="font-barlow"
              style={{
                fontWeight: 800,
                fontSize: "clamp(4rem, 8vw, 7rem)",
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
                marginBottom: 20,
                maxWidth: "min(1400px, 90vw)",
                textTransform: "uppercase",
                textShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              COMPETE
              <br />
              <span style={{ color: "var(--green)" }}>FOR</span>
              <br />
              GOOD
            </h1>

            <p
              style={{
                fontSize: "clamp(1rem, 2vw, 1.3rem)",
                color: "var(--text-primary)",
                maxWidth: "min(800px, 85vw)",
                marginBottom: 40,
                lineHeight: 1.7,
                fontWeight: 400,
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              Stop playing for nothing. We fuse competitive golf tracking with automated philanthropic giving and massive monthly payouts. Enter the arena.
            </p>

            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <Button onClick={() => (window.location.href = "/signup")}>
                START YOUR JOURNEY
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = "/draws")}>
                VIEW PRIZE POOL
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The Mechanics Timeline Section */}
      <section id="mechanics" className="animate-fade-in" style={{ padding: "60px 20px", background: "var(--bg-deep)", position: "relative" }}>
        <div className="mechanics-timeline" style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            className="label-caps"
            style={{
              color: "var(--green)",
              textAlign: "center",
              marginBottom: 12,
              fontSize: "1.2rem",
              letterSpacing: "0.1em",
            }}
          >
            THE MECHANICS
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "var(--text-primary)",
              fontSize: "clamp(0.9rem, 2vw, 1.3rem)",
              marginBottom: 32,
              maxWidth: "min(700px, 85vw)",
              margin: "0 auto 32px",
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            A SYSTEM OPTIMIZED FOR YOU
          </p>

          {/* Timeline Container */}
          <div style={{ position: "relative", padding: "10px 0" }}>
            {/* Timeline Line */}
            <div
              className="mechanics-line"

            />

            {/* Timeline Items */}
            {mechanics.map((item, index) => (
              <div
                key={item.step}
                className={`mechanics-item animate-fade-up delay-${(index + 1) * 100}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: index < mechanics.length - 1 ? "60px" : "0",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {/* Left Side - Image for odd items, Content for even */}
                {index % 2 === 0 ? (
                  <>
                    <div className="mechanics-side" style={{ flex: 1, paddingRight: "40px", textAlign: "right" }}>
                      <div
                        className="mechanics-card"
                        style={{
                          background: `url(${item.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          height: "280px",
                          borderRadius: "16px",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(135deg, rgba(8,15,26,0.2), rgba(8,15,26,0.7))",
                            display: "flex",
                            alignItems: "flex-end",
                            padding: "20px",
                          }}
                        >
                          <div>
                            <div
                              className="label-caps"
                              style={{
                                color: "var(--green)",
                                fontSize: "0.9rem",
                                marginBottom: "8px",
                              }}
                            >
                              STEP {item.step}
                            </div>
                            <h3
                              className="label-caps"
                              style={{
                                color: "white",
                                fontSize: "1.8rem",
                                marginBottom: "12px",
                                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                              }}
                            >
                              {item.title}
                            </h3>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.9)",
                                fontSize: "0.95rem",
                                lineHeight: 1.5,
                                maxWidth: "300px",
                              }}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Dot */}
                    <div
                      className="mechanics-dot-container"
                      style={{
                        width: "60px",
                        height: "60px",
                        background: "var(--green)",
                        border: "4px solid var(--bg-deep)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 30px",
                        boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)",
                        zIndex: 3,
                        flexShrink: 0
                      }}
                    >
                      <span
                        className="font-barlow"
                        style={{
                          fontWeight: 800,
                          fontSize: "1.2rem",
                          color: "var(--bg-deep)",
                        }}
                      >
                        {item.step}
                      </span>
                    </div>

                    {/* Right Side - Hidden on mobile */}
                    <div className="nav-desktop" style={{ flex: 1, paddingLeft: "40px" }} />
                  </>
                ) : (
                  /* Even items - content on left, image on right */
                  <>
                    <div className="nav-desktop" style={{ flex: 1, paddingRight: "60px" }} />

                    {/* Timeline Dot */}
                    <div
                      className="mechanics-dot-container"
                      style={{
                        width: "60px",
                        height: "60px",
                        background: "var(--green)",
                        border: "4px solid var(--bg-deep)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 20px",
                        boxShadow: "0 0 0 4px rgba(34, 197, 94, 0.2)",
                        zIndex: 3,
                        flexShrink: 0
                      }}
                    >
                      <span
                        className="font-barlow"
                        style={{
                          fontWeight: 800,
                          fontSize: "1.2rem",
                          color: "var(--bg-deep)",
                        }}
                      >
                        {item.step}
                      </span>
                    </div>

                    {/* Right Side - Image for even items */}
                    <div className="mechanics-side" style={{ flex: 1, paddingLeft: "40px" }}>
                      <div
                        className="mechanics-card"
                        style={{
                          background: `url(${item.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          height: "280px",
                          borderRadius: "16px",
                          position: "relative",
                          overflow: "hidden",
                          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(135deg, rgba(8,15,26,0.2), rgba(8,15,26,0.7))",
                            display: "flex",
                            alignItems: "flex-end",
                            padding: "20px",
                          }}
                        >
                          <div>
                            <div
                              className="label-caps"
                              style={{
                                color: "var(--green)",
                                fontSize: "0.9rem",
                                marginBottom: "8px",
                              }}
                            >
                              STEP {item.step}
                            </div>
                            <h3
                              className="label-caps"
                              style={{
                                color: "white",
                                fontSize: "1.8rem",
                                marginBottom: "12px",
                                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                              }}
                            >
                              {item.title}
                            </h3>
                            <p
                              style={{
                                color: "rgba(255,255,255,0.9)",
                                fontSize: "0.95rem",
                                lineHeight: 1.5,
                                maxWidth: "300px",
                              }}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Stakes - Pricing */}
      <section id="pricing" style={{ padding: "60px 24px", background: "var(--bg-surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2
            className="label-caps"
            style={{
              color: "var(--green)",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            CHOOSE YOUR STAKES
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "var(--text-primary)",
              fontSize: "1rem",
              marginBottom: 48,
              maxWidth: 400,
              margin: "0 auto 48px",
            }}
          >
            Assess the options below. Find your ideal fit.
          </p>

          <div
            className="pricing-grid animate-fade-up"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
              maxWidth: 800,
              margin: "0 auto",
            }}
          >
            {pricingPlans.map((plan) => (
              <PricingCard
                key={plan.name}
                name={plan.name}
                price={plan.price}
                period={plan.period}
                features={plan.features}
                cta={plan.cta}
                highlighted={plan.highlighted}
              />
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

          <Button onClick={() => (window.location.href = "/signup")}>
            CREATE ACCOUNT NOW
          </Button>
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