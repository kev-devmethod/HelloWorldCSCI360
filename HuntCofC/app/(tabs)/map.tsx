import React, { useState, useEffect, useRef } from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, Image, TouchableOpacity, Modal, TextInput, Text, Switch } from 'react-native';
import { MapRadius } from '../../components/MapRadius';
import { BadgeNotification } from '../../components/BadgeNotification';
import { checkLocationAndAwardBadge, getDistance } from '../../utils/locationBadges';
import * as Location from 'expo-location';
import { collection, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';

interface LocationData {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description: string;
  isNearby?: boolean;
}

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<null | {
    latitude: number;
    longitude: number;
  }>(null);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [userHeading, setUserHeading] = useState<number>(0);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: ''
  });
  const [nearbyLocations, setNearbyLocations] = useState<Set<string>>(new Set());
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const router = useRouter();

  // Fetch locations from Firebase
  useEffect(() => {
    const locationsCollection = collection(db, 'locations');
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(locationsCollection, (snapshot) => {
      const locationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LocationData[];
      setLocations(locationList);
    }, (error) => {
      console.error('Error listening to locations:', error);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const checkNearbyLocations = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Update nearby locations
      const nearby = new Set<string>();
      locations.forEach(loc => {
        const distance = getDistance(latitude, longitude, loc.latitude, loc.longitude);
        if (distance <= 50) {
          nearby.add(loc.id);
        }
      });
      setNearbyLocations(nearby);
    } catch (error) {
      console.error('Error checking nearby locations:', error);
    }
  };

  const claimBadge = async (location: LocationData) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      Alert.alert(
        "Login Required",
        "You need to be logged in to claim badges."
      );
      return;
    }

    const result = await checkLocationAndAwardBadge(
      userLocation!.latitude,
      userLocation!.longitude,
      location.latitude,
      location.longitude,
      location.id,
      location.title
    );

    if (result) {
      if (result.includes('Already have')) {
        Alert.alert(
          "Badge Already Claimed",
          result
        );
      } else {
        setNewBadge(result);
      }
    }
  };

  useEffect(() => {
    const locationCheck = setInterval(checkNearbyLocations, 30000);
    checkNearbyLocations(); // Initial check
    return () => clearInterval(locationCheck);
  }, [locations]); // Add locations as dependency

  useEffect(() => {
    let headingSubscription: Location.LocationSubscription;

    const startHeadingUpdates = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      headingSubscription = await Location.watchHeadingAsync((heading) => {
        setUserHeading(heading.magHeading);
      });
    };

    startHeadingUpdates();
    return () => {
      headingSubscription?.remove();
    };
  }, []);

  const handleSubmit = async () => {
    try {
      const locationData = {
        title: newLocation.name,
        description: newLocation.description,
        latitude: Number(newLocation.latitude),
        longitude: Number(newLocation.longitude)
      };

      await addDoc(collection(db, 'locations'), locationData);
      setIsFormVisible(false);
      setNewLocation({ 
        name: '', 
        description: '', 
        latitude: '', 
        longitude: ''
      });
    } catch (error) {
      console.error('Error adding location:', error);
    }
  };

  const useCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setNewLocation({
        ...newLocation,
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString()
      });
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  // Add this useEffect to handle focusing on a location
  useEffect(() => {
    if (params.focusLat && params.focusLong) {
      mapRef.current?.animateToRegion({
        latitude: parseFloat(params.focusLat as string),
        longitude: parseFloat(params.focusLong as string),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  }, [params]);

  const handleMarkerPress = (location: LocationData) => {
    setSelectedLocation(location);
  };

  // Add this function
  const formatDate = (text: string) => {
    // Remove any non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Add slashes automatically
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2);
    } else {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
    }
  };

  return (
    <View style={styles.container}>
      {newBadge && (
        <BadgeNotification 
          badgeName={newBadge} 
          onClose={() => setNewBadge(null)} 
        />
      )}
      
      <MapView 
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 32.7835,
          longitude: -79.9375,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
        minZoomLevel={14}
        rotateEnabled={true}
        moveOnMarkerPress={false}
      >
        {userLocation && (
          <MapRadius
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            radius={50}
          />
        )}
        
        {locations.map(location => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.title}
            description={location.description}
            onPress={() => handleMarkerPress(location)}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{location.title}</Text>
                <Text style={styles.calloutDescription}>{location.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {selectedLocation && nearbyLocations.has(selectedLocation.id) && (
        <View style={styles.claimBadgeContainer}>
          <TouchableOpacity 
            style={styles.claimButton}
            onPress={() => claimBadge(selectedLocation)}
          >
            <Text style={styles.claimButtonText}>
              Claim {selectedLocation.title} Badge
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setIsFormVisible(true)}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Location Name"
              placeholderTextColor="#444"
              value={newLocation.name}
              onChangeText={(text) => setNewLocation({...newLocation, name: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#444"
              value={newLocation.description}
              onChangeText={(text) => setNewLocation({...newLocation, description: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Latitude"
              placeholderTextColor="#444"
              keyboardType="numeric"
              value={newLocation.latitude}
              onChangeText={(text) => setNewLocation({...newLocation, latitude: text})}
            />
            <TextInput
              style={styles.input}
              placeholder="Longitude"
              placeholderTextColor="#444"
              keyboardType="numeric"
              value={newLocation.longitude}
              onChangeText={(text) => setNewLocation({...newLocation, longitude: text})}
            />
            
            <TouchableOpacity
              style={[styles.button, styles.locationButton]}
              onPress={useCurrentLocation}
            >
              <Text style={styles.buttonText}>Use Current Location</Text>
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsFormVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#7a232f',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  formContainer: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: '#222',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#2196F3',
    marginBottom: 10,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#7a232f',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calloutContainer: {
    minWidth: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutDescription: {
    marginBottom: 10,
  },
  claimBadgeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  claimButton: {
    backgroundColor: '#7a232f',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#222',
  },
  durationContainer: {
    marginBottom: 10,
  },
  durationLabel: {
    fontSize: 16,
    color: '#222',
    marginBottom: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  picker: {
    flex: 1,
    height: 100,
  },
  inputText: {
    color: '#222',
    fontSize: 16,
  },
});

