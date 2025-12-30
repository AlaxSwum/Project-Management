import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ElectronProvider } from "@/components/ElectronProvider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Focus - Project Management",
  description: "Streamline your workflow with modern project management tools. Plan, track, and deliver projects efficiently.",
  icons: {
    icon: [
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon-32.png',
    apple: '/favicon-32.png',
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
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`} style={{ background: '#F5F5ED' }}>
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
            <div className="min-h-full" style={{ background: '#F5F5ED' }}>
              {children}
            </div>
          </AuthProvider>
        </ElectronProvider>
      </body>
    </html>
  );
}
