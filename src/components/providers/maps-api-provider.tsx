
'use client';

import type React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface MapsApiProviderProps {
  apiKey: string;
  children: React.ReactNode;
}

export function MapsApiProvider({ apiKey, children }: MapsApiProviderProps) {
  if (!apiKey) {
    console.error('Google Maps API key is missing for MapsApiProvider.');
    // Render a fallback message if the key is missing
    return (
        <div className="flex h-screen items-center justify-center p-4 text-center">
            <p className="text-destructive">
              Google Maps API Key is missing. Cannot initialize map provider. Please check your environment configuration.
            </p>
         </div>
    );
  }
  return <APIProvider apiKey={apiKey}>{children}</APIProvider>;
}
