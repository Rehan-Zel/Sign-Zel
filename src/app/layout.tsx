import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Space_Grotesk,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Sign Zel — AI Cloud Android APK Builder & GitHub Workflow Orchestrator",
  description:
    "Connect your GitHub API & AI API keys, drop any HTML, ZIP, or app folder, auto-synthesize missing Gradle Kotlin DSL & AndroidManifest files, and trigger automated GitHub Actions APK builds.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased selection:bg-indigo-500/30">{children}</body>
    </html>
  );
}
