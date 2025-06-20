import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Project Management",
  description: "Modern project management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <div className="min-h-full bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
