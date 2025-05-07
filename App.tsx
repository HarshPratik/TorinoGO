
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import NativeMapLoader from '@/components/map/NativeMapLoader'; // Adjusted path
import { View, StyleSheet } from 'react-native';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <NativeMapLoader />
        <StatusBar style="auto" />
        <Toast />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
