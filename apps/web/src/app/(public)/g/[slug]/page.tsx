import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;

export function generateStaticParams() {
  return [{ slug: "general" }, { slug: "announcements" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Group ${params.slug}`,
    description: `Public group ${params.slug} on MesrelTime`,
    openGraph: {
      title: `Group ${params.slug}`,
      description: "Public community page"
    }
  };
}

export default async function PublicGroupPage({ params }: Props) {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-4xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-sun">Public group</p>
        <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
          /g/{params.slug}
        </h1>
        <p className="mt-3 text-[var(--subtext)]">SSR public group page with crawlable content and dynamic metadata.</p>
      </section>
    </main>
  );
}
