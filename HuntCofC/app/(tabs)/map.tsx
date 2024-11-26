import React, { useState, useEffect, useRef } from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, TouchableOpacity, Modal, Text, Alert } from 'react-native';
import { MapRadius } from '../../components/MapRadius';
import { BadgeNotification } from '../../components/BadgeNotification';
import { checkLocationAndAwardBadge, getDistance } from '../../utils/locationBadges';
import * as Location from 'expo-location';
import { collection, getDocs, addDoc, onSnapshot, getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { LocationInputForm } from '../../components/LocationInputForm';
import { LocationData } from '../../types/location';
import { calculateTimeRemaining, formatDate, getTodayFormatted, handleExpiredLocation } from '../../utils/timeUtils';
import { LinearGradient } from 'expo-linear-gradient';

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<null | { latitude: number; longitude: number; }>(null);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    eventDate: getTodayFormatted(),
    startTime: '12:00',
    startPeriod: 'AM',
    duration: '1'
  });
  const [nearbyLocations, setNearbyLocations] = useState<Set<string>>(new Set());
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inactiveMessage, setInactiveMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Location.LocationGeocodedLocation[]>([]);
  const [currentZoom, setCurrentZoom] = useState(15);
  
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();

  // Fetch locations from Firebase
  useEffect(() => {
    const locationsCollection = collection(db, 'locations');
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(locationsCollection, async (snapshot) => {
      const locationList = [] as LocationData[];
      
      for (const doc of snapshot.docs) {
        const location = { id: doc.id, ...doc.data() } as LocationData;
        const timeInfo = location.startTime ? 
          calculateTimeRemaining(location.startTime, location.duration) : null;

        if (timeInfo?.isExpired) {
          await handleExpiredLocation(location);
        } else {
          locationList.push(location);
        }
      }
      
      setLocations(locationList);
    }, (error) => {
      console.error('Error listening to locations:', error);
    });

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
    // Initial check
    checkNearbyLocations();
    
    // Reduce frequency of location checks (from 30000 to 60000 ms)
    const locationCheck = setInterval(checkNearbyLocations, 60000); // Check every minute instead of every 30 seconds
    
    return () => clearInterval(locationCheck);
  }, [locations]);

  const handleSubmit = async () => {
    try {
      // Convert 12-hour format to 24-hour format
      const startHour = newLocation.startTime.split(':')[0];
      const startMinute = newLocation.startTime.split(':')[1] || '00';
      
      // Convert to 24-hour format
      let start24Hour = parseInt(startHour);
      if (newLocation.startPeriod === 'PM' && start24Hour !== 12) start24Hour += 12;
      if (newLocation.startPeriod === 'AM' && start24Hour === 12) start24Hour = 0;
      
      // Create date string
      const startDateTime = `${newLocation.eventDate} ${start24Hour.toString().padStart(2, '0')}:${startMinute}`;

      const locationData = {
        title: newLocation.name,
        description: newLocation.description,
        latitude: Number(newLocation.latitude),
        longitude: Number(newLocation.longitude),
        startTime: startDateTime,
        duration: parseInt(newLocation.duration)
      };

      await addDoc(collection(db, 'locations'), locationData);
      setIsFormVisible(false);
      setNewLocation({ 
        name: '', 
        description: '', 
        latitude: '', 
        longitude: '',
        eventDate: getTodayFormatted(),
        startTime: '12:00',
        startPeriod: 'AM',
        duration: '1'
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check admin status whenever auth state changes
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().isAdmin === true);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      {newBadge && (
        <BadgeNotification 
          badgeName={newBadge} 
          onClose={() => setNewBadge(null)} 
        />
      )}
      
      {inactiveMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{inactiveMessage}</Text>
        </View>
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
        onRegionChange={(region) => {
          // Calculate zoom level from latitudeDelta
          const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
          setCurrentZoom(zoom);
        }}
        showsUserLocation={true}
        followsUserLocation={true}
        minZoomLevel={12}
        maxZoomLevel={20}
        moveOnMarkerPress={false}
        userLocationFastestInterval={5000}
        zoomEnabled={true}
        zoomControlEnabled={true}
      >
        {userLocation && (
          <MapRadius
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            radius={50}
          />
        )}
        
        {locations.map(location => {
          const timeInfo = location.startTime ? calculateTimeRemaining(location.startTime, location.duration) : null;
          const isActive = timeInfo?.isActive;
          const isUpcoming = timeInfo && !timeInfo.isActive && !timeInfo.isExpired;
          const isExpired = timeInfo?.isExpired;

          return (
            <Marker
              key={location.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              onPress={() => handleMarkerPress(location)}
              zIndex={0}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={[
                styles.markerContainer,
                {
                  transform: [{ scale: Math.max(0.5, Math.min(1, currentZoom / 15)) }]
                }
              ]}>
                <View style={[
                  styles.titleContainer,
                  { backgroundColor: isUpcoming ? '#666666' : 'white' }
                ]}>
                  <Ionicons 
                    name="location" 
                    size={18}
                    color={isUpcoming ? 'white' : '#7a232f'}
                    style={styles.titleIcon}
                  />
                  <Text style={[
                    styles.markerTitle,
                    isUpcoming && { color: 'white' }
                  ]}>{location.title}</Text>
                </View>
                <View style={[
                  styles.markerBox,
                  { backgroundColor: '#666666' }
                ]}>
                  {timeInfo && isActive && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          width: `${(timeInfo.totalSeconds / (location.duration * 60)) * 100}%`,
                          backgroundColor: '#2196F3',
                          borderRadius: 8,
                        }
                      ]}
                    />
                  )}
                  <Ionicons name="time" size={14} color="white" />
                  <View style={styles.timeTextContainer}>
                    <Text style={styles.timeText}>
                      {isActive ? 'Time left: ' : 
                       isUpcoming ? 'Active in: ' : 
                       'Expired'}
                      {!isExpired && (
                        <>
                          {timeInfo.days > 0 ? `${timeInfo.days}d ` : ''}
                          {timeInfo.hours > 0 ? `${timeInfo.hours}h` : ''}
                          {timeInfo.minutes > 0 ? ` ${timeInfo.minutes}m` : ''}
                        </>
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selectedLocation && nearbyLocations.has(selectedLocation.id) && (
        <View style={styles.claimBadgeContainer}>
          <TouchableOpacity 
            style={[
              styles.claimButton,
              { backgroundColor: '#7a232f' }  // Return to original maroon color
            ]}
            onPress={() => {
              const timeInfo = selectedLocation.startTime ? 
                calculateTimeRemaining(selectedLocation.startTime, selectedLocation.duration) : null;
              
              if (!timeInfo?.isActive) {
                const message = timeInfo ? `${timeInfo.isExpired ? 'Event has ended' : `Available in: ${
                  timeInfo.days ? `${timeInfo.days}d ` : ''
                }${timeInfo.hours ? `${timeInfo.hours}h ` : ''
                }${timeInfo.minutes ? `${timeInfo.minutes}m ` : ''
                }${timeInfo.seconds}s`}` : 'Event not available';
                
                setInactiveMessage(message);
                setTimeout(() => setInactiveMessage(null), 2000);
                return;
              }
              claimBadge(selectedLocation);
            }}
          >
            <Text style={styles.claimButtonText}>
              Claim {selectedLocation.title} Badge
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isAdmin && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsFormVisible(true)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}

      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <LocationInputForm
            newLocation={newLocation}
            setNewLocation={setNewLocation}
            onSubmit={async (locationData) => {
              await addDoc(collection(db, 'locations'), locationData);
              setIsFormVisible(false);
              setNewLocation({ 
                name: '', 
                description: '', 
                latitude: '', 
                longitude: '',
                eventDate: getTodayFormatted(),
                startTime: '12:00',
                startPeriod: 'AM',
                duration: '1'
              });
            }}
            onClose={() => setIsFormVisible(false)}
            useCurrentLocation={useCurrentLocation}
            formatDate={formatDate}
          />
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
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    width: '85%',
    maxHeight: '45%',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  timeContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#222',
    marginBottom: 5,
    marginTop: 10,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  timePickerContainer: {
    flex: 2,
    height: 100,
  },
  periodPickerContainer: {
    flex: 1.5,
    height: 100,
  },
  timePicker: {
    height: 100,
  },
  periodPicker: {
    height: 100,
  },
  timeColon: {
    fontSize: 24,
    marginHorizontal: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    color: '#222',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#222',
  },
  calloutContainer: {
    padding: 10,
    minWidth: 120,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  calloutTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  claimBadgeContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  claimButton: {
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  markerContainer: {
    alignItems: 'center',
    width: 140,
  },
  titleContainer: {
    backgroundColor: 'white',
    padding: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    flexDirection: 'column',
    minWidth: 100,
    maxWidth: 140,
  },
  titleIcon: {
    marginBottom: 2,
    position: 'absolute',
    top: -18,
    zIndex: 1,
  },
  markerTitle: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  markerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#666666',
    overflow: 'hidden',
    width: '85%',
    alignSelf: 'center',
  },
  timeTextContainer: {
    marginLeft: 2,
  },
  timeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 999,
    alignItems: 'center',
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

