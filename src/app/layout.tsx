import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { connection } from "next/server";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NairaTrack — Salary, sorted",
    template: "%s · NairaTrack",
  },
  description:
    "A ₦300,000 monthly budget tracker for a salary that arrives in different amounts on different days. Seven category caps, weekly guardrails, savings shadow, and carry-forward top-ups.",
  applicationName: "NairaTrack",
  authors: [{ name: "NairaTrack" }],
  openGraph: {
    title: "NairaTrack — Salary, sorted",
    description:
      "Track inconsistent salary payments against a ₦300,000 monthly plan with seven categories, weekly limits and an expected-savings shadow.",
    type: "website",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d3b2e",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // CSP nonces are generated per request, so every page must be rendered
  // dynamically. This app is session-driven and has no static marketing pages.
  await connection();

  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
