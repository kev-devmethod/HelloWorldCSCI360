import React from 'react';
import { Circle } from 'react-native-maps';

interface MapRadiusProps {
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export const MapRadius = ({ latitude, longitude, radius }: MapRadiusProps) => {
  return (
    <Circle
      center={{
        latitude,
        longitude,
      }}
      radius={radius}
      fillColor="rgba(66, 133, 244, 0.2)"
      strokeColor="rgba(66, 133, 244, 0.5)"
      strokeWidth={2}
      zIndex={2}
    />
  );
}; 