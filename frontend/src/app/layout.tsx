import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ElectronProvider } from "@/components/ElectronProvider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Focus - Project Management",
  description: "The modern project management platform that brings your team together. Collaborate in real-time, track progress effortlessly, and deliver exceptional results.",
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${inter.className} h-full antialiased`} style={{ background: '#0D0D0D' }}>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <Script
          src="https://apis.google.com/js/api.js"
          strategy="afterInteractive"
        />
        <ElectronProvider>
        <AuthProvider>
          <div className="min-h-full" style={{ background: '#0D0D0D' }}>
            {children}
          </div>
        </AuthProvider>
        </ElectronProvider>
      </body>
    </html>
  );
}
