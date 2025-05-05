
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

// Apply the default icon globally for Marker components
// Check if running in a browser environment before modifying prototype
if (typeof window !== 'undefined') {
    L.Marker.prototype.options.icon = DefaultIcon;
}


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
     // Initial load event
    load: () => {
        onCenterChange(map.getCenter());
        onZoomChange(map.getZoom());
    },
  });
  return null;
}

// Inner component to allow controlling map view
function MapController({ center, zoom }: { center: L.LatLngExpression, zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            // Use flyTo for smooth transitions, setView for immediate change
            map.flyTo(center, zoom, {
                duration: 0.5 // Adjust duration as needed
            });
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
  const [loadingStops, setLoadingStops] = useState(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false); // Track Leaflet map instance readiness
  const [hasFetchedInitialStops, setHasFetchedInitialStops] = useState(false); // Track initial fetch

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
           if (!hasFetchedInitialStops) { // Only center on user if it's the first load
               setCurrentCenter(location); // Center map on user location
               setCurrentZoom(DEFAULT_ZOOM + 2); // Zoom in when location found
           }
          setError(null);
        },
        (err) => {
          console.warn(`ERROR(${err.code}): ${err.message}`);
          setError('Unable to retrieve location. Showing default view.');
          // Keep default center if location fails, trigger initial fetch
           if (!hasFetchedInitialStops) {
               fetchStops(currentCenter); // Fetch for default center
           }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Increased timeout
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      // Keep default center if geolocation not supported, trigger initial fetch
       if (!hasFetchedInitialStops) {
           fetchStops(currentCenter); // Fetch for default center
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  // Function to fetch stops, can be called manually or by effects
   const fetchStops = async (center: L.LatLng) => {
       if (!isMapReady) return; // Don't fetch if map isn't ready
       console.log(`Fetching stops for center: ${center.lat}, ${center.lng}`);
       setLoadingStops(true);
       setError(null);
       try {
         const nearbyStops = await getNearbyStops(
           { lat: center.lat, lng: center.lng }, // Convert L.LatLng back for service
           NEARBY_RADIUS_METERS
         );
         setStops(nearbyStops);
         if (!hasFetchedInitialStops) {
             setHasFetchedInitialStops(true); // Mark initial fetch done
         }
       } catch (fetchError) {
         console.error('Error fetching stops:', fetchError);
         setError('Failed to load public transport stops.');
         setStops([]); // Clear stops on error
       } finally {
         setLoadingStops(false);
       }
   };

   // Fetch stops when center changes significantly OR when map becomes ready
   useEffect(() => {
       if (isMapReady) {
            console.log("Map ready or center changed, fetching stops...");
            fetchStops(currentCenter);
       }
       // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [currentCenter, isMapReady]); // Depend on center and map readiness


  const handleMarkerClick = (stop: GTFSStop) => {
    setSelectedStop(stop);
    setIsSheetOpen(true);
    // Center map on the selected stop marker smoothly
    if(mapRef.current) {
        const currentZoomLevel = mapRef.current.getZoom();
        mapRef.current.flyTo([stop.stopLat, stop.stopLon], Math.max(currentZoomLevel, DEFAULT_ZOOM + 1)); // Zoom in slightly if needed
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
       setCurrentCenter(userLocation); // This will trigger the useEffect to fly to the location
       setCurrentZoom(zoom);
    } else if (navigator.geolocation) {
      // If user location is null but geolocation is available, try fetching it again
        setLoadingStops(true); // Show loading indicator while getting location
        setError("Getting your location...");
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
          setLoadingStops(false);
        },
        (err) => {
          console.warn(`ERROR(${err.code}): ${err.message}`);
          setError('Unable to retrieve your location.');
          setLoadingStops(false);
        },
         { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

   const handleCenterChange = (newCenter: L.LatLng) => {
       if (!currentCenter) return; // Should not happen after init

       const distance = calculateDistance(
         { lat: currentCenter.lat, lng: currentCenter.lng },
         { lat: newCenter.lat, lng: newCenter.lng }
       );
        console.log(`Map moved by ${distance.toFixed(0)}m`);
       // Update if map moved more than ~200m to avoid excessive refetches
       if (distance > 200) {
            console.log("Significant move detected, updating center state.");
           setCurrentCenter(newCenter);
       }
   };

   const handleZoomChange = (newZoom: number) => {
       setCurrentZoom(newZoom);
        // Optionally fetch stops on zoom change if desired, but can be noisy
       // fetchStops(currentCenter);
   };

   // Set map ready state and store instance
   const onMapReady = (mapInstance: LeafletMap) => {
       console.log("Leaflet map instance is ready.");
       mapRef.current = mapInstance;
       setIsMapReady(true);
       // Setting initial view might be redundant due to MapController, but safe fallback
       // mapInstance.setView(currentCenter, currentZoom);
   };


  // Define user location icon (Blue circle)
  const userLocationIcon = L.divIcon({
    html: '<div class="h-4 w-4 rounded-full bg-accent ring-2 ring-white shadow-lg animate-pulse"></div>', // Added pulse animation
    className: '', // Remove default Leaflet icon styles
    iconSize: [16, 16],
    iconAnchor: [8, 8], // Center the icon
  });

   // Define stop marker icon (Primary color bus)
    const stopIcon = L.divIcon({
       html: `<div class="rounded-full bg-primary p-1 shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
              </div>`,
       className: '', // Remove default Leaflet icon styles
       iconSize: [28, 28], // Slightly larger icon
       iconAnchor: [14, 14], // Center the larger icon
       popupAnchor: [0, -14], // Adjust popup position
     });


  // Memoize markers to avoid unnecessary re-renders ONLY when stops change
  const stopMarkers = useMemo(() => {
      console.log("Re-rendering stop markers:", stops.length);
      return stops.map((stop) => (
          <Marker
              key={stop.stopId}
              position={[stop.stopLat, stop.stopLon]}
              icon={stopIcon}
              eventHandlers={{
                  click: () => handleMarkerClick(stop),
              }}
              title={stop.stopName} // Tooltip on hover
          >
              <Popup minWidth={150}>
                  <div className="text-sm font-semibold">{stop.stopName}</div>
                  <div className="text-xs text-muted-foreground mb-1">ID: {stop.stopId}</div>
                  <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs"
                      onClick={(e) => {
                          e.stopPropagation(); // Prevent closing popup immediately
                          handleMarkerClick(stop);
                      }}
                  >
                      View Arrivals
                  </Button>
              </Popup>
          </Marker>
      ));
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]); // Re-run ONLY when `stops` array changes


  return (
    <div className="relative h-full w-full">
      {/* Ensure LeafletMapContainer only renders when L is available */}
      {typeof L !== 'undefined' ? (
          <LeafletMapContainer
              // Use key to force re-render if center changes drastically? No, use MapController.
              center={DEFAULT_CENTER} // Initial center, MapController handles updates
              zoom={DEFAULT_ZOOM} // Initial zoom, MapController handles updates
              style={{ width: '100%', height: '100%' }}
              whenReady={onMapReady} // Use whenReady which seems more reliable than whenCreated
              className="z-0" // Ensure map is behind overlays
              minZoom={12} // Set a minimum zoom level
              maxZoom={18} // Set a maximum zoom level
          >
              {/* Map Controller for setting view */}
              {isMapReady && <MapController center={currentCenter} zoom={currentZoom} />}

              <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Listen to map events */}
              {isMapReady && <MapEvents onCenterChange={handleCenterChange} onZoomChange={handleZoomChange} />}

              {/* User Location Marker */}
              {userLocation && (
                  <Marker
                      position={userLocation} // Leaflet uses LatLng object
                      icon={userLocationIcon}
                      title="Your Location"
                      zIndexOffset={1000} // Ensure user marker is on top
                  />
              )}

              {/* Stop Markers */}
              {stopMarkers}


              {/* Loading Indicator */}
              {loadingStops && (
                  <div className="absolute bottom-16 left-1/2 z-[1001] -translate-x-1/2 transform rounded bg-background/80 px-3 py-1 text-xs shadow animate-pulse">
                      {error && error.startsWith("Getting") ? error : "Loading stops..."}
                  </div>
              )}

              {/* Error Message */}
              {error && !error.startsWith("Getting") && ( // Don't show location fetching as error
                  <div className="absolute top-4 left-1/2 z-[1001] -translate-x-1/2 transform rounded bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg">
                      {error}
                  </div>
              )}

          </LeafletMapContainer>
      ) : (
          <Skeleton className="h-full w-full" /> // Show skeleton if Leaflet not ready
      )}


      {/* Recenter Button */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-24 right-4 z-[1001] shadow-lg" // Ensure button is above map but below sheet potentially
        onClick={handleRecenter}
        aria-label="Recenter map on your location"
        disabled={loadingStops && error?.startsWith("Getting")} // Disable while getting location
      >
        <LocateFixed size={20} />
      </Button>

       {/* Stop Detail Sheet */}
      <StopDetailSheet
        stop={selectedStop}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        // zIndex should be handled by Sheet component itself (portal)
      />

        {/* Placeholder for Search Bar & Route Planning */}
        <div className="absolute top-4 left-4 right-4 z-[1001] flex gap-2">
            <div className="flex-grow rounded-md bg-background p-3 text-muted-foreground shadow-lg text-sm cursor-not-allowed">
                Search / Route Planning (coming soon)
            </div>
            <Button variant="secondary" className="shadow-lg" disabled>
                Saved
            </Button>
        </div>

    </div>
  );
}
