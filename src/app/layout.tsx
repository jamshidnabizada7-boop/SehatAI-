import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/app/pwa-register";
import { AppSessionProvider } from "@/components/auth/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SehatAI — Safety-first health guidance for Pakistan",
  description:
    "SehatAI gives trilingual (English / اردو / Roman Urdu) health guidance with a safety-first pipeline, emergency detection, cited sources and offline support. Not a doctor — in an emergency call 1122.",
  applicationName: "SehatAI",
  keywords: [
    "SehatAI",
    "health guidance",
    "Pakistan",
    "Urdu health",
    "emergency triage",
    "WHO",
    "PWA",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppSessionProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-center" closeButton />
            <PwaRegister />
          </AppSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
