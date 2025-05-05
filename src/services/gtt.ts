/**
 * Represents a GTFS Stop.
 */
export interface GTFSStop {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
  // Optional: Add stopCode if available and useful
  // stopCode?: string;
  // Optional: Add locationType (0 for Stop, 1 for Station) if needed
  // locationType?: number;
}

/**
 * Represents a GTFS Route.
 */
export interface GTFSRoute {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeType: number; // e.g., 3 for bus, 0 for tram, 1 for metro
  routeColor: string;
}

/**
 * Represents a GTFS Trip.
 */
export interface GTFSTrip {
  tripId: string;
  routeId: string;
  serviceId: string;
  tripHeadsign: string;
}

/**
 * Represents real-time arrival information for a specific stop.
 */
export interface RealTimeArrival {
  tripId: string;
  routeId?: string; // Optional: Include routeId if easily available from API
  arrivalTime: string; // ISO 8601 format (UTC recommended)
  departureTime?: string; // Optional: ISO 8601 format
  delay: number; // in seconds (positive for delay, negative for early)
  headsign?: string; // Optional: Trip headsign override
}

/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

// --- Dummy Data Simulation ---

const allDummyStops: GTFSStop[] = [
  { stopId: 'GTT-1501', stopName: 'Porta Nuova', stopLat: 45.063, stopLon: 7.679 },
  { stopId: 'GTT-1502', stopName: 'Vittorio Emanuele II', stopLat: 45.067, stopLon: 7.683 },
  { stopId: 'GTT-244', stopName: 'Massimo D\'Azeglio', stopLat: 45.056, stopLon: 7.687 },
  { stopId: 'GTT-591', stopName: 'Porta Susa', stopLat: 45.071, stopLon: 7.664 },
  { stopId: 'GTT-472', stopName: 'Bertola', stopLat: 45.072, stopLon: 7.683 },
  { stopId: 'GTT-342', stopName: 'Solferino', stopLat: 45.068, stopLon: 7.675 },
  { stopId: 'GTT-765', stopName: 'Statuto', stopLat: 45.079, stopLon: 7.671 },
  { stopId: 'GTT-205', stopName: 'Castello', stopLat: 45.071, stopLon: 7.686 },
  { stopId: 'GTT-2780', stopName: 'Carducci Molinette', stopLat: 45.045, stopLon: 7.677 },
  // Add more stops representative of Turin
];

// Helper to calculate distance (simplified Haversine)
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371e3; // metres
  const φ1 = loc1.lat * Math.PI/180; // φ, λ in radians
  const φ2 = loc2.lat * Math.PI/180;
  const Δφ = (loc2.lat-loc1.lat) * Math.PI/180;
  const Δλ = (loc2.lng-loc1.lng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

/**
 * Retrieves all GTFS stops within a given radius of a location.
 * (Simulated version)
 * @param location The center location.
 * @param radius The radius in meters.
 * @returns A promise that resolves to an array of GTFS stops.
 */
export async function getNearbyStops(location: Location, radius: number): Promise<GTFSStop[]> {
  console.log(`Simulating getNearbyStops around ${location.lat}, ${location.lng} with radius ${radius}m`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

  const nearby = allDummyStops.filter(stop => {
    const distance = calculateDistance(location, { lat: stop.stopLat, lng: stop.stopLon });
    return distance <= radius;
  });

  console.log(`Found ${nearby.length} stops nearby (simulated).`);
  return nearby;
}

/**
 * Retrieves real-time arrival information for a given stop.
 * (Simulated version)
 * @param stopId The ID of the stop.
 * @returns A promise that resolves to an array of real-time arrival objects.
 */
export async function getRealTimeArrivals(stopId: string): Promise<RealTimeArrival[]> {
   console.log(`Simulating getRealTimeArrivals for stopId: ${stopId}`);
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));

   const now = new Date();
   const arrivals: RealTimeArrival[] = [];
   const numberOfArrivals = Math.floor(Math.random() * 5) + 2; // 2 to 6 arrivals

   for (let i = 0; i < numberOfArrivals; i++) {
     const minutesUntilArrival = Math.floor(Math.random() * 25) + 2; // 2 to 26 minutes
     const delaySeconds = Math.random() > 0.7 ? Math.floor(Math.random() * 300) : 0; // ~30% chance of delay up to 5 mins
     const arrivalTime = new Date(now.getTime() + minutesUntilArrival * 60000 - delaySeconds * 1000);

     arrivals.push({
       tripId: `Trip-${stopId.substring(4)}-${i}`, // Example trip ID
       routeId: `Line-${Math.floor(Math.random() * 20) + 1}`, // Example route ID
       arrivalTime: arrivalTime.toISOString(),
       delay: delaySeconds,
       headsign: `Direction ${String.fromCharCode(65 + i)}` // Example Headsign
     });
   }

   console.log(`Generated ${arrivals.length} dummy arrivals for ${stopId}.`);
   return arrivals;
 }


/**
 * Finds routes between an origin and a destination.
 * **This function is not implemented yet.**
 *
 * @param originLat
 * @param originLon
 * @param destinationLat
 * @param destinationLon
 * @returns A promise resolving to an empty array (placeholder).
 */
export async function findRoutes(
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number
): Promise<any> {
  console.warn('findRoutes function is not implemented.');
  // Simulate API call delay for consistency
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real implementation, this would call a routing engine (e.g., OpenTripPlanner)
  return [];
}
