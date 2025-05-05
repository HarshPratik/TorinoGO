
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
// Remove direct import of APIProvider
// import { APIProvider } from '@vis.gl/react-google-maps';
import { Toaster } from '@/components/ui/toaster';
import { MapsApiProvider } from '@/components/providers/maps-api-provider'; // Import the new provider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TorinoGo',
  description: 'Turin Transit Tracker',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Keep the API key check here for an early exit if the key is missing server-side.
  if (!apiKey) {
    console.error(
      'Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.'
    );
    // Render a fallback or error message if the key is missing
    return (
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <div className="flex h-screen items-center justify-center p-4 text-center">
            <p className="text-destructive"> {/* Use destructive color */}
              Google Maps API Key is missing. Please configure it in your .env.local file to load the map.
            </p>
          </div>
          <Toaster /> {/* Keep toaster even on error */}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Wrap children with the new client component provider */}
        <MapsApiProvider apiKey={apiKey}>
          {children}
          <Toaster />
        </MapsApiProvider>
      </body>
    </html>
  );
}
