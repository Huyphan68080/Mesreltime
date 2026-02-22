import type { Metadata } from "next";

interface Props {
  params: { username: string };
}

export const revalidate = 3600;

export function generateStaticParams() {
  return [{ username: "mesrelteam" }, { username: "support" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = params.username;

  return {
    title: `${username} profile`,
    description: `Public profile of ${username} on MesrelTime`,
    openGraph: {
      title: `${username} | MesrelTime`,
      description: `Public profile of ${username}`
    },
    twitter: {
      card: "summary",
      title: `${username} | MesrelTime`
    }
  };
}

export default async function PublicProfilePage({ params }: Props) {
  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-mint">Public profile</p>
        <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
          @{params.username}
        </h1>
        <p className="mt-3 text-[var(--subtext)]">SSR public user profile page with dynamic metadata for SEO and social cards.</p>
      </section>
    </main>
  );
}
