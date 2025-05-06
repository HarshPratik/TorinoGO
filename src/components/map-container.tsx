
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { Map as LeafletMap, LatLng, LatLngExpression } from 'leaflet';
import L from 'leaflet'; // Import L for LatLng and Icon types
import type { GTFSStop } from '@/services/gtt';
import { getNearbyStops, calculateDistance } from '@/services/gtt';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';
import { StopDetailSheet } from '@/components/stop-detail-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

// Configure Leaflet default icons (client-side only)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl; // Temp fix for a known issue with Next.js/Webpack
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}


// Constants
const DEFAULT_CENTER_LATLNG: LatLngExpression = [45.0703, 7.6869]; // Turin center coordinates
const DEFAULT_ZOOM = 14;
const NEARBY_RADIUS_METERS = 1000;


// Helper component to handle map events
function MapEvents({ onCenterChange, onZoomChange }: { onCenterChange: (center: LatLng) => void, onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    dragend: () => onCenterChange(map.getCenter()),
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onCenterChange(center); // Update center on zoom too, as it might shift
      onZoomChange(zoom);
    },
    // load: () => { // This can sometimes fire too early or cause multiple initial loads
    //   onCenterChange(map.getCenter());
    //   onZoomChange(map.getZoom());
    // }
  });
  return null;
}

// Helper component to control map view programmatically
function MapController({ center, zoom }: { center: LatLngExpression, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export function MapContainer() {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [stops, setStops] = useState<GTFSStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<GTFSStop | null>(null);
  const [currentCenter, setCurrentCenter] = useState<LatLng>(L.latLng(DEFAULT_CENTER_LATLNG[0], DEFAULT_CENTER_LATLNG[1]));
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [loadingStops, setLoadingStops] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasFetchedInitialStops, setHasFetchedInitialStops] = useState(false);

  const mapRef = useRef<LeafletMap | null>(null);
  const { toast } = useToast();

  // Get user location
  useEffect(() => {
    let isMounted = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const location = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(location);
          // Only update center if it's the first time or user explicitly recenters
          if (!hasFetchedInitialStops) {
            setCurrentCenter(location);
            setCurrentZoom(DEFAULT_ZOOM + 2); // Zoom in closer to user location
          }
          setError(null);
        },
        (err) => {
          if (!isMounted) return;
          console.warn(`Geolocation Error (${err.code}): ${err.message}`);
          setError('Unable to retrieve your location. Showing default view.');
          toast({ title: "Location Error", description: "Could not get your location. Displaying default area.", variant: "destructive" });
           // Fetch stops for default location if geolocation fails
          if (!hasFetchedInitialStops) fetchStops(currentCenter);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (!isMounted) return;
      setError('Geolocation is not supported by this browser.');
      toast({ title: "Geolocation Error", description: "Geolocation not supported. Displaying default area.", variant: "destructive" });
      // Fetch stops for default location if geolocation not supported
      if (!hasFetchedInitialStops) fetchStops(currentCenter);
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const fetchStops = async (center: LatLng) => {
    // Ensure mapRef.current is available; isMapReady might not be strictly needed here
    // if we only care about the center coordinates for the API call.
    setLoadingStops(true);
    setError(null);
    try {
      const nearbyStops = await getNearbyStops({ lat: center.lat, lng: center.lng }, NEARBY_RADIUS_METERS);
      setStops(nearbyStops);
      if (!hasFetchedInitialStops) {
        setHasFetchedInitialStops(true);
      }
    } catch (fetchError) {
      console.error('Error fetching stops:', fetchError);
      setError('Failed to load public transport stops.');
      setStops([]);
      toast({ title: "Network Error", description: "Failed to load nearby stops. Please try again later.", variant: "destructive" });
    } finally {
      setLoadingStops(false);
    }
  };

  // Fetch stops when currentCenter changes and map is ready (or at least center is defined)
  useEffect(() => {
    if (currentCenter && (!hasFetchedInitialStops || isMapReady)) { // Fetch if center is set and either first time or map is ready
        fetchStops(currentCenter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCenter, isMapReady]); // Removed hasFetchedInitialStops dependency to allow refetch on map ready if geolocation was slow

  const handleMarkerClick = (stop: GTFSStop) => {
    setSelectedStop(stop);
    setIsSheetOpen(true);
    if (mapRef.current) {
      const currentZoomLevel = mapRef.current.getZoom();
      mapRef.current.flyTo([stop.stopLat, stop.stopLon], Math.max(currentZoomLevel, DEFAULT_ZOOM + 1));
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setTimeout(() => setSelectedStop(null), 300); // Delay clearing to allow animation
  };

  const handleRecenter = () => {
    if (userLocation) {
      setCurrentCenter(L.latLng(userLocation.lat, userLocation.lng)); // Use existing L.latLng object
      setCurrentZoom(Math.max(currentZoom, DEFAULT_ZOOM + 2));
    } else if (navigator.geolocation) {
      let isMountedLocate = true;
      setLoadingStops(true); // Indicate loading
      setError("Getting your location..."); // User feedback
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedLocate) return;
          const location = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(location);
          setCurrentCenter(location);
          setCurrentZoom(DEFAULT_ZOOM + 2);
          setError(null);
          // setLoadingStops(false); // fetchStops will handle this
        },
        (err) => {
          if (!isMountedLocate) return;
          setError('Unable to retrieve your location for recenter.');
          setLoadingStops(false); // Stop loading indicator on error
          toast({ title: "Location Error", description: "Could not get your current location for recenter.", variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        toast({ title: "Geolocation Error", description: "Geolocation is not available on this device.", variant: "destructive" });
    }
  };

  const handleCenterChange = (newCenter: LatLng) => {
     // Debounce or threshold check to prevent excessive re-fetches
    const distance = currentCenter ? calculateDistance({ lat: currentCenter.lat, lng: currentCenter.lng }, { lat: newCenter.lat, lng: newCenter.lng }) : Infinity;
    // Only update if moved significantly (e.g., > 200 meters)
    // Or if lat/lng diff is substantial, to catch small pans that are still meaningful
    const latDiff = currentCenter ? Math.abs(currentCenter.lat - newCenter.lat) : Infinity;
    const lngDiff = currentCenter ? Math.abs(currentCenter.lng - newCenter.lng) : Infinity;

    if (distance > 200 || latDiff > 0.001 || lngDiff > 0.001) {
      setCurrentCenter(newCenter); // This will trigger the useEffect for fetchStops
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setCurrentZoom(newZoom);
    // Optionally, fetch stops if zoom changes significantly, but map move usually covers this
    // if (Math.abs(newZoom - currentZoom) > 1) fetchStops(currentCenter);
  };

  const onMapReady = (mapInstance: LeafletMap) => {
    console.log("Leaflet map instance is ready.");
    mapRef.current = mapInstance;
    setIsMapReady(true);
    // Fetch initial stops for the current center (default or geolocated)
    // This ensures stops are loaded even if geolocation is slow or fails.
    if(!hasFetchedInitialStops) {
        fetchStops(currentCenter);
    }
  };

  // Effect for cleaning up the map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log("MapContainer: Component unmounting, attempting to remove map instance.");
        try {
          mapRef.current.remove(); // Leaflet's method to clean up the map
        } catch(e) {
          console.error("Error removing map instance during unmount:", e);
          // It's possible the map container was already removed from DOM, causing an error.
          // This is often a sign of race conditions or improper cleanup order elsewhere if it happens frequently.
        }
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount


  // Custom Icons (ensure these are defined after L is available)
  const userLocationIcon = L.divIcon({
    html: '<div class="h-4 w-4 rounded-full bg-accent ring-2 ring-white shadow-lg animate-pulse"></div>',
    className: '', iconSize: [16, 16], iconAnchor: [8, 8],
  });

  const stopIcon = L.divIcon({
    html: `<div class="rounded-full bg-primary p-1 shadow-md flex items-center justify-center hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
  });

  const stopMarkers = useMemo(() => {
    return stops.map((stop) => (
      <Marker
        key={stop.stopId}
        position={[stop.stopLat, stop.stopLon]}
        icon={stopIcon}
        eventHandlers={{ click: () => handleMarkerClick(stop) }}
        title={stop.stopName}
      >
        <Popup minWidth={150}>
          <div className="text-sm font-semibold">{stop.stopName}</div>
          <div className="text-xs text-muted-foreground mb-1">ID: {stop.stopId}</div>
          <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={(e) => { e.stopPropagation(); handleMarkerClick(stop); }}>
            View Arrivals
          </Button>
        </Popup>
      </Marker>
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, stopIcon]); // Added stopIcon to dependencies, though it should be stable

  // Conditional rendering for the map
  // `MapLoader` should already handle client-side only rendering of this component,
  // but this check is an additional safeguard.
  if (typeof window === 'undefined' || !L) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
      <LeafletMapContainer
          center={DEFAULT_CENTER_LATLNG} // Initial center
          zoom={DEFAULT_ZOOM}             // Initial zoom
          style={{ width: '100%', height: '100%' }}
          whenReady={onMapReady}         // Callback when map is initialized
          className="z-0"
          minZoom={12}
          maxZoom={18}
          // id="unique-map-id" // if you have multiple maps, ensure unique IDs or let react-leaflet handle it
      >
          {isMapReady && mapRef.current && <MapController center={currentCenter} zoom={currentZoom} />}
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {isMapReady && mapRef.current && <MapEvents onCenterChange={handleCenterChange} onZoomChange={handleZoomChange} />}

          {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon} title="Your Location" zIndexOffset={1000} />
          )}

          {stopMarkers}

          {loadingStops && (
              <div className="absolute bottom-16 left-1/2 z-[1001] -translate-x-1/2 transform rounded bg-background/80 px-3 py-1 text-xs shadow animate-pulse">
                  {error && error.startsWith("Getting") ? error : "Loading stops..."}
              </div>
          )}
          {/* Removed explicit error message display as toasts are used now */}
      </LeafletMapContainer>

      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-24 right-4 z-[1001] shadow-lg"
        onClick={handleRecenter}
        aria-label="Recenter map on your location"
        disabled={loadingStops && error?.startsWith("Getting")} // Disable while getting location for recenter
      >
        <LocateFixed size={20} />
      </Button>

      <StopDetailSheet
        stop={selectedStop}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
      />

      {/* Placeholder for Search/Route Planning and Saved Places */}
      <div className="absolute top-4 left-4 right-4 z-[1001] flex gap-2">
        <div className="flex-grow rounded-md bg-background p-3 text-muted-foreground shadow-lg text-sm cursor-not-allowed">
          Search / Route Planning (coming soon)
        </div>
        <Button variant="secondary" className="shadow-lg" disabled>Saved</Button>
      </div>
    </div>
  );
}
