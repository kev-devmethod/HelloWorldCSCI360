import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FEATURED_LOCATIONS } from '../../constants/locations';

const Index = () => {
  const router = useRouter();

  const handleSeeAll = () => {
    router.push('./map');
  };

  const handleLocationPress = (locationId: number) => {
    console.log(`Location ${locationId} pressed`);
    
    router.push({
      pathname: "./location/[id]",
      params: { id: locationId }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Featured Locations</Text>
      
      {FEATURED_LOCATIONS.map(location => (
        <TouchableOpacity 
          key={location.id}
          style={styles.locationCard}
          onPress={() => handleLocationPress(location.id)}
        >
          <Image 
            source={location.image}
            style={styles.locationImage}
          />
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
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
};

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
  }
});

export default Index;
