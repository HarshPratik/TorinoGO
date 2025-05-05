
'use client'; // Mark this component as a Client Component

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the MapContainer component with SSR disabled
const DynamicMapContainer = dynamic(
  () => import('@/components/map-container').then((mod) => mod.MapContainer),
  {
    ssr: false, // This is now allowed because this is a Client Component
    loading: () => <Skeleton className="h-screen w-full" />, // Optional loading state
  }
);

export function MapLoader() {
  return <DynamicMapContainer />;
}
