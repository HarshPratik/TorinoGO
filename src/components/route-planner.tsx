
import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { findRoutes } from "@/services/gtt"; // This service can be shared

interface Stop {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
}

interface RoutePlannerProps {
  stops: Stop[]; // These stops are from the web map's vicinity
}

export default function RoutePlanner({ stops }: RoutePlannerProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanRoute = async () => {
    setLoading(true);
    setError(null);
    setRoutes([]);
    try {
      // For web, we might use names. For native, IDs might be more robust if passed from map.
      const originStop = stops.find(
        (s) => s.stopName.toLowerCase() === origin.toLowerCase()
      );
      const destinationStop = stops.find(
        (s) => s.stopName.toLowerCase() === destination.toLowerCase()
      );
      if (!originStop || !destinationStop) {
        setError("Please select valid origin and destination stops from the current map view.");
        setLoading(false);
        return;
      }
      // The findRoutes service is shared, assuming it takes lat/lon.
      const foundRoutes = await findRoutes(
        originStop.stopLat,
        originStop.stopLon,
        destinationStop.stopLat,
        destinationStop.stopLon
      );
      setRoutes(foundRoutes);
    } catch (e) {
      setError("Failed to calculate route.");
      console.error("Route planning error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-4 w-full max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Route Planner (Web)</h2>
      <div className="flex flex-col gap-2 mb-2">
        <Label htmlFor="origin">Origin Stop</Label>
        <Input
          id="origin"
          list="stops-list-origin" // Unique list id
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Enter origin stop name"
        />
        <datalist id="stops-list-origin">
          {stops.map((stop) => (
            <option key={`origin-${stop.stopId}`} value={stop.stopName} />
          ))}
        </datalist>

        <Label htmlFor="destination">Destination Stop</Label>
        <Input
          id="destination"
          list="stops-list-destination" // Unique list id
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination stop name"
        />
        <datalist id="stops-list-destination">
          {stops.map((stop) => (
            <option key={`dest-${stop.stopId}`} value={stop.stopName} />
          ))}
        </datalist>
      </div>
      <Button onClick={handlePlanRoute} disabled={loading} className="w-full">
        {loading ? "Planning..." : "Plan Route"}
      </Button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {routes.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Route Options</h3>
          {routes.map((route, idx) => (
            <div key={idx} className="mb-2 p-2 border rounded">
              <p className="font-medium">{route.summary}</p>
              <p className="text-sm">Duration: {route.duration} mins, Transfers: {route.transfers}</p>
              <details className="text-xs mt-1">
                <summary>Show steps</summary>
                <ul>
                {route.steps.map((step: any, stepIdx: number) => (
                  <li key={stepIdx}>{step.type === 'bus' || step.type === 'tram' ? `[${step.line}] ` : ''}{step.description}</li>
                ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

