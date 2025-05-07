// src/app/page.tsx
'use client'; // This page renders client-heavy components

import { MapLoader } from '@/components/map-loader';
// Skeleton can be used by MapLoader if needed, or as a fallback here
// import { Skeleton } from '@/components/ui/skeleton';

export default function WebHomePage() {
  return (
    <main className="flex h-screen flex-col">
      <MapLoader />
    </main>
  );
}
