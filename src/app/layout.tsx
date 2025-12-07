import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scap",
  description: "The next generation social media",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground h-[100dvh] overflow-hidden`}
        >
          <div className="flex h-full" suppressHydrationWarning>
            <Sidebar />
            <main className="flex-1 h-full w-full pb-16 md:pb-0 overflow-y-auto relative no-scrollbar">
              {children}
            </main>
          </div>
          <MobileNav />
        </body>
      </html>
    </ClerkProvider>
  );
}
