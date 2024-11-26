import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { LocationInputForm } from '../../components/LocationInputForm';
import { formatDate, calculateTimeRemaining, getTodayFormatted, handleExpiredLocation } from '../../utils/timeUtils';
import { LocationData } from '../../types/location';
import { useFocusEffect } from 'expo-router';

type Location = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  isEvent?: boolean;
  startTime?: string;
  duration?: number;
};

type User = {
  displayName: string;
  badges: string[];
};

function Index() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [editingLocation, setEditingLocation] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    eventDate: getTodayFormatted(),
    startTime: '12:00',
    startPeriod: 'AM',
    duration: '01:00'
  });
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
      fetchTopUsers();
    }, [])
  );

  useEffect(() => {
    const locationsCollection = collection(db, 'locations');
    const unsubscribe = onSnapshot(locationsCollection, async (snapshot) => {
      const locationData = [] as Location[];
      
      for (const doc of snapshot.docs) {
        const location = {
          id: doc.id,
          title: doc.data().title,
          description: doc.data().description,
          latitude: doc.data().latitude,
          longitude: doc.data().longitude,
          isEvent: doc.data().isEvent || false,
          startTime: doc.data().startTime,
          duration: doc.data().duration
        } as Location;

        const timeInfo = location.startTime ? 
          calculateTimeRemaining(location.startTime, location.duration) : null;

        if (timeInfo?.isExpired) {
          await handleExpiredLocation(location);
        } else {
          locationData.push(location);
        }
      }
      
      setLocations(locationData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      forceUpdate({});
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchLocations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'locations'));
      const locationData = [] as Location[];
      
      for (const doc of querySnapshot.docs) {
        const location = {
          id: doc.id,
          title: doc.data().title,
          description: doc.data().description,
          latitude: doc.data().latitude,
          longitude: doc.data().longitude,
          isEvent: doc.data().isEvent || false,
          startTime: doc.data().startTime,
          duration: doc.data().duration
        } as Location;

        const timeInfo = location.startTime ? 
          calculateTimeRemaining(location.startTime, location.duration) : null;

        if (timeInfo?.isExpired) {
          await handleExpiredLocation(location);
        } else {
          locationData.push(location);
        }
      }
      
      setLocations(locationData);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchTopUsers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('badges', 'desc'),
        limit(3)
      );
      const querySnapshot = await getDocs(q);
      const userData = querySnapshot.docs.map(doc => ({
        displayName: doc.data().displayName || doc.data().email?.split('@')[0] || 'Anonymous',
        badges: doc.data().badges || []
      }));
      setTopUsers(userData);
    } catch (error) {
      console.error('Error fetching top users:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchLocations(), fetchTopUsers()]);
    setRefreshing(false);
  }, []);

  const handleSeeAll = () => {
    router.push('./map');
  };

  const handleLocationPress = (location: Location) => {
    router.push({
      pathname: "./map",
      params: { 
        focusLat: location.latitude,
        focusLong: location.longitude,
        locationId: location.id
      }
    });
  };

  const handleEditPress = (location: LocationData) => {
    setSelectedLocation(location);
    
    try {
      // Parse the existing startTime
      const startDate = location.startTime ? new Date(location.startTime) : new Date();
      let hours = startDate.getHours();
      const minutes = startDate.getMinutes();
      let period = 'AM';
      
      // Convert 24hr to 12hr format
      if (hours >= 12) {
        period = 'PM';
        if (hours > 12) hours -= 12;
      }
      if (hours === 0) hours = 12;

      // Convert duration from minutes to HH:MM
      const duration = location.duration || 60;
      const durationHours = Math.floor(duration / 60);
      const durationMinutes = duration % 60;
      
      setEditingLocation({
        name: location.title || '',
        description: location.description || '',
        latitude: (location.latitude || 0).toString(),
        longitude: (location.longitude || 0).toString(),
        eventDate: startDate.toLocaleDateString('en-US'),
        startTime: `${hours}:${minutes.toString().padStart(2, '0')}`, // Simpler time format
        startPeriod: period,  // Separate AM/PM
        duration: `${durationHours}:${durationMinutes.toString().padStart(2, '0')}`
      });
      
      setEditModalVisible(true);
    } catch (error) {
      console.error('Error formatting location data for edit:', error);
      Alert.alert('Error', 'Failed to load location data for editing');
    }
  };

  const handleUpdateLocation = async (locationData: Partial<LocationData>) => {
    if (!selectedLocation) return;
    
    try {
      const locationRef = doc(db, 'locations', selectedLocation.id);
      await updateDoc(locationRef, locationData);
      setEditModalVisible(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Error updating location:', error);
      Alert.alert('Error', 'Failed to update location');
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      await deleteDoc(doc(db, 'locations', locationId));
      setEditModalVisible(false);
      Alert.alert('Success', 'Location deleted successfully');
    } catch (error) {
      console.error('Error deleting location:', error);
      Alert.alert('Error', 'Failed to delete location');
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#7a232f']}  // Android
          tintColor="#7a232f"   // iOS
        />
      }
    >
      <Text style={styles.title}>Weekly Leaderboard</Text>
      
      <View style={styles.leaderboardContainer}>
        <View style={styles.leftContainer}>
          {topUsers[0] && (
            <View style={[styles.leaderboardItem, styles.firstPlace]}>
              <Ionicons name="trophy" size={100} color="#FFD700" style={styles.trophyIcon} />
              <Text style={styles.rank}>#1</Text>
              <Text style={styles.username}>{topUsers[0].displayName}</Text>
              <Text style={styles.badgeCount}>{topUsers[0].badges.length} badges</Text>
            </View>
          )}
        </View>

        <View style={styles.rightContainer}>
          {topUsers[1] && (
            <View style={[styles.leaderboardItem, styles.secondPlace]}>
              <Ionicons name="trophy" size={80} color="#C0C0C0" style={styles.trophyIcon} />
              <Text style={styles.rank}>#2</Text>
              <Text style={styles.username}>{topUsers[1].displayName}</Text>
              <Text style={styles.badgeCount}>{topUsers[1].badges.length} badges</Text>
            </View>
          )}
          {topUsers[2] && (
            <View style={[styles.leaderboardItem, styles.thirdPlace]}>
              <Ionicons name="trophy" size={70} color="#CD7F32" style={styles.trophyIcon} />
              <Text style={styles.rank}>#3</Text>
              <Text style={styles.username}>{topUsers[2].displayName}</Text>
              <Text style={styles.badgeCount}>{topUsers[2].badges.length} badges</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Featured Locations</Text>

      {locations.map(location => {
        const timeInfo = location.startTime ? calculateTimeRemaining(location.startTime, location.duration) : null;
        const isActive = timeInfo?.isActive;

        return (
          <TouchableOpacity 
            key={location.id}
            style={[
              styles.locationCard,
              timeInfo && !isActive && { backgroundColor: '#888888' },
              timeInfo && isActive && { backgroundColor: '#7a232f' }
            ]}
            onPress={() => handleLocationPress(location)}
          >
            <View style={styles.locationInfo}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationName}>{location.title}</Text>
                {isAdmin && (
                  <TouchableOpacity 
                    onPress={() => handleEditPress(location as LocationData)}
                    style={styles.editButton}
                  >
                    <Ionicons name="pencil" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              {location.duration && (
                <View style={styles.durationBox}>
                  <Ionicons name="time-outline" size={14} color="#fff" />
                  <Text style={styles.durationText}>
                    Event Duration: {Math.floor(location.duration / 60)}h{location.duration % 60 > 0 ? ` ${location.duration % 60}m` : ''}
                  </Text>
                </View>
              )}

              <Text style={styles.locationDescription}>{location.description}</Text>
              
              <View style={styles.footerContainer}>
                {timeInfo && (
                  <View style={styles.timeContainer}>
                    <View style={[
                      styles.timeProgressBar,
                      { backgroundColor: '#666666' }  // Darker grey background
                    ]}>
                      {isActive && (
                        <View
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              width: `${(timeInfo.totalSeconds / (location.duration * 60)) * 100}%`,
                              backgroundColor: '#2196F3',  // Blue progress
                              borderRadius: 5,
                            }
                          ]}
                        />
                      )}
                      <Text style={styles.timeText}>
                        {isActive ? 'Time left to claim: ' : 'Active in: '}
                        {timeInfo.days > 0 ? `${timeInfo.days}d ` : ''}
                        {timeInfo.hours > 0 ? `${timeInfo.hours}h ` : ''}
                        {timeInfo.minutes > 0 ? `${timeInfo.minutes}m ` : ''}
                        {timeInfo.seconds}s
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity 
        style={styles.seeAllButton}
        onPress={handleSeeAll}
      >
        <Text style={styles.seeAllText}>See All Locations</Text>
      </TouchableOpacity>

      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <LocationInputForm
            newLocation={editingLocation}
            setNewLocation={setEditingLocation}
            onSubmit={handleUpdateLocation}
            onClose={() => setEditModalVisible(false)}
            onDelete={() => selectedLocation && handleDeleteLocation(selectedLocation.id)}
            useCurrentLocation={() => {}}
            formatDate={formatDate}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    color: '#ffffff',
  },
  locationCard: {
    backgroundColor: '#7a232f',
    borderRadius: 12,
    marginBottom: 45,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'visible',
  },
  locationImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  locationInfo: {
    padding: 16,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 100,
    position: 'relative',
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#fff',
    flexShrink: 1,
    marginRight: 8,
  },
  locationDescription: {
    fontSize: 14,
    marginBottom: 10,
    color: '#eee',
  },
  seeAllButton: {
    backgroundColor: '#7a232f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  seeAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewButton: {
    backgroundColor: '#7a232f',
    padding: 8,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaderboardContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 20,
    height: 200,
  },
  leftContainer: {
    flex: 1,
    marginRight: 8,
  },
  rightContainer: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'space-between',
  },
  leaderboardItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  firstPlace: {
    backgroundColor: '#FFF8E7',  // Soft cream/gold
    flex: 1,
    borderWidth: 2,
    borderColor: '#FFD700',  // Gold border
  },
  secondPlace: {
    backgroundColor: '#F5F5F5',  // Light grey
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#C0C0C0',  // Silver border
  },
  thirdPlace: {
    backgroundColor: '#FFF1E6',  // Soft peach/bronze
    borderWidth: 2,
    borderColor: '#DEB887',  // Bronze border
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeCount: {
    fontSize: 14,
    color: '#7a232f',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginLeft: 16,
    color: '#ffffff',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTiming: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 6,
    maxWidth: '50%',
  },
  timingText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
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
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 5,
    width: '80%',
    alignSelf: 'center',
    position: 'absolute',
    bottom: -40,
    left: '10%',
    zIndex: 1,
  },
  timeProgressBar: {
    borderRadius: 5,
    overflow: 'hidden',
    padding: 8,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    zIndex: 2,
  },
  durationBox: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
  },
  durationText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },
  footerContainer: {
    marginTop: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  trophyIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.7,
    zIndex: -1,
    transform: [{ rotate: '15deg' }],
  },
});

export default Index;
