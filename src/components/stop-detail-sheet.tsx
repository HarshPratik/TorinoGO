
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
import { Star, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { addFavoriteStopId, removeFavoriteStopId, isStopFavorite } from '@/lib/favoritesStorage';


interface StopDetailSheetProps {
  stop: GTFSStop | null;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to format arrival time relative to now
const formatArrivalTime = (isoTimeString: string, delaySeconds: number): string => {
    try {
        const scheduledArrival = parseISO(isoTimeString);
        // Avoid invalid dates if parsing fails
        if (isNaN(scheduledArrival.getTime())) {
            console.warn("Invalid date string received:", isoTimeString);
            return "Invalid time";
        }
        const estimatedArrival = new Date(scheduledArrival.getTime() + delaySeconds * 1000);
        const now = new Date();

        // If arrival is in the past, show "Arrived" or "Departed"
        if (estimatedArrival < now) {
            // Check if it was very recent (e.g., last minute)
            const minutesAgo = (now.getTime() - estimatedArrival.getTime()) / 60000;
            if (minutesAgo < 1) {
                return "Arriving now";
            }
            return "Departed"; // Or "Arrived" if more appropriate
        }

        const distance = formatDistanceToNow(estimatedArrival, { addSuffix: true });
        // Make it more concise, e.g., "in 5 min" -> "5 min", "less than a minute" -> "< 1 min"
        return distance
            .replace('in about ', '')
            .replace('in ', '')
            .replace('about ', '')
            .replace('less than a minute', '< 1 min');
    } catch (e) {
        console.error("Error formatting arrival time:", isoTimeString, e);
        return "Error";
    }
};


export function StopDetailSheet({ stop, isOpen, onClose }: StopDetailSheetProps) {
  const [arrivals, setArrivals] = useState<RealTimeArrival[]>([]);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const fetchArrivals = async (showLoading = true) => {
      if (!stop) return;
      if (showLoading) setLoadingArrivals(true);
      setError(null);
      try {
        const fetchedArrivals = await getRealTimeArrivals(stop.stopId);
        fetchedArrivals.sort((a, b) => {
            try {
                const timeA = new Date(parseISO(a.arrivalTime).getTime() + a.delay * 1000);
                const timeB = new Date(parseISO(b.arrivalTime).getTime() + b.delay * 1000);
                return timeA.getTime() - timeB.getTime();
            } catch (e) {
                console.error("Error parsing date during sort:", e);
                return 0;
            }
        });
        setArrivals(fetchedArrivals);
        if (!showLoading) {
             toast({
               title: "Arrivals Updated",
               description: `Fetched latest times for ${stop.stopName}.`,
             });
        }
      } catch (fetchError) {
        console.error('Error fetching real-time arrivals:', fetchError);
        setError('Failed to load real-time arrivals.');
        setArrivals([]);
        toast({
           title: "Error",
           description: "Could not fetch real-time arrivals.",
           variant: "destructive",
         });
      } finally {
        if (showLoading) setLoadingArrivals(false);
      }
    };


  useEffect(() => {
    if (isOpen && stop) {
      fetchArrivals(true);
      setIsFavorite(isStopFavorite(stop.stopId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop, isOpen]);


  const handleFavoriteToggle = () => {
    if (!stop) return;

    const newFavoriteState = !isFavorite;
    if (newFavoriteState) {
      addFavoriteStopId(stop.stopId);
    } else {
      removeFavoriteStopId(stop.stopId);
    }
    setIsFavorite(newFavoriteState);

    toast({
       title: newFavoriteState ? "Added to Favorites" : "Removed from Favorites",
       description: `${stop.stopName} ${newFavoriteState ? 'saved.' : 'removed.'}`,
     });
  };

  const handleSetOrigin = () => {
    // TODO: Implement route planning integration (pass stop data to parent/context)
    console.log('Set as Origin:', stop?.stopName);
    toast({
        title: "Origin Set",
        description: `${stop?.stopName} selected as starting point.`,
    });
    onClose(); // Close sheet after selection
  };

  const handleSetDestination = () => {
    // TODO: Implement route planning integration (pass stop data to parent/context)
    console.log('Set as Destination:', stop?.stopName);
     toast({
        title: "Destination Set",
        description: `${stop?.stopName} selected as destination.`,
    });
    onClose(); // Close sheet after selection
  };

  const handleRefresh = () => {
      fetchArrivals(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[75vh] flex flex-col p-0">
        {stop ? (
          <>
            <SheetHeader className="px-4 pt-4 pb-2 text-left sticky top-0 bg-background z-10">
              <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <SheetTitle className="text-xl">{stop.stopName}</SheetTitle>
                    <SheetDescription>Stop ID: {stop.stopId}</SheetDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                         variant="ghost"
                         size="icon"
                         onClick={handleRefresh}
                         className="text-muted-foreground hover:text-foreground"
                         aria-label="Refresh arrivals"
                         disabled={loadingArrivals}
                     >
                         <RefreshCw size={18} className={loadingArrivals ? 'animate-spin' : ''} />
                     </Button>
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
              </div>
            </SheetHeader>
            <Separator className="mb-0" />
            <ScrollArea className="flex-grow px-4 pb-2">
              <h3 className="mb-2 text-lg font-semibold pt-3">Upcoming Arrivals</h3>
              {loadingArrivals ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-5/6" />
                </div>
              ) : error ? (
                <p className="text-destructive py-4">{error}</p>
              ) : arrivals.length > 0 ? (
                <ul className="space-y-1 py-2">
                  {arrivals.map((arrival, index) => (
                    <li key={`${arrival.tripId}-${index}-${arrival.arrivalTime}`} className="flex items-center justify-between py-2.5 border-b border-dashed last:border-none">
                      <div className="flex items-center gap-3">
                         <Badge variant="outline" className="font-mono text-base w-14 h-8 flex items-center justify-center bg-primary text-primary-foreground border-primary">
                           {arrival.routeId ? arrival.routeId.replace('Line-', '') : arrival.tripId.substring(0,3)}
                         </Badge>
                         <span className="text-sm font-medium flex-1">
                            {arrival.headsign || `Towards Destination ${index + 1}`}
                         </span>
                      </div>

                     <div className="text-right flex flex-col items-end">
                        <span className="font-semibold text-sm tabular-nums">{formatArrivalTime(arrival.arrivalTime, arrival.delay)}</span>
                        {arrival.delay > 60 && (
                          <span className="text-xs text-destructive">
                            ({Math.round(arrival.delay / 60)} min delay)
                          </span>
                        )}
                         {arrival.delay > 0 && arrival.delay <= 60 && (
                          <span className="text-xs text-yellow-600">
                            (slight delay)
                          </span>
                        )}
                        {!arrival.delay && (<span className="text-xs text-muted-foreground">On time</span>)}
                     </div>

                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground py-4">No upcoming arrivals found for this stop.</p>
              )}
            </ScrollArea>
            <SheetFooter className="px-4 py-3 border-t bg-background sticky bottom-0 z-10">
              <div className="flex w-full justify-between gap-2">
                 <Button variant="outline" className="flex-1" onClick={handleSetOrigin}>
                   <MapPin className="mr-2 h-4 w-4" /> Set as Origin
                 </Button>
                 <Button variant="default" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSetDestination}>
                   <Navigation className="mr-2 h-4 w-4" /> Set as Destination
                 </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-4">
             <div className="space-y-3 w-full">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Separator />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-5/6" />
             </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

