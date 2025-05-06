'use client';

import { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LocateFixed, Bus, X } from 'lucide-react';
import { StopDetailSheet } from '@/components/stop-detail-sheet';
import { useToast } from "@/hooks/use-toast";
import RoutePlanner from "./route-planner";

// Constants
const TORINO_CENTER = [45.0703, 7.6869];
const NEARBY_RADIUS_METERS = 1000; // 1km radius for stops

export function MapLoader() {
  // Only show map on client-side
  const [showMap, setShowMap] = useState(false);
  
  useEffect(() => {
    // Set a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  if (!showMap) {
    return <Skeleton className="h-full w-full" />;
  }
  
  return (
    <div className="h-full w-full relative" id="map-container-wrapper">
      <MapContent key={`map-${Date.now()}`} />
    </div>
  );
}

// Main map component
function MapContent() {
  // State hooks
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loadingStops, setLoadingStops] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs
  const userMarkerRef = useRef(null);
  const stopMarkersRef = useRef([]);
  
  // Toast notifications
  const { toast } = useToast();
  
  useEffect(() => {
    // Dynamically import Leaflet and services
    const L = require('leaflet');
    const { getNearbyStops, getRealTimeArrivals, calculateDistance } = require('@/services/gtt');
    
    // Create container element
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    // Initialize map
    const leafletMap = L.map(mapContainer, {
      center: TORINO_CENTER,
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      maxBounds: [
        [44.9, 7.5],
        [45.2, 8.0]
      ],
      maxBoundsViscosity: 0.8
    });
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);
    
    setMap(leafletMap);
    
    // Define custom icons
    const userLocationIcon = L.divIcon({
      html: '<div class="h-4 w-4 rounded-full bg-blue-500 ring-2 ring-white shadow-lg animate-pulse"></div>',
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    
    const stopIcon = L.divIcon({
      html: `<div class="rounded-full bg-primary p-1 shadow-md flex items-center justify-center hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><path d="M8 6v6"/><path d="M16 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
            </div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
    
    // Function to get user location
    const getUserLocation = () => {
      setLoadingStops(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const userLoc = L.latLng(latitude, longitude);
            setUserLocation(userLoc);
            
            // Add or update user marker
            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng(userLoc);
            } else {
              userMarkerRef.current = L.marker(userLoc, { icon: userLocationIcon })
                .addTo(leafletMap)
                .bindPopup('Your Location');
            }
            
            // Center map on user
            leafletMap.flyTo(userLoc, 15, { duration: 1 });
            
            // Fetch nearby stops
            fetchNearbyStops(userLoc);
            setError(null);
          },
          (err) => {
            console.error(`Geolocation error (${err.code}): ${err.message}`);
            setError('Unable to get your location');
            setLoadingStops(false);
            toast({
              title: "Location Error",
              description: "Could not get your current location.",
              variant: "destructive",
            });
          }
        );
      } else {
        setError('Geolocation is not supported by your browser');
        setLoadingStops(false);
      }
    };
    
    // Function to fetch nearby stops
    const fetchNearbyStops = async (center) => {
      setLoadingStops(true);
      try {
        const nearbyStops = await getNearbyStops(
          { lat: center.lat, lng: center.lng },
          NEARBY_RADIUS_METERS
        );
        
        setStops(nearbyStops);
        
        // Clear existing stop markers
        stopMarkersRef.current.forEach(marker => {
          if (marker) leafletMap.removeLayer(marker);
        });
        stopMarkersRef.current = [];
        
        // Add new stop markers
        nearbyStops.forEach(stop => {
          const marker = L.marker([stop.stopLat, stop.stopLon], { icon: stopIcon })
            .addTo(leafletMap)
            .bindPopup(`<div class="text-sm font-semibold">${stop.stopName}</div><div class="text-xs">ID: ${stop.stopId}</div>`)
            .on('click', () => handleStopClick(stop));
          
          stopMarkersRef.current.push(marker);
        });
        
      } catch (err) {
        console.error('Error fetching stops:', err);
        setError('Failed to load public transport stops');
        toast({
          title: "Error",
          description: "Failed to load nearby stops.",
          variant: "destructive",
        });
      } finally {
        setLoadingStops(false);
      }
    };
    
    // Function to handle stop click
    const handleStopClick = (stop) => {
      setSelectedStop(stop);
      setIsSheetOpen(true);
      
      // Center on the selected stop
      leafletMap.flyTo([stop.stopLat, stop.stopLon], 16, { duration: 0.5 });
      
      // Get real-time arrivals
      getRealTimeArrivals(stop.stopId)
        .then(arrivals => {
          // This would update the stop detail sheet with arrivals
          console.log('Arrivals for stop:', arrivals);
        })
        .catch(err => {
          console.error('Error fetching arrivals:', err);
        });
    };
    
    // Handle map movement to update stops
    leafletMap.on('moveend', () => {
      const center = leafletMap.getCenter();
      fetchNearbyStops(center);
    });
    
    // Get initial user location
    getUserLocation();
    
    // Add locate button to DOM
    const locateButton = document.createElement('button');
    locateButton.className = 'absolute bottom-24 right-4 z-[1001] bg-white rounded-full p-2 shadow-lg';
    locateButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-locate-fixed"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>';
    locateButton.onclick = getUserLocation;
    mapContainer.parentNode.appendChild(locateButton);
    
    // Cleanup function
    return () => {
      if (leafletMap) {
        leafletMap.remove();
      }
      if (locateButton && locateButton.parentNode) {
        locateButton.parentNode.removeChild(locateButton);
      }
    };
  }, []);
  
  // Handle sheet close
  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setTimeout(() => {
      setSelectedStop(null);
    }, 300);
  };
  
  return (
    <>
      <div id="map-container" className="h-full w-full" />
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1002] w-full max-w-xl px-2">
        <RoutePlanner stops={stops} />
      </div>
      
      {selectedStop && (
        <StopDetailSheet
          stop={selectedStop}
          isOpen={isSheetOpen}
          onClose={handleSheetClose}
        />
      )}
      
      {loadingStops && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md z-[1000]">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
            <span className="text-sm font-medium">Loading stops...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive text-white px-4 py-2 rounded-full shadow-md z-[1000] flex items-center gap-2">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-2">
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}