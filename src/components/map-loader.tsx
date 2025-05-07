
'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MapContainer } from '@/components/map-container'; // Direct import for simplicity

export function MapLoader() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Skeleton className="h-full w-full" />;
  }

  // Once client-side, render the MapContainer which handles Leaflet.
  // Add a key to MapContainer to ensure it re-mounts if critical props change,
  // or if a full reset is needed after an error or complex state change.
  // For instance, if leaflet instance got corrupted.
  // Using a simple Date.now() key for demonstration of re-mounting.
  // A more sophisticated key might be based on specific conditions.
  return (
    <div className="h-full w-full relative" id="map-loader-wrapper">
      <MapContainer key={`map-instance-${Date.now()}`} />
    </div>
  );
}
