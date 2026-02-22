import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Realtime Messaging Platform",
  description: "Startup-ready messaging architecture with low latency and high availability."
};

export const revalidate = 300;

export default async function MarketingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MesrelTime",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Web",
    description: "Realtime messaging platform with chat, voice, and notifications"
  };

  return (
    <main className="grid-bg min-h-screen px-6 py-12 md:px-12">
      <div className="mx-auto max-w-6xl">
        <section className="fade-in rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.2em] text-mint">Realtime Platform</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
            Ship Discord-grade messaging in weeks, not years.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-[var(--subtext)] md:text-lg">
            Built for low latency delivery, horizontal scaling, and production operations from day one.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-xl font-semibold">100k+ concurrent</h2>
              <p className="mt-2 text-sm text-[var(--subtext)]">Socket.io Redis adapter, sticky sessions, and autoscaling-ready services.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-xl font-semibold">&lt;100ms delivery target</h2>
              <p className="mt-2 text-sm text-[var(--subtext)]">In-memory presence, keyset pagination, and optimized fanout strategy.</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h2 className="text-xl font-semibold">HA architecture</h2>
              <p className="mt-2 text-sm text-[var(--subtext)]">Replica sets, resilient queues, DLQ, readiness and liveness probes.</p>
            </article>
          </div>
        </section>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  );
}
