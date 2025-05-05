
import { parseISO } from 'date-fns'; // Import parseISO

/**
 * Represents a GTFS Stop.
 */
export interface GTFSStop {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
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
  { stopId: 'GTT-1501', stopName: 'Porta Nuova Station', stopLat: 45.0630, stopLon: 7.6790 },
  { stopId: 'GTT-1502', stopName: 'Vittorio Emanuele II', stopLat: 45.0672, stopLon: 7.6835 },
  { stopId: 'GTT-244', stopName: 'Massimo D\'Azeglio', stopLat: 45.0560, stopLon: 7.6870 },
  { stopId: 'GTT-591', stopName: 'Porta Susa Station', stopLat: 45.0715, stopLon: 7.6640 },
  { stopId: 'GTT-472', stopName: 'Bertola', stopLat: 45.0720, stopLon: 7.6830 },
  { stopId: 'GTT-342', stopName: 'Solferino', stopLat: 45.0680, stopLon: 7.6750 },
  { stopId: 'GTT-765', stopName: 'Statuto Nord', stopLat: 45.0790, stopLon: 7.6710 },
  { stopId: 'GTT-205', stopName: 'Castello', stopLat: 45.0710, stopLon: 7.6860 },
  { stopId: 'GTT-2780', stopName: 'Carducci Molinette', stopLat: 45.0455, stopLon: 7.6775 },
  { stopId: 'GTT-123', stopName: 'Politecnico', stopLat: 45.0628, stopLon: 7.6612 },
  { stopId: 'GTT-456', stopName: 'Vinzaaglio', stopLat: 45.0695, stopLon: 7.6688 },
  { stopId: 'GTT-789', stopName: 'Re Umberto', stopLat: 45.0655, stopLon: 7.6760 },
  { stopId: 'GTT-1011', stopName: 'San Carlo', stopLat: 45.0690, stopLon: 7.6845 },
  { stopId: 'GTT-1213', stopName: 'Gran Madre', stopLat: 45.0635, stopLon: 7.6950 },
];

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * @param loc1 The first location.
 * @param loc2 The second location.
 * @returns The distance in meters.
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371e3; // Earth radius in metres
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

  // Simulate potential API failure
  if (Math.random() < 0.05) { // 5% chance of failure
      console.error("Simulated API error fetching nearby stops.");
      throw new Error("Simulated network error fetching stops.");
  }


  const nearby = allDummyStops.filter(stop => {
    const distance = calculateDistance(location, { lat: stop.stopLat, lng: stop.stopLon });
    return distance <= radius;
  });

  console.log(`Found ${nearby.length} stops nearby (simulated).`);
  return nearby;
}


const realisticHeadsigns: { [key: string]: string[] } = {
    '4': ['Falchera', 'Strada del Drosso'],
    '10': ['Via Massari', 'Piazza Statuto'],
    '13': ['Piazza Gran Madre', 'Piazza Campanella'],
    '15': ['Sassi Superga', 'Via Brissogne'],
    '16': ['Piazza Sabotino Circolare Destra', 'Piazza Sabotino Circolare Sinistra'],
    '18': ['Piazzale Caio Mario', 'Piazza Sofia'],
    '55': ['Grosso Capolinea', 'Piazza Farini'],
    '68': ['Via Frejus', 'Corso Casale'],
    // Add more lines and typical destinations
};


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

    // Simulate potential API failure
    if (Math.random() < 0.1) { // 10% chance of failure
        console.error("Simulated API error fetching real-time arrivals.");
        throw new Error("Simulated network error fetching arrivals.");
    }

   const now = new Date();
   const arrivals: RealTimeArrival[] = [];
   // Generate a more realistic number of arrivals, maybe based on stop popularity?
   const numberOfLines = Math.floor(Math.random() * 4) + 1; // 1 to 4 different lines serve the stop

   for (let lineIdx = 0; lineIdx < numberOfLines; lineIdx++) {
        const lineKeys = Object.keys(realisticHeadsigns);
        const randomLineKey = lineKeys[Math.floor(Math.random() * lineKeys.length)];
        const possibleHeadsigns = realisticHeadsigns[randomLineKey] || [`Destination ${lineIdx+1}A`, `Destination ${lineIdx+1}B`];

        const numberOfArrivalsForLine = Math.floor(Math.random() * 3) + 1; // 1 to 3 arrivals per line

        for (let i = 0; i < numberOfArrivalsForLine; i++) {
            // More realistic arrival time distribution
            const minutesUntilArrival = (i * (Math.random() * 10 + 8)) + (Math.random() * 5 + 2); // Base + Jitter + Offset per arrival
            const delaySeconds = Math.random() > 0.7 ? Math.floor(Math.random() * 180) - 30 : 0; // ~30% chance of delay/early up to 3 mins
            const arrivalTime = new Date(now.getTime() + minutesUntilArrival * 60000 - delaySeconds * 1000);

            // Ensure arrival time is in the future for simulation simplicity unless it's very close
             if (arrivalTime < now && minutesUntilArrival > 1) continue; // Skip arrivals too far in past

            const headsign = possibleHeadsigns[Math.floor(Math.random() * possibleHeadsigns.length)];

            arrivals.push({
                tripId: `Trip-${stopId.substring(4)}-${lineIdx}-${i}-${Date.now()}`, // More unique trip ID
                routeId: `Line-${randomLineKey}`, // Use realistic line key
                arrivalTime: arrivalTime.toISOString(),
                delay: delaySeconds,
                headsign: headsign
            });
        }
   }


   console.log(`Generated ${arrivals.length} dummy arrivals for ${stopId}.`);
   // Sort arrivals by estimated time before returning
   arrivals.sort((a, b) => {
       try {
           const timeA = new Date(parseISO(a.arrivalTime).getTime() + a.delay * 1000);
           const timeB = new Date(parseISO(b.arrivalTime).getTime() + b.delay * 1000);
           // Handle potential NaN results from date parsing
           if (isNaN(timeA.getTime())) return 1;
           if (isNaN(timeB.getTime())) return -1;
           return timeA.getTime() - timeB.getTime();
       } catch (e) {
            console.error("Error parsing date during sort:", e);
            return 0; // Keep order if error occurs
       }
    });
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
