import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Interactive Generative Art",
  description: "An interactive generative art website with mathematical models and abstract designs",
  keywords: ["generative art", "interactive", "3D", "visualization", "creative coding"],
  authors: [{ name: "Interactive Art Creator" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
