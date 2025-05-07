
# Firebase Studio / TorinoGo

This is a NextJS starter in Firebase Studio, now with an Expo (React Native) version for mobile.

## Web Version (Next.js)

To get started with the web version, take a look at `src/app/page.tsx`.

Scripts:
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the Next.js app for production.
- `npm run start`: Starts the Next.js production server.

## Mobile Version (Expo / React Native)

The mobile application is built using Expo. The main entry point is `App.tsx`.

### Prerequisites for Mobile Development
- Node.js (LTS version recommended)
- Expo CLI: `npm install -g expo-cli` (or `yarn global add expo-cli`)
- For running on a physical device: Expo Go app installed on your iOS or Android device.
- For running on an emulator/simulator:
    - Android Studio (for Android Emulator)
    - Xcode (for iOS Simulator, macOS only)

### Running the Mobile App

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Start the Expo development server:**
    ```bash
    npm run expo:start
    # or
    yarn expo:start
    ```
    This will open the Expo DevTools in your browser.

3.  **Run on a device or emulator:**
    *   **On an Android Emulator/Device:**
        *   Press `a` in the terminal where Expo is running, or scan the QR code from Expo DevTools with the Expo Go app.
        *   To build and run the native Android project directly: `npm run expo:android`
    *   **On an iOS Simulator/Device (macOS only):**
        *   Press `i` in the terminal, or scan the QR code from Expo DevTools with the Expo Go app (for physical device).
        *   To build and run the native iOS project directly: `npm run expo:ios`
    *   **In a web browser (for testing, limited native features):**
        *   Press `w` in the terminal. Or `npm run expo:web`.

### Project Structure (Mobile Focus)

- `App.tsx`: Main entry point for the native application.
- `src/components/map/NativeMapContainer.tsx`: Map component using `react-native-maps`.
- `src/components/sheet/NativeStopDetailSheet.tsx`: Bottom sheet for stop details.
- `src/styles/nativeStyles.ts`: Basic styling for native components.
- `src/lib/favoritesStorage.ts`: Uses `AsyncStorage` for local data persistence.
- `assets/`: Contains icons and splash screen images for the native app.
- `app.json`: Expo configuration file.
- `babel.config.js`: Babel configuration for Expo.
- `metro.config.js`: Metro bundler configuration.

### Next Steps for Mobile App
- Adapt UI components from ShadCN/web to React Native equivalents or custom components.
- Implement full route planning feature.
- Connect to real-time data sources.
- Enhance styling and user experience for native platforms.
- Further develop the "Saved Places" feature.
