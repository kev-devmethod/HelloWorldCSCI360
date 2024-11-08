import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, Text, Image, View } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { ThemedView } from '@/components/ThemedView';
import * as Linking from 'expo-linking';
import { FEATURED_LOCATIONS } from '../../constants/locations';

const MapScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<typeof FEATURED_LOCATIONS[0] | null>(null);
  const [showDirections, setShowDirections] = useState(false);

  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      // Get current location
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const handleGetDirections = (destination: typeof FEATURED_LOCATIONS[0]) => {
    if (!location) return;
    
    // Open Apple Maps with directions
    const url = `maps://app?saddr=${location.coords.latitude},${location.coords.longitude}&daddr=${destination.coordinate.latitude},${destination.coordinate.longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
    });
  };

  const showAllLocations = () => {
    if (!mapRef.current || !location) return;

    const coordinates = [
      { latitude: location.coords.latitude, longitude: location.coords.longitude },
      ...FEATURED_LOCATIONS.map(loc => loc.coordinate)
    ];

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  const handleMarkerPress = (location: typeof FEATURED_LOCATIONS[0]) => {
    setSelectedLocation(location);
  };

  return (
    <ThemedView style={styles.container}>
      {location && (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            mapType="standard"
          >
            {/* Customized markers */}
            {FEATURED_LOCATIONS.map((loc) => (
              <Marker
                key={loc.id}
                coordinate={loc.coordinate}
                title={loc.name}
                onPress={() => handleMarkerPress(loc)}
              >
                {/* Option 1: Using an image */}
                <Image 
                  source={require('../../assets/images/custom-marker.png')} // your image path
                  style={styles.markerImage}
                />

                {/* Option 2: Using a custom component */}
                <View style={styles.customMarker}>
                  <Text style={styles.markerText}></Text>
                  {/* Or use any other emoji: 📌 🎯 🏛️ 🏪 🏫 */}
                </View>

                {/* Optional: Add a custom callout (popup) */}
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{loc.name}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
          <TouchableOpacity onPress={showAllLocations}>
            <Text style={styles.button}>Show All Locations</Text>
          </TouchableOpacity>
        </>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    margin: 10,
    alignSelf: 'center',
  },
  markerImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  customMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    fontSize: 24, // Adjust size as needed
  },
  callout: {
    padding: 10,
    borderRadius: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
  },
});

export default MapScreen;
