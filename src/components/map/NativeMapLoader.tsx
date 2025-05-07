
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import NativeMapContainer from './NativeMapContainer';
import { colors, nativeStyles } from '@/styles/nativeStyles';

export default function NativeMapLoader() {
  // In a native context, dynamic import for client-side only rendering is less of a concern
  // than it is in Next.js SSR. We can directly render the map container.
  // We might still want a loading indicator while permissions are checked or initial data loads.

  return (
    <View style={styles.fullScreen}>
      <NativeMapContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
