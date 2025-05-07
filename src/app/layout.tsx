
// Remove 'use client' as it's not strictly needed anymore and allows metadata export.
// import type { Metadata } from 'next'; // Already imported but commented out below.
// import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';


// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = { // For web
  title: 'TorinoGo',
  description: 'Turin Transit Tracker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      > */}
      <body> {/* Simplified for now if web is still needed */}
        {children}
        <Toaster /> {/* This is the ShadCN Toaster for web */}
      </body>
    </html>
  );
}
