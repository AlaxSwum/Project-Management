import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "ProjectFlow - Modern Project Management",
  description: "Streamline your workflow with modern project management tools. Plan, track, and deliver projects efficiently.",
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
        <AuthProvider>
          <div className="min-h-full" style={{ background: '#F5F5ED' }}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
