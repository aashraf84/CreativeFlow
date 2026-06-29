import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VortexERP - Social Media Agency Management Platform",
  description: "Enterprise-grade ERP for social media, advertising, and digital agencies. Manage content pipelines, dissemination, teams, and multi-platform publishing.",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

/**
 * Inline theme bootstrap — runs before paint to apply the saved theme
 * and prevent a flash of the wrong color scheme (FOUC).
 */
const themeBootstrap = `
(function() {
  try {
    var t = localStorage.getItem('vortex-theme');
    var mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (t === 'dark' || (!t && mql.matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
