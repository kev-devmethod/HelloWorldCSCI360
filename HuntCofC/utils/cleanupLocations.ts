import { db } from '../firebaseConfig';
import { collection, getDocs, query } from 'firebase/firestore';
import { calculateTimeRemaining, handleExpiredLocation } from './timeUtils';
import { LocationData } from '../types/location';

export const cleanupExpiredLocations = async () => {
  try {
    console.log('Starting cleanup of expired locations...');
    
    const locationsRef = collection(db, 'locations');
    const querySnapshot = await getDocs(query(locationsRef));
    
    let expiredCount = 0;
    const locations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LocationData[];

    for (const location of locations) {
      const timeInfo = location.startTime ? 
        calculateTimeRemaining(location.startTime, location.duration) : null;
      
      if (timeInfo?.isExpired) {
        await handleExpiredLocation(location);
        expiredCount++;
        console.log(`Moved expired location: ${location.title}`);
      }
    }

    console.log(`Cleanup complete. Moved ${expiredCount} expired locations.`);
    return expiredCount;
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}; 