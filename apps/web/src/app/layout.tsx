import type { Metadata } from "next";
import { Space_Grotesk, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const headingFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const bodyFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mesreltime.example.com"),
  title: {
    default: "MesrelTime | Realtime Messaging",
    template: "%s | MesrelTime"
  },
  description: "High-performance realtime messaging platform for communities and teams.",
  openGraph: {
    type: "website",
    title: "MesrelTime",
    description: "Realtime communication at startup scale.",
    url: "https://mesreltime.example.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "MesrelTime",
    description: "Realtime communication at startup scale."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen" style={{ fontFamily: "var(--font-body), sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
