/** @type {import('next').NextConfig} */
const nextConfig = {
  // PRD §13: Performance — moved from experimental to top-level
  serverExternalPackages: ["winston", "razorpay"],

  // PRD §13: HTTPS enforced in production via Vercel (automatic)
  // Security headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  allowedDevOrigins: ['192.168.56.1'],
};

module.exports = nextConfig;