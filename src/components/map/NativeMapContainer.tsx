
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Callout, Region, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';
import { LocateFixed, Navigation, Star } from 'lucide-react-native';
import type { GTFSStop } from '@/services/gtt';
import { getNearbyStops, calculateDistance } from '@/services/gtt';
import NativeStopDetailSheet from '@/components/sheet/NativeStopDetailSheet';
import { colors, nativeStyles, iconSizes } from '@/styles/nativeStyles';
import Toast from 'react-native-toast-message';

const DEFAULT_CENTER_LATLNG: LatLng = { latitude: 45.0703, longitude: 7.6869 }; // Turin center
const DEFAULT_ZOOM_DELTA = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 };
const USER_ZOOM_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.005 };
const NEARBY_RADIUS_METERS = 1000;

export default function NativeMapContainer() {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [stops, setStops] = useState<GTFSStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<GTFSStop | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>({
    ...DEFAULT_CENTER_LATLNG,
    ...DEFAULT_ZOOM_DELTA,
  });
  const [loadingStops, setLoadingStops] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [initialLocationFetched, setInitialLocationFetched] = useState(false);

  const mapRef = useRef<MapView>(null);

  const fetchStops = useCallback(async (center: LatLng) => {
    setLoadingStops(true);
    try {
      const nearbyStops = await getNearbyStops({ lat: center.latitude, lng: center.longitude }, NEARBY_RADIUS_METERS);
      setStops(nearbyStops);
    } catch (fetchError) {
      console.error('Error fetching stops:', fetchError);
      Toast.show({ type: 'error', text1: 'Network Error', text2: 'Failed to load nearby stops.' });
      setStops([]);
    } finally {
      setLoadingStops(false);
    }
  }, []);

  const requestLocationPermissions = useCallback(async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Location permission is needed to show your position.' });
      fetchStops(DEFAULT_CENTER_LATLNG); // Fetch for default location
      setInitialLocationFetched(true);
      return false;
    }
    return true;
  }, [fetchStops]);

  useEffect(() => {
    const getUserLocationAndInitialStops = async () => {
      const permissionGranted = await requestLocationPermissions();
      if (permissionGranted) {
        try {
          // Setting a timeout for location fetching
          const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Location timeout")), 10000));
          
          const position = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

          const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
          setUserLocation(location);
          const newRegion = { ...location, ...USER_ZOOM_DELTA };
          setCurrentRegion(newRegion);
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 500);
          }
          await fetchStops(location);
        } catch (err: any) {
          console.warn('Error getting current location or timeout:', err.message);
          Toast.show({ type: 'error', text1: 'Location Error', text2: err.message.includes("timeout") ? 'Could not get location quickly.' : 'Could not get your location.' });
          await fetchStops(DEFAULT_CENTER_LATLNG); // Fallback to default
        }
      }
      setInitialLocationFetched(true);
    };

    getUserLocationAndInitialStops();
  }, [requestLocationPermissions, fetchStops]);

  const handleRegionChangeComplete = (region: Region) => {
    // Debounce or threshold logic can be added here if needed
    const distance = calculateDistance(
        { lat: currentRegion.latitude, lng: currentRegion.longitude },
        { lat: region.latitude, lng: region.longitude }
    );
    // Fetch new stops if map moved significantly
    if (distance > 200) { // e.g. 200 meters
        setCurrentRegion(region); // Update currentRegion to reflect the change
        fetchStops({ latitude: region.latitude, longitude: region.longitude });
    } else {
        // If not fetching, still update currentRegion to keep state consistent with map view
        setCurrentRegion(region);
    }
  };

  const handleMarkerClick = (stop: GTFSStop) => {
    setSelectedStop(stop);
    setIsSheetOpen(true);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: stop.stopLat,
        longitude: stop.stopLon,
        latitudeDelta: USER_ZOOM_DELTA.latitudeDelta,
        longitudeDelta: USER_ZOOM_DELTA.longitudeDelta,
      }, 500);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    // No need to timeout clearing selectedStop if modal animation handles it
    setSelectedStop(null);
  };

  const handleRecenter = async () => {
    const permissionGranted = await requestLocationPermissions();
    if (!permissionGranted) return;

    try {
      setLoadingStops(true); // Indicate activity
      Toast.show({ type: 'info', text1: 'Locating', text2: 'Getting your current location...' });
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeout: 5000 });
      const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUserLocation(location);
      const newRegion = { ...location, ...USER_ZOOM_DELTA };
      setCurrentRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }
      // fetchStops will be triggered by region change if moved significantly,
      // or we can call it explicitly if we want fresh stops regardless of distance.
      // For recenter, explicit call might be better.
      await fetchStops(location);
      Toast.hide();
    } catch (err) {
      console.warn('Recenter: Geolocation Error:', err);
      Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not get your current location for recenter.' });
      setLoadingStops(false);
    }
  };
  
  if (!initialLocationFetched && !loadingStops) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={nativeStyles.loadingMessage}>Initializing Map...</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={currentRegion} // Use currentRegion which is updated
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={Platform.OS === 'ios'} // Android shows default blue dot, iOS needs this
        showsMyLocationButton={false} // We have a custom button
      >
        {Platform.OS === 'android' && userLocation && (
           <Marker coordinate={userLocation} title="Your Location" pinColor={colors.accent} />
        )}

        {stops.map((stop) => (
          <Marker
            key={stop.stopId}
            coordinate={{ latitude: stop.stopLat, longitude: stop.stopLon }}
            onPress={() => handleMarkerClick(stop)}
            // Custom marker view can be used here for better styling
            // For simplicity, using default marker with a bus icon color if possible
            pinColor={colors.primary} // Or use a custom image/view
          >
            <Callout tooltip={false} onPress={() => handleMarkerClick(stop)}>
              <View style={styles.calloutView}>
                <Text style={styles.calloutTitle}>{stop.stopName}</Text>
                <Text style={styles.calloutDescription}>ID: {stop.stopId}</Text>
                <TouchableOpacity onPress={() => handleMarkerClick(stop)}>
                   <Text style={styles.calloutLink}>View Arrivals</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loadingStops && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primaryForeground} />
          <Text style={styles.loadingText}>Loading stops...</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter} disabled={loadingStops}>
        <LocateFixed size={iconSizes.medium} color={colors.primary} />
      </TouchableOpacity>

      {selectedStop && (
        <NativeStopDetailSheet
          stop={selectedStop}
          isOpen={isSheetOpen}
          onClose={handleSheetClose}
        />
      )}
      
      {/* Placeholder for Search/Route Planning - To be implemented with React Native components */}
      <View style={styles.searchPlaceholder}>
        <Text style={{color: colors.mutedForeground}}>Search / Route Planning (Native - TBD)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
   loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 90, // Adjusted for potential bottom sheet
    right: 20,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calloutView: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.foreground,
  },
  calloutDescription: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  calloutLink: {
    color: colors.primary,
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 160, // Above recenter button
    left: '50%',
    transform: [{ translateX: -75 }], // Adjust based on width
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.primaryForeground,
    marginLeft: 8,
    fontSize: 12,
  },
  searchPlaceholder: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Adjust for status bar
    left: 20,
    right: 20,
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
});
