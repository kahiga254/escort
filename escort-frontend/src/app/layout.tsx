import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import Navbar from "./components/Navbar";
import AgeVerificationModal from "./components/AgeVerificationModal";
import InactivityLogout from "./components/InactivityLogout";
import { organizationSchema } from "./schema";
import Script from "next/script";
import "./global.css";

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Nairobi Elite Escorts - Premium Call Girls & Companions",
  description: "Find the best call girls in Kenya, Nairobi sex escorts for your pleasure. Elite, verified, and discreet escort services.",
  keywords: "escorts, Nairobi, companions, professional escorts, vip escorts, high-class escorts, call girls, elite escorts, discreet companionship, Nairobi nightlife, escort services, premium escorts, Nairobi social scene",
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://escorthub254.com",
    siteName: "Nairobi Elite Escorts",
    title: "Nairobi Elite Escorts - Premium Call Girls & Companions",
    description: "Find the best call girls in Kenya, Nairobi sex escorts for your pleasure. Elite, verified, and discreet escort services.",
    images: [
      {
        url: "https://escorthub254.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nairobi Elite Escorts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nairobi Elite Escorts - Premium Call Girls & Companions",
    description: "Find the best call girls in Kenya, Nairobi sex escorts for your pleasure.",
    images: ["https://escorthub254.com/og-image.png"],
  },
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="keywords" content="escorts, Nairobi, companions, professional escorts, vip escorts, high-class escorts, call girls, elite escorts, discreet companionship, Nairobi nightlife, escort services, premium escorts, Nairobi social scene" />
        <link rel="canonical" href="https://escorthub254.com" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#7C3AED" />
        
        {/* Defer CSS loading to avoid render blocking */}
        <link rel="preload" href="/global.css" as="style" />
        <link rel="stylesheet" href="/global.css" />
        
        {/* Inline critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background-color: #f9fafb; }
            .navbar { position: sticky; top: 0; z-index: 50; background: white; }
            .image-placeholder { background: #f3f4f6; aspect-ratio: 1/1; width: 100%; }
          `
        }} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-EG24SPQ2XX"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-EG24SPQ2XX');
            `,
          }}
        />
        <Navbar />
        <main className="w-full overflow-x-hidden">{children}</main>
        <AgeVerificationModal />
        <InactivityLogout />
      </body>
    </html>
  );
}