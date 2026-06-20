import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/settings-provider";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { QueryProvider } from "@/lib/query-provider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hiday - Time Tracking",
  description: "Modern time tracking and productivity management application",
  keywords: ["time tracking", "productivity", "habits", "goals", "tracking"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0C0C0E" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} antialiased`}>
        <SupabaseProvider>
          <QueryProvider>
            <SettingsProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <div className="flex min-h-screen w-full">
                  <SidebarWrapper>
                    {children}
                  </SidebarWrapper>
                </div>
              </ThemeProvider>
            </SettingsProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
