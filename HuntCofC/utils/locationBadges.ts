import { doc, updateDoc, arrayUnion, getDoc, addDoc, collection, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

// Define the distance threshold (in meters)
const DISTANCE_THRESHOLD = 50; // Adjust this value as needed

// Calculate distance between two points in meters
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export async function checkLocationAndAwardBadge(
  userLat: number,
  userLon: number,
  locationLat: number,
  locationLon: number,
  locationId: string,
  locationName: string
): Promise<string | null> {
  const auth = getAuth();
  if (!auth.currentUser) {
    console.log('No user logged in');
    return null;
  }

  try {
    // First check if user document exists
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    // Create user document if it doesn't exist
    if (!userDoc.exists()) {
      console.log('Creating user document...');
      await setDoc(userRef, {
        email: auth.currentUser.email,
        badges: [],
        createdAt: new Date()
      });
    }

    const distance = getDistance(userLat, userLon, locationLat, locationLon);
    console.log(`Attempting to claim badge for ${locationName}`);
    console.log(`Distance to location: ${Math.round(distance)}m`);
    
    if (distance <= 50) {
      const userData = userDoc.data();
      
      if (!userData?.badges?.includes(locationName)) {
        console.log(`Awarding ${locationName} badge to user ${auth.currentUser.email}`);
        await updateDoc(userRef, {
          badges: arrayUnion(locationName)
        });
        return `Earned ${locationName} Badge!`;
      } else {
        return `Already have ${locationName} Badge!`;
      }
    } else {
      console.log('Too far from location to claim badge');
    }
  } catch (error) {
    console.error('Error checking/awarding badge:', error);
  }
  
  return null;
} 