import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavBarWrapper } from "@/components/nav-bar-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/components/settings-provider";
import { SupabaseProvider } from "@/lib/supabase/provider";
import { QueryProvider } from "@/lib/query-provider";

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
    { media: "(prefers-color-scheme: light)", color: "#FDFCF5" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
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
                  <NavBarWrapper>
                    {children}
                  </NavBarWrapper>
                </div>
              </ThemeProvider>
            </SettingsProvider>
          </QueryProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
