
// import dynamic from 'next/dynamic';
// import { Skeleton } from '@/components/ui/skeleton';

// // Dynamically import the MapContainer component with SSR disabled
// // This ensures Leaflet, which relies on 'window', is only loaded on the client-side.
// const DynamicMapContainer = dynamic(
//   () => import('@/components/map-container').then((mod) => mod.MapContainer),
//   {
//     ssr: false, // Ensure this component only renders on the client
//     loading: () => <Skeleton className="h-screen w-full" />, // Optional loading state
//   }
// );


// export default function Home() {
//   return (
//     // <main className="flex h-screen flex-col">
//     //   <DynamicMapContainer />
//     // </main>
//     // For native, this page is not used. App.tsx is the entry point.
//     // If you want to share code, create components usable by both web and native.
//     null
//   );
// }

// This file is primarily for the Next.js web app.
// For the Expo app, the entry point is App.tsx or a file in an 'app' directory if using expo-router.
export default function WebHomePage() {
  // If you intend to keep the web version functional alongside native,
  // you would conditionally render web-specific components here or adjust your routing.
  // For now, we assume the primary focus is shifting to native.
  return null;
}
