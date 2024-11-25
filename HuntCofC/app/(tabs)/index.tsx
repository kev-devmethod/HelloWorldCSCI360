import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

type Location = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
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
      <Text style={styles.title}>Top Explorers</Text>
      
      <View style={styles.leaderboardContainer}>
        <View style={styles.leftContainer}>
          {topUsers[0] && (
            <View style={[styles.leaderboardItem, styles.firstPlace]}>
              <Text style={styles.rank}>#1</Text>
              <Text style={styles.username}>{topUsers[0].displayName}</Text>
              <Text style={styles.badgeCount}>{topUsers[0].badges.length} badges</Text>
            </View>
          )}
        </View>

        <View style={styles.rightContainer}>
          {topUsers[1] && (
            <View style={[styles.leaderboardItem, styles.secondPlace]}>
              <Text style={styles.rank}>#2</Text>
              <Text style={styles.username}>{topUsers[1].displayName}</Text>
              <Text style={styles.badgeCount}>{topUsers[1].badges.length} badges</Text>
            </View>
          )}
          {topUsers[2] && (
            <View style={[styles.leaderboardItem, styles.thirdPlace]}>
              <Text style={styles.rank}>#3</Text>
              <Text style={styles.username}>{topUsers[2].displayName}</Text>
              <Text style={styles.badgeCount}>{topUsers[2].badges.length} badges</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Featured Locations</Text>

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
  }
});

export default Index;
