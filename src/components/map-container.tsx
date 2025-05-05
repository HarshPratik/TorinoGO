'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import type { GTFSStop, Location } from '@/services/gtt';
import { getNearbyStops } from '@/services/gtt';
import { Button } from '@/components/ui/button';
import { LocateFixed, Bus, TramFront, Train } from 'lucide-react';
import { StopDetailSheet } from '@/components/stop-detail-sheet';
import { Skeleton } from '@/components/ui/skeleton';

// Turin center coordinates
const DEFAULT_CENTER = { lat: 45.0703, lng: 7.6869 };
const DEFAULT_ZOOM = 14;
const NEARBY_RADIUS_METERS = 1000; // Fetch stops within 1km

export function MapContainer() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [stops, setStops] = useState<GTFSStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<GTFSStop | null>(null);
  const [center, setCenter] = useState<Location>(DEFAULT_CENTER);
  const [loadingStops, setLoadingStops] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const apiIsLoaded = useApiIsLoaded();
  const map = useMap();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setCenter(location); // Center map on user location
          setError(null);
        },
        (err) => {
          console.warn(`ERROR(${err.code}): ${err.message}`);
          setError('Unable to retrieve your location. Showing default view.');
          // Keep default center if location fails
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      // Keep default center if geolocation not supported
    }
  }, []);

  // Fetch nearby stops when center changes
  useEffect(() => {
    async function fetchStops() {
      if (!center) return;
      setLoadingStops(true);
      setError(null);
      try {
        const nearbyStops = await getNearbyStops(center, NEARBY_RADIUS_METERS);
        setStops(nearbyStops);
      } catch (fetchError) {
        console.error('Error fetching stops:', fetchError);
        setError('Failed to load public transport stops.');
        setStops([]); // Clear stops on error
      } finally {
        setLoadingStops(false);
      }
    }
    fetchStops();
  }, [center]); // Refetch when map center changes (after drag/zoom)

  const handleMarkerClick = (stop: GTFSStop) => {
    setSelectedStop(stop);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    // Delay clearing selectedStop to allow sheet close animation
    setTimeout(() => {
      setSelectedStop(null);
    }, 300);
  };


  const handleRecenter = () => {
    if (userLocation && map) {
      map.moveCamera({ center: userLocation, zoom: DEFAULT_ZOOM + 2 }); // Zoom in slightly more when recentering
      setCenter(userLocation); // Trigger refetch centered on user
    } else if (navigator.geolocation) {
       // If user location is null but geolocation is available, try fetching it again
        navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setUserLocation(location);
              setCenter(location);
              if(map) map.moveCamera({ center: location, zoom: DEFAULT_ZOOM + 2 });
              setError(null);
            },
            (err) => {
              console.warn(`ERROR(${err.code}): ${err.message}`);
              setError('Unable to retrieve your location.');
            }
          );
    }
  };

  const handleMapDragEnd = () => {
    if (map) {
      const newCenter = map.getCenter()?.toJSON();
      if (newCenter) {
        // Only update center (and trigger refetch) if the center changed significantly
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(center.lat, center.lng),
          new google.maps.LatLng(newCenter.lat, newCenter.lng)
        );
        // Update if map moved more than ~100m to avoid excessive refetches
        if (distance > 100) {
            setCenter(newCenter);
        }
      }
    }
  };

   const handleMapZoomChanged = () => {
     // Optional: could refetch stops on zoom change if desired,
     // but might lead to too many requests. Dragend is often sufficient.
     // If implementing, consider debouncing.
     // handleMapDragEnd(); // Or a separate debounced function
   };

  // Memoize markers to avoid unnecessary re-renders
  const stopMarkers = useMemo(
    () =>
      stops.map((stop) => (
        <AdvancedMarker
          key={stop.stopId}
          position={{ lat: stop.stopLat, lng: stop.stopLon }}
          onClick={() => handleMarkerClick(stop)}
          title={stop.stopName}
        >
          {/* Simple icon for now, could be customized based on stop type */}
           <div className="rounded-full bg-primary p-1 shadow-md">
            <Bus size={16} className="text-primary-foreground" />
          </div>
        </AdvancedMarker>
      )),
    [stops] // Dependency array includes stops
  );


  if (!apiIsLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        mapId={'torino-transit-map'} // Optional: for Cloud-based map styling
        style={{ width: '100%', height: '100%' }}
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        center={center} // Controlled center
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        onDragEnd={handleMapDragEnd}
        onZoomChanged={handleMapZoomChanged}
      >
        {/* User Location Marker */}
        {userLocation && (
          <AdvancedMarker
            position={userLocation}
            title="Your Location"
          >
            <div className="h-4 w-4 rounded-full bg-accent ring-2 ring-white shadow-lg"></div>
          </AdvancedMarker>
        )}

        {/* Stop Markers */}
        {stopMarkers}


        {/* Loading Indicator */}
        {loadingStops && (
           <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 transform rounded bg-background/80 px-3 py-1 text-xs shadow">
             Loading stops...
           </div>
         )}

         {/* Error Message */}
         {error && (
           <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 transform rounded bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg">
             {error}
           </div>
         )}


      </Map>


      {/* Recenter Button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-24 right-4 z-10 shadow-lg"
        onClick={handleRecenter}
        aria-label="Recenter map on your location"
      >
        <LocateFixed size={20} />
      </Button>

       {/* Stop Detail Sheet */}
      <StopDetailSheet
        stop={selectedStop}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />

        {/* Placeholder for Search Bar & Route Planning - To be implemented later */}
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
            <div className="flex-grow rounded-md bg-background p-3 text-muted-foreground shadow-lg text-sm">
                Search for destination (coming soon)
            </div>
            {/* Placeholder for Saved Places Button */}
            <Button variant="secondary" className="shadow-lg">
                Saved
            </Button>
        </div>

    </div>
  );
}
