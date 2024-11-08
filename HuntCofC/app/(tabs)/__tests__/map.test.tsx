import React from 'react';
import { View } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import { jest } from '@jest/globals';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import MapScreen from '../map';
import { FEATURED_LOCATIONS } from '../../../constants/locations';
import { PermissionStatus } from 'expo-location';

// Mock the external dependencies
jest.mock('react-native-maps', () => {
  const MockMapView = (props: any) => {
    return <View testID="mock-map-view">{props.children}</View>;
  };
  MockMapView.Marker = (props: any) => <View testID="mock-marker">{props.children}</View>;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMapView.Marker,
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn()
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn()
}));

describe('MapScreen', () => {
  const mockLocation = {
    coords: {
      latitude: 32.7831,
      longitude: -79.9373,
      altitude: null,
      accuracy: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: 1234567890,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (Location.requestForegroundPermissionsAsync as jest.MockedFunction<typeof Location.requestForegroundPermissionsAsync>)
      .mockResolvedValue({ 
        status: PermissionStatus.GRANTED,
        granted: true,
        canAskAgain: true,
        expires: 'never'
      });
    (Location.getCurrentPositionAsync as jest.MockedFunction<typeof Location.getCurrentPositionAsync>)
      .mockResolvedValue(mockLocation);
  });

  it('renders loading state when location is not yet available', () => {
    const { queryByTestId } = render(<MapScreen />);
    expect(queryByTestId('mock-map-view')).toBeNull();
  });

  it('requests location permissions on mount', async () => {
    render(<MapScreen />);
    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    });
  });

  it('renders map and markers when location is available', async () => {
    const { getByTestId, getAllByTestId } = render(<MapScreen />);
    
    await waitFor(() => {
      expect(getByTestId('mock-map-view')).toBeTruthy();
      expect(getAllByTestId('mock-marker')).toHaveLength(FEATURED_LOCATIONS.length);
    });
  });

  it('handles location permission denial', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Location.requestForegroundPermissionsAsync as jest.MockedFunction<typeof Location.requestForegroundPermissionsAsync>)
      .mockResolvedValue({ 
        status: PermissionStatus.DENIED,
        canAskAgain: true,
        granted: false,
        expires: 'never'
      });
    
    render(<MapScreen />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Permission to access location was denied');
    });
    
    consoleSpy.mockRestore();
  });

  it('shows loading indicator initially', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('handles location fetch errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Location.getCurrentPositionAsync as jest.MockedFunction<typeof Location.getCurrentPositionAsync>)
      .mockRejectedValue(new Error('Failed to get location'));
    
    render(<MapScreen />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error getting location:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('opens directions when marker callout is pressed', async () => {
    const { getAllByTestId } = render(<MapScreen />);
    
    await waitFor(() => {
      const markers = getAllByTestId('mock-marker');
      expect(markers).toHaveLength(FEATURED_LOCATIONS.length);
    });

    const firstLocation = FEATURED_LOCATIONS[0];
    const expectedUrl = `maps://app?saddr=${mockLocation.coords.latitude},${mockLocation.coords.longitude}&daddr=${firstLocation.coordinate.latitude},${firstLocation.coordinate.longitude}`;
    
    fireEvent.press(getAllByTestId('marker-callout')[0]);
    
    expect(Linking.openURL).toHaveBeenCalledWith(expectedUrl);
  });

  it('shows location details when marker is pressed', async () => {
    const { getAllByTestId, getByText } = render(<MapScreen />);
    
    await waitFor(() => {
      const markers = getAllByTestId('mock-marker');
      expect(markers).toHaveLength(FEATURED_LOCATIONS.length);
    });

    fireEvent.press(getAllByTestId('mock-marker')[0]);
    
    expect(getByText(FEATURED_LOCATIONS[0].name)).toBeTruthy();
    expect(getByText(FEATURED_LOCATIONS[0].description)).toBeTruthy();
  });
}); 