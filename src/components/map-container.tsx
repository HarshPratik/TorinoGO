
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  CircleMarker,
  useMapEvents,
} from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet'; // Import Leaflet's Map type
import L from 'leaflet'; // Import Leaflet library
import type { GTFSStop, Location } from '@/services/gtt';
import { getNearbyStops, calculateDistance } from '@/services/gtt'; // Use calculateDistance from gtt
import { Button } from '@/components/ui/button';
import { LocateFixed, Bus } from 'lucide-react';
import { StopDetailSheet } from '@/components/stop-detail-sheet';
import { Skeleton } from '@/components/ui/skeleton';

// Turin center coordinates
const DEFAULT_CENTER: L.LatLngExpression = [45.0703, 7.6869]; // Use Leaflet's LatLngExpression
const DEFAULT_ZOOM = 14;
const NEARBY_RADIUS_METERS = 1000; // Fetch stops within 1km

// Fix default icon issue with Leaflet and Webpack
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl: iconRetinaUrl.src,
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Inner component to access map instance via hooks
function MapEvents({ onCenterChange, onZoomChange }: { onCenterChange: (center: L.LatLng) => void, onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    dragend: () => {
      onCenterChange(map.getCenter());
    },
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onCenterChange(center); // Update center when zoom changes too
      onZoomChange(zoom);
    },
  });
  return null;
}

// Inner component to allow controlling map view
function MapController({ center, zoom }: { center: L.LatLngExpression, zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}


export function MapContainer() {
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [stops, setStops] = useState<GTFSStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<GTFSStop | null>(null);
  const [currentCenter, setCurrentCenter] = useState<L.LatLng>(L.latLng(DEFAULT_CENTER[0], DEFAULT_CENTER[1])); // Use L.latLng
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [loadingStops, setLoadingStops] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false); // Track Leaflet map instance readiness

  const mapRef = useRef<LeafletMap>(null); // Ref to access map instance if needed

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = L.latLng( // Use L.latLng
            position.coords.latitude,
            position.coords.longitude
          );
          setUserLocation(location);
          setCurrentCenter(location); // Center map on user location
          setCurrentZoom(DEFAULT_ZOOM + 2); // Zoom in when location found
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
      if (!currentCenter || !isMapReady) return; // Ensure map is ready before fetching
      setLoadingStops(true);
      setError(null);
      try {
        const nearbyStops = await getNearbyStops(
          { lat: currentCenter.lat, lng: currentCenter.lng }, // Convert L.LatLng back for service
          NEARBY_RADIUS_METERS
        );
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
  }, [currentCenter, isMapReady]); // Refetch when map center changes or map becomes ready

  const handleMarkerClick = (stop: GTFSStop) => {
    setSelectedStop(stop);
    setIsSheetOpen(true);
    // Center map on the selected stop marker smoothly
    if(mapRef.current) {
        mapRef.current.flyTo([stop.stopLat, stop.stopLon], mapRef.current.getZoom());
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    // Delay clearing selectedStop to allow sheet close animation
    setTimeout(() => {
      setSelectedStop(null);
    }, 300);
  };

  const handleRecenter = () => {
    if (userLocation) {
       const zoom = Math.max(currentZoom, DEFAULT_ZOOM + 2); // Use current or zoomed-in level
       setCurrentCenter(userLocation);
       setCurrentZoom(zoom);
    } else if (navigator.geolocation) {
      // If user location is null but geolocation is available, try fetching it again
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = L.latLng(
            position.coords.latitude,
            position.coords.longitude
          );
          setUserLocation(location);
          setCurrentCenter(location);
          setCurrentZoom(DEFAULT_ZOOM + 2);
          setError(null);
        },
        (err) => {
          console.warn(`ERROR(${err.code}): ${err.message}`);
          setError('Unable to retrieve your location.');
        }
      );
    }
  };

   const handleCenterChange = (newCenter: L.LatLng) => {
       const distance = calculateDistance(
         { lat: currentCenter.lat, lng: currentCenter.lng },
         { lat: newCenter.lat, lng: newCenter.lng }
       );
       // Update if map moved more than ~100m to avoid excessive refetches on minor drags
       if (distance > 100) {
           setCurrentCenter(newCenter);
       }
   };

   const handleZoomChange = (newZoom: number) => {
       setCurrentZoom(newZoom);
   };

   // Set map ready state
   const onMapReady = (mapInstance: LeafletMap) => {
       mapRef.current = mapInstance;
       setIsMapReady(true);
       // Set initial view again after map is ready, ensuring correct positioning
       mapInstance.setView(currentCenter, currentZoom);
   };

  // Memoize markers to avoid unnecessary re-renders
  const stopMarkers = useMemo(
    () =>
      stops.map((stop) => (
        <Marker
          key={stop.stopId}
          position={[stop.stopLat, stop.stopLon]} // Leaflet uses [lat, lng] array
          eventHandlers={{
            click: () => handleMarkerClick(stop),
          }}
          title={stop.stopName} // Tooltip on hover
        >
          {/* Simple Bus Icon Marker */}
          <Popup>
            <b>{stop.stopName}</b><br />Stop ID: {stop.stopId}
          </Popup>
        </Marker>
      )),
    [stops] // Dependency array includes stops
  );

  // Define user location icon (Blue circle)
  const userLocationIcon = L.divIcon({
    html: '<div class="h-4 w-4 rounded-full bg-accent ring-2 ring-white shadow-lg"></div>',
    className: '', // Remove default Leaflet icon styles
    iconSize: [16, 16],
    iconAnchor: [8, 8], // Center the icon
  });

   // Define stop marker icon (Primary color bus)
    const stopIcon = L.divIcon({
       html: `<div class="rounded-full bg-primary p-1 shadow-md flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus text-primary-foreground"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
              </div>`,
       className: '', // Remove default Leaflet icon styles
       iconSize: [24, 24],
       iconAnchor: [12, 12], // Center the icon
       popupAnchor: [0, -12],
     });


  // Conditional rendering for LeafletMapContainer based on client-side execution
  if (typeof window === 'undefined') {
    // Render Skeleton or placeholder during SSR/build
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }


  return (
    <div className="relative h-full w-full">
      <LeafletMapContainer
        center={DEFAULT_CENTER} // Initial center only
        zoom={DEFAULT_ZOOM} // Initial zoom only
        style={{ width: '100%', height: '100%' }}
        whenCreated={onMapReady} // Use whenCreated to get map instance
        className="z-0" // Ensure map is behind overlays
      >
         {/* Map Controller for setting view */}
         <MapController center={currentCenter} zoom={currentZoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Listen to map events */}
         <MapEvents onCenterChange={handleCenterChange} onZoomChange={handleZoomChange} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation} // Leaflet uses LatLng object
            icon={userLocationIcon}
            title="Your Location"
          />
        )}

        {/* Stop Markers */}
        {stops.map((stop) => (
          <Marker
            key={stop.stopId}
            position={[stop.stopLat, stop.stopLon]}
            icon={stopIcon}
            eventHandlers={{
              click: () => handleMarkerClick(stop),
            }}
            title={stop.stopName} // Tooltip on hover
          >
             <Popup>
                <b>{stop.stopName}</b><br />
                Stop ID: {stop.stopId} <br />
                <button onClick={() => handleMarkerClick(stop)} className="text-primary underline text-sm mt-1">View Arrivals</button>
             </Popup>
          </Marker>
        ))}

        {/* Loading Indicator */}
        {loadingStops && (
           <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 transform rounded bg-background/80 px-3 py-1 text-xs shadow" style={{zIndex: 1000}}>
             Loading stops...
           </div>
         )}

         {/* Error Message */}
         {error && (
           <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 transform rounded bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg" style={{zIndex: 1000}}>
             {error}
           </div>
         )}

      </LeafletMapContainer>


      {/* Recenter Button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-24 right-4 z-10 shadow-lg"
        onClick={handleRecenter}
        aria-label="Recenter map on your location"
        style={{zIndex: 1000}}
      >
        <LocateFixed size={20} />
      </Button>

       {/* Stop Detail Sheet */}
      <StopDetailSheet
        stop={selectedStop}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />

        {/* Placeholder for Search Bar & Route Planning */}
        <div className="absolute top-4 left-4 right-4 z-10 flex gap-2" style={{zIndex: 1000}}>
            <div className="flex-grow rounded-md bg-background p-3 text-muted-foreground shadow-lg text-sm">
                Search for destination (coming soon)
            </div>
            <Button variant="secondary" className="shadow-lg">
                Saved
            </Button>
        </div>

    </div>
  );
}
