
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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

// Ensure Leaflet and its CSS are only processed on the client
if (typeof window !== 'undefined') {
  // Dynamically import Leaflet CSS
  import('leaflet/dist/leaflet.css');

  // Configure Leaflet default icons
  // delete (L.Icon.Default.prototype as any)._getIconUrl;
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
const MAP_COMPONENT_KEY_PREFIX = 'leaflet-map-';


// Helper component to handle map events
function MapEvents({ onCenterChange, onZoomChange }: { onCenterChange: (center: LatLng) => void, onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
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
  const [error, setError] = useState<string | null>(null); // Keep local error for direct UI feedback if needed
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false); // Tracks if Leaflet map instance is ready
  const [mapComponentKey, setMapComponentKey] = useState(MAP_COMPONENT_KEY_PREFIX + Date.now());


  const mapRef = useRef<LeafletMap | null>(null);
  const { toast } = useToast();

  const fetchStops = async (center: LatLng) => {
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
  };


  // Effect for initial location and stops fetch
 useEffect(() => {
    let isMounted = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const location = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(location);
          setCurrentCenter(location);
          setCurrentZoom(DEFAULT_ZOOM + 2);
          fetchStops(location); // Fetch stops for user's location
        },
        (err) => {
          if (!isMounted) return;
          console.warn(`Geolocation Error (${err.code}): ${err.message}`);
          toast({ title: "Location Error", description: "Could not get your location. Displaying default area.", variant: "destructive" });
          fetchStops(currentCenter); // Fetch for default center if geolocation fails
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        if (!isMounted) return;
        toast({ title: "Geolocation Error", description: "Geolocation not supported. Displaying default area.", variant: "destructive" });
        fetchStops(currentCenter); // Fetch for default center
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount. `currentCenter` is stable initially, `fetchStops` and `toast` are memoized or stable.

  const handleMarkerClick = (stop: GTFSStop) => {
    setSelectedStop(stop);
    setIsSheetOpen(true);
    if (mapRef.current) { // mapRef.current should be the LeafletMap instance
      const currentZoomLevel = mapRef.current.getZoom();
      mapRef.current.flyTo([stop.stopLat, stop.stopLon], Math.max(currentZoomLevel, DEFAULT_ZOOM + 1));
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setTimeout(() => setSelectedStop(null), 300);
  };

  const handleRecenter = () => {
    if (userLocation) {
      setCurrentCenter(userLocation); // No need to create new L.latLng if userLocation is already one
      setCurrentZoom(Math.max(currentZoom, DEFAULT_ZOOM + 2));
      // fetchStops(userLocation) will be triggered by MapEvents if center changes enough
    } else if (navigator.geolocation) {
      let isMountedLocate = true;
      setLoadingStops(true);
      setError("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedLocate) return;
          const location = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(location);
          setCurrentCenter(location);
          setCurrentZoom(DEFAULT_ZOOM + 2);
          setError(null);
          // fetchStops(location); // This will be triggered by MapEvents if center changes enough
        },
        (err) => {
          if (!isMountedLocate) return;
          setError('Unable to retrieve your location for recenter.');
          setLoadingStops(false);
          toast({ title: "Location Error", description: "Could not get your current location for recenter.", variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        toast({ title: "Geolocation Error", description: "Geolocation is not available on this device.", variant: "destructive" });
    }
  };

  const handleCenterChange = (newCenter: LatLng) => {
    const distance = calculateDistance({ lat: currentCenter.lat, lng: currentCenter.lng }, { lat: newCenter.lat, lng: newCenter.lng });
    if (distance > 200) { // Only fetch if moved significantly
      setCurrentCenter(newCenter);
      fetchStops(newCenter);
    } else {
      // If not fetching, still update currentCenter to keep state consistent with map view
      setCurrentCenter(newCenter);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setCurrentZoom(newZoom);
  };

  // Callback for when LeafletMapContainer is ready
  const onMapInstanceReady = (mapInstance: LeafletMap) => {
    if (mapInstance && !mapRef.current) { // Check if mapRef already set to avoid issues
        console.log("Leaflet map instance is ready, assigning to mapRef.");
        mapRef.current = mapInstance;
        setIsMapReady(true);
        // If initial stops for default location haven't been fetched due to slow/failed geolocation
        if (stops.length === 0 && currentCenter.equals(L.latLng(DEFAULT_CENTER_LATLNG[0], DEFAULT_CENTER_LATLNG[1]))) {
            fetchStops(currentCenter);
        }
    }
  };


  // Effect for cleaning up the map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapRef.current && typeof (mapRef.current as any)._leaflet_id === 'number') { // Check if it's a valid Leaflet instance
        console.log("MapContainer: Component unmounting, attempting to remove map instance.");
        try {
          // mapRef.current.remove(); // This is the correct way to remove a Leaflet map.
          // However, react-leaflet's MapContainer should handle its own cleanup.
          // Forcing removal here can lead to "Map container not found" if react-leaflet tries to remove it again.
          // If issues persist, ensure MapContainer is unmounted cleanly by its parent.
        } catch(e) {
          console.error("Error during mapRef.current.remove():", e);
        }
        mapRef.current = null; // Nullify the ref
        setIsMapReady(false); // Reset map ready state
      }
    };
  }, []);


  const userLocationIcon = useMemo(() => L.divIcon({
    html: '<div class="h-4 w-4 rounded-full bg-accent ring-2 ring-white shadow-lg animate-pulse"></div>',
    className: '', iconSize: [16, 16], iconAnchor: [8, 8],
  }), []);

  const stopIcon = useMemo(() => L.divIcon({
    html: `<div class="rounded-full bg-primary p-1 shadow-md flex items-center justify-center hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14],
  }), []);

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
  }, [stops, stopIcon, handleMarkerClick]); // Added handleMarkerClick to deps

  // Conditional rendering: Only render LeafletMapContainer if L is available (client-side)
  if (typeof window === 'undefined' || !L) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="relative h-full w-full">
       <LeafletMapContainer
          key={mapComponentKey} // Use key to ensure Leaflet reinitializes correctly if needed.
          center={DEFAULT_CENTER_LATLNG} // Initial center
          zoom={DEFAULT_ZOOM}             // Initial zoom
          style={{ width: '100%', height: '100%' }}
          whenReady={onMapInstanceReady}   // Use whenReady to get the map instance
          className="z-0"
          minZoom={12}
          maxZoom={18}
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
      />

      <div className="absolute top-4 left-4 right-4 z-[1001] flex gap-2">
        <div className="flex-grow rounded-md bg-background p-3 text-muted-foreground shadow-lg text-sm cursor-not-allowed">
          Search / Route Planning (coming soon)
        </div>
        <Button variant="secondary" className="shadow-lg" disabled>Saved</Button>
      </div>
    </div>
  );
}
