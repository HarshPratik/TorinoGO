import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { findRoutes } from "@/services/gtt";

interface Stop {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
}

interface RoutePlannerProps {
  stops: Stop[];
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
      const originStop = stops.find(
        (s) => s.stopName.toLowerCase() === origin.toLowerCase()
      );
      const destinationStop = stops.find(
        (s) => s.stopName.toLowerCase() === destination.toLowerCase()
      );
      if (!originStop || !destinationStop) {
        setError("Please select valid origin and destination stops.");
        setLoading(false);
        return;
      }
      const foundRoutes = await findRoutes(
        originStop.stopLat,
        originStop.stopLon,
        destinationStop.stopLat,
        destinationStop.stopLon
      );
      setRoutes(foundRoutes);
    } catch (e) {
      setError("Failed to calculate route.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 mb-4 w-full max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Route Planner</h2>
      <div className="flex flex-col gap-2 mb-2">
        <Label htmlFor="origin">Origin Stop</Label>
        <Input
          id="origin"
          list="stops-list"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Enter origin stop name"
        />
        <Label htmlFor="destination">Destination Stop</Label>
        <Input
          id="destination"
          list="stops-list"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination stop name"
        />
        <datalist id="stops-list">
          {stops.map((stop) => (
            <option key={stop.stopId} value={stop.stopName} />
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
              {/* Display route details here */}
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(route, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}