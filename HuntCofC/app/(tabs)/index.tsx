import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

type Location = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
};

function Index() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLocations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'locations'));
      const locationData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        latitude: doc.data().latitude,
        longitude: doc.data().longitude
      }));
      setLocations(locationData);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLocations();
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
      <Text style={styles.title}>Featured Locations</Text>
      
      {locations.map(location => (
        <TouchableOpacity 
          key={location.id}
          style={styles.locationCard}
          onPress={() => handleLocationPress(location)}
        >
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.title}</Text>
            <Text style={styles.locationDescription}>{location.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        style={styles.seeAllButton}
        onPress={handleSeeAll}
      >
        <Text style={styles.seeAllText}>See All Locations</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
  },
  locationCard: {
    backgroundColor: '#7a232f',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  locationInfo: {
    padding: 16,
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  locationDescription: {
    fontSize: 14,
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
});

export default Index;
