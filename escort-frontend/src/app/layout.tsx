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
  description: "find the best call girls in Kenya, Nairobi Sex escorts for your pleasure ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Navbar />
       <main> {children} </main>
      </body>
    </html>
  );
}
