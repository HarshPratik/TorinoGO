'use client';

import { useState, useEffect } from 'react';
import type { GTFSStop, RealTimeArrival } from '@/services/gtt';
import { getRealTimeArrivals } from '@/services/gtt';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, Navigation } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface StopDetailSheetProps {
  stop: GTFSStop | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to format arrival time relative to now
const formatArrivalTime = (isoTimeString: string, delaySeconds: number): string => {
    try {
        const scheduledArrival = parseISO(isoTimeString);
        const estimatedArrival = new Date(scheduledArrival.getTime() + delaySeconds * 1000);
        const distance = formatDistanceToNow(estimatedArrival, { addSuffix: true });
        // Make it more concise, e.g., "in 5 min" -> "5 min"
        return distance.replace('in ', '').replace('about ', '');
    } catch (e) {
        console.error("Error parsing date:", isoTimeString, e);
        return "Invalid time";
    }
};


export function StopDetailSheet({ stop, isOpen, onClose }: StopDetailSheetProps) {
  const [arrivals, setArrivals] = useState<RealTimeArrival[]>([]);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false); // Placeholder state

  useEffect(() => {
    async function fetchArrivals() {
      if (!stop || !isOpen) return;
      setLoadingArrivals(true);
      setError(null);
      setArrivals([]); // Clear previous arrivals
      try {
        const fetchedArrivals = await getRealTimeArrivals(stop.stopId);
        // Sort arrivals by estimated time
        fetchedArrivals.sort((a, b) => {
            const timeA = new Date(parseISO(a.arrivalTime).getTime() + a.delay * 1000);
            const timeB = new Date(parseISO(b.arrivalTime).getTime() + b.delay * 1000);
            return timeA.getTime() - timeB.getTime();
        });
        setArrivals(fetchedArrivals);
      } catch (fetchError) {
        console.error('Error fetching real-time arrivals:', fetchError);
        setError('Failed to load real-time arrivals.');
      } finally {
        setLoadingArrivals(false);
      }
    }

    if (isOpen && stop) {
      fetchArrivals();
      // Check if stop is favorite (replace with actual logic later)
      // For now, randomly set favorite status for demo
      setIsFavorite(Math.random() > 0.7);
    }
  }, [stop, isOpen]);

  const handleFavoriteToggle = () => {
    // TODO: Implement actual favorite saving logic (Firebase)
    setIsFavorite(!isFavorite);
    console.log('Favorite toggled for stop:', stop?.stopId, !isFavorite);
    // Add toast notification later
  };

  const handleSetOrigin = () => {
    // TODO: Implement route planning integration
    console.log('Set as Origin:', stop?.stopName);
    onClose(); // Close sheet after selection
     // Add toast notification later
  };

  const handleSetDestination = () => {
    // TODO: Implement route planning integration
    console.log('Set as Destination:', stop?.stopName);
    onClose(); // Close sheet after selection
     // Add toast notification later
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[75vh] flex flex-col">
        {stop ? (
          <>
            <SheetHeader className="px-4 pt-4 pb-2 text-left">
              <div className="flex justify-between items-start">
                  <div>
                    <SheetTitle className="text-xl">{stop.stopName}</SheetTitle>
                    <SheetDescription>Stop ID: {stop.stopId}</SheetDescription>
                  </div>
                  <Button
                     variant={isFavorite ? "secondary" : "ghost"}
                     size="icon"
                     onClick={handleFavoriteToggle}
                     className={`transition-colors ${isFavorite ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                     aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                   >
                    <Star fill={isFavorite ? "currentColor" : "none"} size={20} />
                   </Button>
              </div>
            </SheetHeader>
            <Separator className="my-2" />
            <ScrollArea className="flex-grow px-4 pb-2">
              <h3 className="mb-2 text-lg font-semibold">Upcoming Arrivals</h3>
              {loadingArrivals ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-2/3" />
                </div>
              ) : error ? (
                <p className="text-destructive">{error}</p>
              ) : arrivals.length > 0 ? (
                <ul className="space-y-2">
                  {arrivals.map((arrival, index) => (
                    <li key={`${arrival.tripId}-${index}`} className="flex items-center justify-between py-1 border-b border-dashed">
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="font-mono text-sm w-12 justify-center">
                           {/* Placeholder Line Number - replace with actual data */}
                           {arrival.tripId.substring(0,3)}
                         </Badge>
                         <span className="text-sm">
                            {/* Placeholder Destination - replace with actual data */}
                            Towards Destination {index + 1}
                         </span>
                      </div>

                     <div className="text-right">
                        <span className="font-medium text-sm">{formatArrivalTime(arrival.arrivalTime, arrival.delay)}</span>
                        {arrival.delay > 60 && (
                          <span className="ml-1 text-xs text-destructive">
                            ({Math.round(arrival.delay / 60)} min delay)
                          </span>
                        )}
                         {arrival.delay > 0 && arrival.delay <= 60 && (
                          <span className="ml-1 text-xs text-yellow-600">
                            (slight delay)
                          </span>
                        )}
                     </div>

                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No upcoming arrivals found.</p>
              )}
            </ScrollArea>
            <SheetFooter className="px-4 py-3 border-t bg-background">
              <div className="flex w-full justify-between gap-2">
                 <Button variant="outline" className="flex-1" onClick={handleSetOrigin}>
                   <MapPin className="mr-2 h-4 w-4" /> Set as Origin
                 </Button>
                 <Button variant="default" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSetDestination}>
                   <Navigation className="mr-2 h-4 w-4" /> Set as Destination
                 </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          // Loading state for the sheet itself if stop is null initially
          <div className="flex h-full items-center justify-center">
             <Skeleton className="h-3/4 w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
