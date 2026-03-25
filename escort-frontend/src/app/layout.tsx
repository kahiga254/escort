import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import Navbar from "./components/Navbar";
import "./globals.css";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Nairobi Elite Escorts",
  description: "find the best call girls in Kenya, Nairobi Sex escorts for your pleasure",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ CRITICAL FIX: Viewport meta tag for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#7C3AED" />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <Navbar />
        {/* ✅ FIX: Prevent horizontal overflow on all pages */}
        <main className="w-full overflow-x-hidden">{children}</main>
      </body>
    </html>
  );
}