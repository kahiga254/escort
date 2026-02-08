import type { Metadata } from "next";
import { Inter} from 'next/font/google';
import Navbar from "./components/Navbar";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ['latin']});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nairobi Elite Escorts",
  description: "find the best call girls in Kenya, Nairobi Sex escorts for your pleasure",
  
  // Enhanced favicon configuration with multiple sizes
  icons: {
    icon: [
      // Multiple resolutions for different devices
      { url: '/favicon.ico', sizes: 'any' }, // Multi-size .ico
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' }, // Scalable vector
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        rel: 'icon',
        url: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
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
        {/* Enhanced favicon links for better browser support */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* For Windows tiles */}
        <meta name="msapplication-TileColor" content="#7C3AED" />
        <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
                <script dangerouslySetInnerHTML={{
          __html: `
            // Remove Next.js error overlay
            setInterval(() => {
              const overlays = document.querySelectorAll('nextjs-portal, [data-nextjs-dialog]');
              overlays.forEach(el => el.remove());
            }, 100);
          `
        }} />
      </body>
    </html>
  );
}