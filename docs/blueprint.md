# **App Name**: TorinoGo

## Core Features:

- Interactive Map Display: Display an interactive map centered on the user's current GPS location with GTT bus, tram, and metro stops using OpenStreetMap tiles. Show user location with a distinct marker and a button to re-center the map.
- Saved Places Management: Allow users to save favorite locations and stops, accessible for quick selection as origin/destination in route planning. Requires Firebase Authentication and Firestore.
- Basic Route Planning: Calculate routes client-side by finding nearby stops to origin/destination, identifying direct lines or lines requiring one transfer, and using GTFS-RT data for timing. Acknowledge limitations in finding optimal multi-transfer routes.

## Style Guidelines:

- Primary color: Teal (#008080) to reflect Turin's urban environment.
- Secondary color: Light Gray (#F0F0F0) for clean backgrounds.
- Accent: Burnt Orange (#CC6633) for interactive elements and calls to action, drawing inspiration from the city's architecture.
- Use clear and recognizable icons for different transportation modes (bus, tram, metro) and map markers.
- Employ a bottom sheet for the Stop Detail View to smoothly overlay information on the map.