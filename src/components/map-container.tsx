
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Map as LeafletMap, LatLng, LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { GTFSStop } from '@/services/gtt';
import { getNearbyStops, calculateDistance } from '@/services/gtt';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';
import { StopDetailSheet } from '@/components/stop-detail-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { getFavoriteStopIds, isStopFavorite as isFavoriteStore, addFavoriteStopId, removeFavoriteStopId } from '@/lib/favoritesStorage';


// Ensure Leaflet and its CSS are only processed on the client
if (typeof window !== 'undefined') {
  // Dynamically import Leaflet CSS
  import('leaflet/dist/leaflet.css');

  // Configure Leaflet default icons
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
// const MAP_COMPONENT_KEY_PREFIX = 'leaflet-map-'; // No longer using dynamic key for LeafletMapContainer


// Helper component to handle map events
function MapEvents({ onCenterChange, onZoomChange, onMapLoad }: { onCenterChange: (center: LatLng) => void, onZoomChange: (zoom: number) => void, onMapLoad: () => void }) {
  const map = useMapEvents({
    load: () => { // Added load event
      onMapLoad();
    },
    dragend: () => onCenterChange(map.getCenter()),
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onCenterChange(center);
      onZoomChange(zoom);
    },
  });
  return null;
}

// Helper component to control map view programmatically
function MapController({ center, zoom }: { center: LatLngExpression | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) { // ensure map is available
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
  const [isMapReady, setIsMapReady] = useState(false); // Tracks if Leaflet map instance is ready AND events like 'load' have fired
  const [favoriteStopIds, setFavoriteStopIds] = useState<string[]>([]);

  const mapRef = useRef<LeafletMap | null>(null);
  const { toast } = useToast();

  const fetchFavoriteStops = useCallback(async () => {
    const favIds = await getFavoriteStopIds();
    setFavoriteStopIds(favIds);
  }, []);

  useEffect(() => {
    fetchFavoriteStops();
  }, [fetchFavoriteStops]);

  const handleFavoritesChange = (updatedFavIds: string[]) => {
    setFavoriteStopIds(updatedFavIds);
  };

  const fetchStops = useCallback(async (center: LatLng) => {
    setLoadingStops(true);
    setError(null);
    try {
      const nearbyStops = await getNearbyStops({ lat: center.lat, lng: center.lng }, NEARBY_RADIUS_METERS);
      setStops(nearbyStops);
    } catch (fetchError) {
      console.error('Error fetching stops:', fetchError);
      setError('Failed to load public transport stops.');
      toast({ title: "Network Error", description: "Failed to load nearby stops. Please try again later.", variant: "destructive" });
      setStops([]);
    } finally {
      setLoadingStops(false);
    }
  },[toast]);


  // Effect for initial location and stops fetch
 useEffect(() => {
    let isMounted = true;

    const attemptGeolocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!isMounted) return;
            const location = L.latLng(position.coords.latitude, position.coords.longitude);
            setUserLocation(location);
            setCurrentCenter(location); // This will trigger MapController
            setCurrentZoom(DEFAULT_ZOOM + 2);
            if (isMapReady) fetchStops(location); // Fetch stops if map is already ready
          },
          (err) => {
            if (!isMounted) return;
            console.warn(`Geolocation Error (${err.code}): ${err.message}`);
            toast({ title: "Location Error", description: "Could not get your location. Displaying default area.", variant: "destructive" });
            if (isMapReady) fetchStops(currentCenter); // Fetch for default center
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
          if (!isMounted) return;
          toast({ title: "Geolocation Error", description: "Geolocation not supported. Displaying default area.", variant: "destructive" });
          if (isMapReady) fetchStops(currentCenter); // Fetch for default center
      }
    };

    if (isMapReady) { // Only attempt geolocation & initial fetchStops if map is ready
        attemptGeolocation();
    } else {
        // If map not ready, initial fetch for default location will be handled by onMapInstanceReady or MapEvents load
        // Or, if geolocation is the primary source, wait for map ready then geolocate
    }

    return () => { isMounted = false; };
  }, [isMapReady, toast, currentCenter, fetchStops]); // Add fetchStops and currentCenter
  // Removed currentCenter, fetchStops from deps to avoid re-running when they change due to other effects if map not ready.
  // Re-added them as they are used conditionally.

  useEffect(() => {
    // This effect specifically fetches stops when currentCenter changes AND map is ready.
    // This helps ensure that if initial geolocation sets currentCenter BEFORE map is ready,
    // stops are fetched once map becomes ready.
    // Also handles fetching stops if user location wasn't available and we fall back to default center.
    if (isMapReady && currentCenter) {
        // If userLocation is set, fetch for userLocation (which should be == currentCenter)
        // otherwise, fetch for the currentCenter (which might be default)
        fetchStops(userLocation || currentCenter);
    }
  }, [isMapReady, currentCenter, userLocation, fetchStops]);


  const handleMarkerClick = useCallback((stop: GTFSStop) => {
    setSelectedStop(stop);
    setIsSheetOpen(true);
    if (mapRef.current) {
      const currentZoomLevel = mapRef.current.getZoom();
      mapRef.current.flyTo([stop.stopLat, stop.stopLon], Math.max(currentZoomLevel, DEFAULT_ZOOM + 1));
    }
  }, []);

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    // Delay clearing selectedStop to allow sheet animation to complete
    setTimeout(() => setSelectedStop(null), 300);
  };

  const handleRecenter = () => {
    if (navigator.geolocation) {
      setLoadingStops(true); // Show loading indicator while trying to get location
      toast({title: "Locating...", description: "Getting your current position."});
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(location);
          setCurrentCenter(location); // This will trigger MapController
          setCurrentZoom(Math.max(currentZoom, DEFAULT_ZOOM + 2)); // Use currentZoom or a more zoomed-in level
          // fetchStops will be triggered by the useEffect watching currentCenter and isMapReady
          // setLoadingStops(false); // Will be handled by fetchStops
          toast.dismiss(); // Dismiss "Locating..." toast
        },
        (err) => {
          console.warn('Recenter: Geolocation Error:', err);
          setLoadingStops(false);
          toast({ title: "Location Error", description: "Could not get your current location for recenter.", variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        toast({ title: "Geolocation Error", description: "Geolocation is not available on this device.", variant: "destructive" });
    }
  };

  const handleCenterChange = useCallback((newCenter: LatLng) => {
    const distance = calculateDistance({ lat: currentCenter.lat, lng: currentCenter.lng }, { lat: newCenter.lat, lng: newCenter.lng });
    // Update currentCenter immediately for responsive map control if MapController uses it directly
    // setCurrentCenter(newCenter); // This might cause rapid calls if not careful
    
    if (distance > 500) { // Fetch if map moved significantly (e.g., > 500 meters)
      setCurrentCenter(newCenter); // Set currentCenter which then triggers fetchStops via useEffect
    } else {
      // If not fetching, still update currentCenter to keep internal state aligned if MapController needs it.
      // Or, if MapController is driven by userLocation for recenter, this might only reflect drag state.
      // For now, only update currentCenter if we intend to fetch.
      // This prevents fetchStops from being called too often by minor drags.
      // If map feels laggy, this might need adjustment.
      // Let's update currentCenter anyway, the fetchStops useEffect will decide based on distance.
       setCurrentCenter(newCenter);
    }
  }, [currentCenter]); // Removed fetchStops, relying on useEffect

  const handleZoomChange = (newZoom: number) => {
    setCurrentZoom(newZoom);
  };

  // Callback for when LeafletMapContainer is ready and its 'load' event fires
  const onMapLoadEvent = () => {
    console.log("Leaflet map 'load' event fired.");
    setIsMapReady(true);
    // Initial fetch for default location if geolocation hasn't provided one yet
    // and if stops haven't been fetched.
    if (stops.length === 0 && !userLocation) {
         // fetchStops(currentCenter); // This is now handled by the useEffect watching isMapReady and currentCenter
    }
  };

  // Effect for assigning map instance to ref, separate from load event.
  // whenReady prop of LeafletMapContainer can be used for this.
  const onMapInstanceCreated = (mapInstance: LeafletMap) => {
     if (mapInstance && !mapRef.current) {
        console.log("Leaflet map instance created, assigning to mapRef.");
        mapRef.current = mapInstance;
        //setIsMapReady(true); // setIsMapReady will now be set on 'load' event via MapEvents
    } else if (mapInstance && mapRef.current && mapRef.current !== mapInstance) {
        console.warn("MapContainer: whenReady called with a new map instance while mapRef already set.");
        mapRef.current = mapInstance; // Update ref
    } else if (!mapInstance) {
        console.warn("MapContainer: whenReady called with null mapInstance.");
    }
  };

  useEffect(() => {
    return () => {
      if (mapRef.current && typeof (mapRef.current as any)._leaflet_id === 'number') {
        console.log("MapContainer: Component unmounting. react-leaflet's MapContainer should handle cleanup.");
        mapRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);


  const userLocationIcon = useMemo(() => L.divIcon({
    html: '<div class="h-4 w-4 rounded-full bg-accent ring-2 ring-white shadow-lg animate-pulse"></div>',
    className: '', iconSize: [16, 16], iconAnchor: [8, 8],
  }), []);

  const stopIcon = useMemo(() => L.divIcon({
    html: `<div class="rounded-full bg-primary p-1 shadow-md flex items-center justify-center hover:scale-110 transition-transform" data-ai-hint="bus icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
  }), []);

  const favoriteStopIcon = useMemo(() => L.divIcon({
    html: `<div class="rounded-full bg-yellow-500 p-1 shadow-md flex items-center justify-center hover:scale-110 transition-transform" data-ai-hint="star icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
  }), []);


  const stopMarkers = useMemo(() => {
    return stops.map((stop) => {
      const isFav = favoriteStopIds.includes(stop.stopId);
      return (
        <Marker
          key={stop.stopId}
          position={[stop.stopLat, stop.stopLon]}
          icon={isFav ? favoriteStopIcon : stopIcon}
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
      );
    });
  }, [stops, stopIcon, favoriteStopIcon, favoriteStopIds, handleMarkerClick]);

  // Conditional rendering: Only render LeafletMapContainer if L is available (client-side)
  if (typeof window === 'undefined' || !L) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
       <LeafletMapContainer
          // No dynamic key needed here, rely on react-leaflet
          center={currentCenter} // Controlled by currentCenter state
          zoom={currentZoom}    // Controlled by currentZoom state
          style={{ width: '100%', height: '100%' }}
          whenCreated={onMapInstanceCreated} // Use whenCreated to get map instance
          className="z-0"
          minZoom={10} // Adjusted minZoom
          maxZoom={19} // Adjusted maxZoom
      >
          {/* MapController is now driven by currentCenter and currentZoom state updates */}
          {/* <MapController center={currentCenter} zoom={currentZoom} /> */}
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents
            onCenterChange={handleCenterChange}
            onZoomChange={handleZoomChange}
            onMapLoad={onMapLoadEvent}
          />

          {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon} title="Your Location" zIndexOffset={1000} />
          )}

          {stopMarkers}

          {loadingStops && (
              <div className="absolute bottom-16 left-1/2 z-[1001] -translate-x-1/2 transform rounded bg-background/80 px-3 py-1 text-xs shadow animate-pulse">
                  {error ? error : "Loading stops..."}
              </div>
          )}
      </LeafletMapContainer>

      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-24 right-4 z-[1001] shadow-lg"
        onClick={handleRecenter}
        aria-label="Recenter map on your location"
        disabled={loadingStops && error?.startsWith("Getting")}
      >
        <LocateFixed size={20} />
      </Button>

      <StopDetailSheet
        stop={selectedStop}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        onFavoritesChange={handleFavoritesChange}
      />

      <div className="absolute top-4 left-4 right-4 z-[1001] flex gap-2">
        <div className="flex-grow rounded-md bg-background p-3 text-muted-foreground shadow-lg text-sm cursor-not-allowed">
          Search / Route Planning (coming soon)
        </div>
        <Button variant="secondary" className="shadow-lg" disabled>Saved Places</Button>
      </div>
    </div>
  );
}
