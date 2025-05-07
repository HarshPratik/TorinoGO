<<<<<<< HEAD

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Map as LeafletMap, LatLng, LatLngExpression } from 'leaflet';
import L from 'leaflet';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import type { GTFSStop } from '@/services/gtt';
=======
'use client'; // Required for Leaflet hooks and event handlers

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet'; // Import Leaflet's Map type
import L from 'leaflet'; // Import Leaflet library
import type { GTFSStop } from '@/services/gtt'; // Location is also in gtt
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
import { getNearbyStops, calculateDistance } from '@/services/gtt';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';
import { StopDetailSheet } from '@/components/stop-detail-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { getFavoriteStopIds, isStopFavorite as isFavoriteStore, addFavoriteStopId, removeFavoriteStopId } from '@/lib/favoritesStorage';

<<<<<<< HEAD

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
=======
const DEFAULT_CENTER: L.LatLngExpression = [45.0703, 7.6869]; // Turin, Italy
const DEFAULT_ZOOM = 14;
const NEARBY_RADIUS_METERS = 1000; // 1km for nearby stops

// Component to handle map events like drag and zoom
function MapEvents({ onCenterChange, onZoomChange }: { onCenterChange: (center: L.LatLng) => void, onZoomChange: (zoom: number) => void }) {
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
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
<<<<<<< HEAD
=======
    // load event is handled by whenCreated/onMapCreated in parent
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
  });
  return null;
}

<<<<<<< HEAD
// Helper component to control map view programmatically
function MapController({ center, zoom }: { center: LatLngExpression | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && map) { // ensure map is available
=======
// Component to control map's center and zoom programmatically
function MapController({ center, zoom }: { center: L.LatLngExpression, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    // Check if center is valid LatLng or array, and zoom is a number
    if (center && typeof zoom === 'number') {
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
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
<<<<<<< HEAD
  const [isMapReady, setIsMapReady] = useState(false); // Tracks if Leaflet map instance is ready AND events like 'load' have fired
  const [favoriteStopIds, setFavoriteStopIds] = useState<string[]>([]);
=======
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasFetchedInitialStops, setHasFetchedInitialStops] = useState(false);
  const mapComponentKey = useMemo(() => `map-${Date.now()}`, []); // Stable key for map instance
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)

  const mapRef = useRef<LeafletMap | null>(null);
  const { toast } = useToast();

<<<<<<< HEAD
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
=======
  // Effect to get user's initial location
  useEffect(() => {
    let isMounted = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const location = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(location);
           // Only set center if it's the first load and we haven't centered on user yet
          if (!hasFetchedInitialStops && mapRef.current) { // mapRef.current check ensures map is somewhat ready
            setCurrentCenter(location);
            setCurrentZoom(DEFAULT_ZOOM + 2); // Zoom in more on user location
          }
          setError(null);
        },
        (err) => {
          if (!isMounted) return;
          console.warn(`Geolocation ERROR(${err.code}): ${err.message}`);
          setError('Unable to retrieve location. Showing default view of Turin.');
          // If location fails, and map is ready, fetch stops for default center
          if (isMapReady && mapRef.current && !hasFetchedInitialStops) {
            fetchStops(currentCenter);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (!isMounted) return;
      setError('Geolocation is not supported by this browser. Showing default view of Turin.');
      if (isMapReady && mapRef.current && !hasFetchedInitialStops) {
         fetchStops(currentCenter);
      }
    }
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady]); // Re-run if isMapReady changes, to fetch default stops if geolocation failed early

  // Function to fetch stops based on map center
  const fetchStops = async (center: L.LatLng) => {
    if (!isMapReady || !mapRef.current) { 
      console.log("fetchStops: Map not ready or ref not set. Skipping.");
      return;
    }
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
    setLoadingStops(true);
    // setError(null); // Clear previous errors when starting a new fetch
    try {
      console.log(`Fetching stops for center: ${center.lat}, ${center.lng}`);
      const nearbyStops = await getNearbyStops({ lat: center.lat, lng: center.lng }, NEARBY_RADIUS_METERS);
      setStops(nearbyStops);
<<<<<<< HEAD
    } catch (fetchError) {
      console.error('Error fetching stops:', fetchError);
      setError('Failed to load public transport stops.');
      toast({ title: "Network Error", description: "Failed to load nearby stops. Please try again later.", variant: "destructive" });
      setStops([]);
=======
      if (!hasFetchedInitialStops) {
        setHasFetchedInitialStops(true);
      }
      setError(null); // Clear error on successful fetch
    } catch (fetchError) {
      console.error('Error fetching stops:', fetchError);
      setError('Failed to load public transport stops.');
      setStops([]); // Clear stops on error
      toast({ title: "Error", description: "Failed to load nearby stops.", variant: "destructive" });
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
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

  // Effect to fetch stops when currentCenter or map readiness changes
  useEffect(() => {
<<<<<<< HEAD
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
=======
    if (isMapReady && mapRef.current && currentCenter) {
      const timer = setTimeout(() => {
         fetchStops(currentCenter);
      }, 300); 
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCenter, isMapReady]);


  const handleMarkerClick = (stop: GTFSStop) => {
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
    setSelectedStop(stop);
    setIsSheetOpen(true);
    if (mapRef.current) {
      const currentZoomLevel = mapRef.current.getZoom();
      mapRef.current.flyTo([stop.stopLat, stop.stopLon], Math.max(currentZoomLevel, DEFAULT_ZOOM + 1), {duration: 0.3});
    }
  }, []);

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    // Delay clearing selectedStop to allow sheet animation to complete
    setTimeout(() => setSelectedStop(null), 300);
  };

  const handleRecenter = () => {
<<<<<<< HEAD
    if (navigator.geolocation) {
      setLoadingStops(true); // Show loading indicator while trying to get location
      toast({title: "Locating...", description: "Getting your current position."});
=======
    if (userLocation) {
      setCurrentCenter(L.latLng(userLocation.lat, userLocation.lng)); 
      setCurrentZoom(Math.max(mapRef.current?.getZoom() ?? DEFAULT_ZOOM, DEFAULT_ZOOM + 2));
    } else if (navigator.geolocation) {
      let isMountedLocate = true;
      setLoadingStops(true); 
      setError("Getting your current location..."); 
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = L.latLng(position.coords.latitude, position.coords.longitude);
          setUserLocation(location);
<<<<<<< HEAD
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
=======
          setCurrentCenter(location);
          setCurrentZoom(DEFAULT_ZOOM + 2);
          setError(null); 
        },
        (err) => {
          if (!isMountedLocate) return;
          console.warn(`Recenter Geolocation ERROR(${err.code}): ${err.message}`);
          setError('Unable to retrieve your location to recenter.');
          toast({ title: "Location Error", description: "Could not get your current location.", variant: "destructive" });
        }
      ).finally(() => { // finally was not standard, ensure it's available or handle error in catch
        if(isMountedLocate) setLoadingStops(false); 
      });
    }
  };

  const handleCenterChange = (newCenter: L.LatLng) => {
    if (!mapRef.current) return;
    const oldCenter = currentCenter; 
    const distanceMoved = calculateDistance(
        { lat: oldCenter.lat, lng: oldCenter.lng },
        { lat: newCenter.lat, lng: newCenter.lng }
    );
    if (distanceMoved > 100 || Math.abs(oldCenter.lat - newCenter.lat) > 0.0005 || Math.abs(oldCenter.lng - newCenter.lng) > 0.0005) {
        setCurrentCenter(L.latLng(newCenter.lat, newCenter.lng)); 
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
    }
  }, [currentCenter]); // Removed fetchStops, relying on useEffect

  const handleZoomChange = (newZoom: number) => {
    setCurrentZoom(newZoom);
  };

<<<<<<< HEAD
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
=======
  const handleZoomChange = (newZoom: number) => {
    if (newZoom !== currentZoom) {
      setCurrentZoom(newZoom);
    }
  };

  const onMapCreated = (mapInstance: LeafletMap) => {
    console.log("Leaflet map instance created and ready.", mapInstance);
    mapRef.current = mapInstance;
    setIsMapReady(true); 

    if (userLocation && !hasFetchedInitialStops) {
      // User location known, map just became ready, and no initial stops fetched yet
      setCurrentCenter(L.latLng(userLocation.lat, userLocation.lng));
      setCurrentZoom(DEFAULT_ZOOM + 2);
      // fetchStops will be triggered by useEffect watching currentCenter & isMapReady
    } else if (!userLocation && !hasFetchedInitialStops) {
      // No user location (yet or denied), map ready, no initial stops fetched
      // Fetch for the default center (Turin)
      fetchStops(currentCenter);
    }
    // If userLocation arrives *after* this, the useEffect for userLocation will update currentCenter if needed.
  };
  
  useEffect(() => {
    // This effect runs once on mount and its cleanup on unmount.
    // react-leaflet's MapContainer should handle its own .remove() when it unmounts.
    return () => {
      if (mapRef.current) {
        console.log("MapContainer: Component unmounting. React-leaflet expected to handle map.remove().");
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
      }
      mapRef.current = null; // Clear our ref
      setIsMapReady(false); // Reset map ready state
      // setHasFetchedInitialStops(false); // Consider if this should be reset for a full re-init on next mount
    };
  }, []);


  const userLocationIcon = useMemo(() => L.divIcon({
<<<<<<< HEAD
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
=======
    html: '<div class="h-4 w-4 rounded-full bg-accent ring-2 ring-background shadow-lg animate-pulse"></div>',
    className: '', 
    iconSize: [16, 16],
    iconAnchor: [8, 8], 
  }), []);

  const stopIcon = useMemo(() => L.divIcon({
    html: `<div class="rounded-full bg-primary p-1 shadow-md flex items-center justify-center hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
    className: '',
    iconSize: [28, 28], 
    iconAnchor: [14, 14], 
    popupAnchor: [0, -14], 
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, stopIcon]); 
  
  const canRenderMap = typeof window !== 'undefined' && L;

  return (
    <div className="relative h-full w-full">
      {canRenderMap ? (
        <LeafletMapContainer
          key={mapComponentKey} 
          center={currentCenter} // Controlled by state, initialized to DEFAULT_CENTER
          zoom={currentZoom}     // Controlled by state, initialized to DEFAULT_ZOOM
          style={{ width: '100%', height: '100%' }}
          whenCreated={onMapCreated} 
          className="z-0"
          minZoom={12} 
          maxZoom={18} 
        >
          {isMapReady && mapRef.current && currentCenter && typeof currentZoom === 'number' && (
            <MapController center={currentCenter} zoom={currentZoom} />
          )}
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
          <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
<<<<<<< HEAD
          <MapEvents
            onCenterChange={handleCenterChange}
            onZoomChange={handleZoomChange}
            onMapLoad={onMapLoadEvent}
          />

=======
          {isMapReady && mapRef.current && (
            <MapEvents onCenterChange={handleCenterChange} onZoomChange={handleZoomChange} />
          )}
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
          {userLocation && (
              <Marker position={userLocation} icon={userLocationIcon} title="Your Location" zIndexOffset={1000} />
          )}

          {stopMarkers}

<<<<<<< HEAD
          {loadingStops && (
              <div className="absolute bottom-16 left-1/2 z-[1001] -translate-x-1/2 transform rounded bg-background/80 px-3 py-1 text-xs shadow animate-pulse">
                  {error ? error : "Loading stops..."}
              </div>
          )}
      </LeafletMapContainer>
=======
          {(loadingStops || error) && (
             <div className="absolute bottom-16 left-1/2 z-[1001] -translate-x-1/2 transform rounded bg-background/80 px-3 py-1 text-xs shadow">
                {loadingStops && !error && "Loading stops..."}
                {error && <span className="text-destructive">{error}</span>}
             </div>
           )}
        </LeafletMapContainer>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)

      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-24 right-4 z-[1001] shadow-lg rounded-full"
        onClick={handleRecenter}
        aria-label="Recenter map on your location"
        disabled={loadingStops && error?.includes("Getting")} 
      >
        <LocateFixed size={20} />
      </Button>

      <StopDetailSheet
        stop={selectedStop}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        onFavoritesChange={handleFavoritesChange}
      />

      <div className="absolute top-4 left-0 right-0 z-[1001] px-4 flex gap-2 pointer-events-none">
        <div className="flex-grow rounded-md bg-background p-3 text-muted-foreground shadow-lg text-sm cursor-not-allowed pointer-events-auto">
          Search / Route Planning (coming soon)
        </div>
<<<<<<< HEAD
        <Button variant="secondary" className="shadow-lg" disabled>Saved Places</Button>
=======
        <Button variant="secondary" className="shadow-lg pointer-events-auto" disabled>Saved</Button>
>>>>>>> aa42313 (I see this error with the app, reported by NextJS, please fix it. The error is reported as HTML but presented visually to the user).)
      </div>
    </div>
  );
}