
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import type { GTFSStop, RealTimeArrival } from '@/services/gtt';
import { getRealTimeArrivals } from '@/services/gtt';
import { Star, MapPin, Navigation, RefreshCw, X } from 'lucide-react-native';
import { colors, nativeStyles, iconSizes } from '@/styles/nativeStyles';
import { formatDistanceToNow, parseISO } from 'date-fns';
import Toast from 'react-native-toast-message';
import { addFavoriteStopId, removeFavoriteStopId, isStopFavorite } from '@/lib/favoritesStorage'; // Ensure this uses AsyncStorage

interface NativeStopDetailSheetProps {
  stop: GTFSStop | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatArrivalTime = (isoTimeString: string, delaySeconds: number): string => {
  try {
    const scheduledArrival = parseISO(isoTimeString);
    if (isNaN(scheduledArrival.getTime())) return "Invalid time";
    const estimatedArrival = new Date(scheduledArrival.getTime() + delaySeconds * 1000);
    const now = new Date();

    if (estimatedArrival < now) {
      const minutesAgo = (now.getTime() - estimatedArrival.getTime()) / 60000;
      if (minutesAgo < 1) return "Arriving now";
      return "Departed";
    }
    const distance = formatDistanceToNow(estimatedArrival, { addSuffix: true });
    return distance.replace('in about ', '').replace('in ', '').replace('about ', '').replace('less than a minute', '< 1 min');
  } catch (e) {
    return "Error";
  }
};

export default function NativeStopDetailSheet({ stop, isOpen, onClose }: NativeStopDetailSheetProps) {
  const [arrivals, setArrivals] = useState<RealTimeArrival[]>([]);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const fetchArrivals = useCallback(async (showLoading = true) => {
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
        } catch { return 0; }
      });
      setArrivals(fetchedArrivals);
      if (!showLoading) {
        Toast.show({ type: 'success', text1: 'Arrivals Updated', text2: `Fetched latest for ${stop.stopName}.` });
      }
    } catch (fetchError) {
      setError('Failed to load real-time arrivals.');
      setArrivals([]);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not fetch arrivals.' });
    } finally {
      if (showLoading) setLoadingArrivals(false);
    }
  }, [stop]);

  useEffect(() => {
    if (isOpen && stop) {
      fetchArrivals(true);
      isStopFavorite(stop.stopId).then(setIsFav);
    }
  }, [stop, isOpen, fetchArrivals]);

  const handleFavoriteToggle = async () => {
    if (!stop) return;
    const newFavoriteState = !isFav;
    if (newFavoriteState) {
      await addFavoriteStopId(stop.stopId);
    } else {
      await removeFavoriteStopId(stop.stopId);
    }
    setIsFav(newFavoriteState);
    Toast.show({
      type: 'success',
      text1: newFavoriteState ? 'Added to Favorites' : 'Removed from Favorites',
      text2: `${stop.stopName} ${newFavoriteState ? 'saved.' : 'removed.'}`,
    });
  };

  const handleSetOrigin = () => {
    Toast.show({ type: 'info', text1: "Origin Set", text2: `${stop?.stopName} selected as start.` });
    onClose();
  };

  const handleSetDestination = () => {
    Toast.show({ type: 'info', text1: "Destination Set", text2: `${stop?.stopName} selected as end.` });
    onClose();
  };

  const renderArrivalItem = ({ item }: { item: RealTimeArrival }) => (
    <View style={styles.arrivalItem}>
      <View style={styles.arrivalInfo}>
        <View style={[nativeStyles.badge, styles.routeBadge]}>
          <Text style={nativeStyles.badgeText}>
            {item.routeId ? item.routeId.replace('Line-', '') : item.tripId.substring(0, 3)}
          </Text>
        </View>
        <Text style={styles.headsign} numberOfLines={1} ellipsizeMode="tail">
          {item.headsign || `Towards Destination`}
        </Text>
      </View>
      <View style={styles.arrivalTimeContainer}>
        <Text style={styles.arrivalTimeText}>{formatArrivalTime(item.arrivalTime, item.delay)}</Text>
        {item.delay > 60 && (
          <Text style={styles.delayTextNegative}>({Math.round(item.delay / 60)} min delay)</Text>
        )}
        {item.delay > 0 && item.delay <= 60 && (
          <Text style={styles.delayTextSlight}>(slight delay)</Text>
        )}
        {!item.delay && (<Text style={styles.delayTextNormal}>On time</Text>)}
      </View>
    </View>
  );

  if (!stop) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[nativeStyles.sheetContent, styles.sheetContainer]}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerTextContainer}>
              <Text style={nativeStyles.title}>{stop.stopName}</Text>
              <Text style={styles.sheetDescription}>Stop ID: {stop.stopId}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => fetchArrivals(false)} style={nativeStyles.iconWrapper} disabled={loadingArrivals}>
                <RefreshCw size={iconSizes.small} color={colors.iconColor} style={loadingArrivals ? styles.spinning : {}} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFavoriteToggle} style={nativeStyles.iconWrapper}>
                <Star size={iconSizes.medium} color={isFav ? colors.accent : colors.iconColor} fill={isFav ? colors.accent : 'none'}/>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={nativeStyles.iconWrapper}>
                <X size={iconSizes.medium} color={colors.iconColor} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={nativeStyles.separator} />

          <Text style={styles.arrivalsTitle}>Upcoming Arrivals</Text>
          {loadingArrivals ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }}/>
          ) : error ? (
            <Text style={nativeStyles.errorMessage}>{error}</Text>
          ) : arrivals.length > 0 ? (
            <FlatList
              data={arrivals}
              renderItem={renderArrivalItem}
              keyExtractor={(item, index) => `${item.tripId}-${index}-${item.arrivalTime}`}
              ItemSeparatorComponent={() => <View style={styles.arrivalSeparator} />}
              style={styles.arrivalsList}
            />
          ) : (
            <Text style={styles.noArrivalsText}>No upcoming arrivals found.</Text>
          )}

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={[nativeStyles.button, nativeStyles.buttonOutline, styles.footerButton]} onPress={handleSetOrigin}>
              <MapPin size={iconSizes.small} color={colors.primary} style={{marginRight: 8}}/>
              <Text style={[nativeStyles.buttonText, nativeStyles.buttonTextOutline]}>Set as Origin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[nativeStyles.button, {backgroundColor: colors.accent}, styles.footerButton]} onPress={handleSetDestination}>
              <Navigation size={iconSizes.small} color={colors.accentForeground} style={{marginRight: 8}}/>
              <Text style={[nativeStyles.buttonText, {color: colors.accentForeground}]}>Set as Destination</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  sheetDescription: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinning: {
    // Basic spin animation could be more complex with Animated API
    transform: [{ rotate: '0deg' }] // Placeholder for actual animation
  },
  arrivalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.foreground,
    marginVertical: 12,
  },
  arrivalsList: {
    flexGrow: 0, // Important for ScrollView inside Modal/View
  },
  arrivalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  arrivalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3, // Give more space to headsign
  },
  routeBadge: {
    width: 50, // Fixed width for badge
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: colors.primary, // Ensure badge has primary bg
  },
  headsign: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
    flex: 1, // Allow text to take remaining space and wrap/truncate
  },
  arrivalTimeContainer: {
    alignItems: 'flex-end',
    flex: 2, // Give enough space for time and delay
  },
  arrivalTimeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.foreground,
    textAlign: 'right',
  },
  delayTextNegative: {
    fontSize: 12,
    color: colors.destructive,
    textAlign: 'right',
  },
  delayTextSlight: {
    fontSize: 12,
    color: '#F59E0B', // approx yellow-600
    textAlign: 'right',
  },
  delayTextNormal: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'right',
  },
  arrivalSeparator: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  noArrivalsText: {
    textAlign: 'center',
    color: colors.mutedForeground,
    marginVertical: 20,
    fontSize: 16,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row', // For icon and text
    justifyContent: 'center',
    alignItems: 'center'
  },
});
