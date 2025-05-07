
'use client'; // Keep this if Toaster or other client components are used for web

import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google'; // Native uses different font loading
import './globals.css'; // Tailwind globals, may need separate styling for native
// import 'leaflet/dist/leaflet.css'; // Leaflet CSS, not used in native
import { Toaster } from '@/components/ui/toaster'; // This Toaster is for web

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

// export const metadata: Metadata = { // For web
//   title: 'TorinoGo',
//   description: 'Turin Transit Tracker',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // For native, this layout is not directly used. App.tsx provides the root.
  // If sharing layout, create a cross-platform component.
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
