import { db } from '../firebaseConfig';
import { collection, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { LocationData } from '../types/location';

export const handleExpiredLocation = async (location: LocationData) => {
  try {
    // Add to expired collection
    await addDoc(collection(db, 'expiredLocations'), {
      ...location,
      expiredAt: new Date().toISOString()
    });

    // Remove from active locations
    await deleteDoc(doc(db, 'locations', location.id));
  } catch (error) {
    console.error('Error handling expired location:', error);
  }
};

export const calculateTimeRemaining = (startTime: string, duration: number) => {
  if (!startTime || !duration) {
    return null;
  }

  // Create dates in local timezone
  const start = new Date(startTime.replace('Z', ''));
  const now = new Date();
  const end = new Date(start.getTime() + duration * 60000);

  // Check if event has expired
  if (now > end) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isActive: false,
      isExpired: true,
      totalSeconds: 0
    };
  }

  // Rest of the calculation remains the same
  const isActive = now >= start && now <= end;
  const targetTime = isActive ? end : start;
  const timeDiff = targetTime.getTime() - now.getTime();

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    isActive,
    isExpired: false,
    totalSeconds: Math.max(0, timeDiff / 1000)
  };
};

export const formatDate = (text: string) => {
  const numbers = text.replace(/\D/g, '');
  
  // Don't allow more than 8 digits (MMDDYYYY)
  if (numbers.length > 8) return text.slice(0, -1);
  
  if (numbers.length <= 2) {
    const month = parseInt(numbers);
    if (month > 12) return '12';
    return numbers;
  }
  
  if (numbers.length <= 4) {
    const day = parseInt(numbers.slice(2));
    if (day > 31) return numbers.slice(0, 2) + '/31';
    return numbers.slice(0, 2) + '/' + numbers.slice(2);
  }
  
  return numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
};

export const getTodayFormatted = () => {
  const today = new Date();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${month}/${day}/${year}`;
}; 